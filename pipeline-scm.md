## Pipeline SCM, collegamento GIT (via SSH) e trigger su push nel main

Per una pipeline semplice gestita tramite "Pipeline from SCM", ho usato questa struttura di Jenkinsfile:

```groovy
pipeline {
    agent any
    stages {
        stage('Unit test') {
            steps {
                echo 'Running unit test...'
                sh 'make auth-unit'
            }
        }
        stage('build') {
            steps {
                echo 'Building application...'
                sh 'make build'
            }
        }
        stage('integration test') {
            steps {
                echo 'Running integration test...'
                sh 'make auth-integration'
            }
        }
    }
}
```

### Come collegare Jenkins al repository via SSH

1. **Genera una coppia di chiavi SSH** sulla macchina dove gira Jenkins (per adesso il mio pc successivamente la VPS hetzner):
   ```sh
   ssh-keygen -t ed25519 -C "jenkins@yourdomain" -f ~/.ssh/jenkins-key
   ```

2. **Aggiungi la chiave pubblica** (`jenkins-key.pub`) come chiave deploy nel repository GitHub:
   - Vai su GitHub → Settings → Deploy keys → Add key
   - Incolla la chiave pubblica e dai i permessi di sola lettura o scrittura se serve push.

3. **Configura la chiave privata** (`jenkins-key`) in Jenkins:
   - Vai su Jenkins → Gestione credenziali → (global) → Aggiungi credenziale → Tipo: "SSH Username with private key"
   - Username: `git` (per GitHub)
   - Incolla la chiave privata.

4. **Configura il job Jenkins**:
   - Scegli "Pipeline script from SCM"
   - Inserisci l’URL SSH del repository (es: `git@github.com:almat101/jenkins-migration-secure-ecommerce.git`)
   - Seleziona la credenziale SSH appena creata.

**Nota pratica:**
La chiave privata SSH va inserita solo tramite l’interfaccia web di Jenkins (Gestione credenziali) e non deve essere salvata nel filesystem del container Jenkins. La chiave host di GitHub (ED25519) invece deve essere presente nel file `/var/jenkins_home/.ssh/known_hosts` del container Jenkins: questa serve per la verifica della connessione SSH e va aggiunta manualmente con `ssh-keyscan`. Il test manuale con `ssh -i ...` non è rilevante per Jenkins, che gestisce le chiavi in modo diverso. Se la pipeline fallisce per "Host key verification failed", controlla solo il file `known_hosts` e i permessi, non la chiave privata.

Così Jenkins potrà accedere al repository via SSH in modo sicuro e automatico.

### Come configurare il webhook GitHub per trigger automatico

Per far sì che ogni push su GitHub triggeri automaticamente la pipeline Jenkins, aggiungi un webhook al repository:

1. Vai su GitHub → Repository → Settings → Webhooks.
2. Clicca su “Add webhook”.
3. Nel campo “Payload URL” inserisci l’URL pubblico del tuo Jenkins seguito da `/github-webhook/` (esempio: `https://jenkins.alematta.com/github-webhook/`).
4. Seleziona “Content type” → `application/json`.
5. Scegli “Just the push event” come evento da triggerare.
6. Clicca “Add webhook”.

Assicurati che il job Jenkins abbia abilitato il trigger “GitHub hook trigger for GITScm polling” nelle opzioni di build. Così ogni push su GitHub notificherà Jenkins e la pipeline verrà eseguita automaticamente.

## Come abilitare il trigger webhook su Jenkins:
1. Apri il job Jenkins che gestisce la pipeline (collegato al repository via SCM).
2. Clicca su "Configura" (Configure).
3. Nella sezione "Build Triggers", seleziona la casella:
    - “GitHub hook trigger for GITScm polling”

Questa opzione permette a Jenkins di ricevere notifiche dai webhook GitHub e avviare la pipeline automaticamente ad ogni push.

Se usi Jenkinsfile e "Pipeline script from SCM", la configurazione va fatta nell’interfaccia web del job, non nel Jenkinsfile.

### Come configurare la regola di bypass Cloudflare Access per il webhook

Usando Cloudflare Access per proteggere Jenkins, dovrai creare una regola di bypass che permetta a GitHub di accedere all’endpoint `/github-webhook/` senza autenticazione, altrimenti il webhook non funzionerà.

**Passaggi:**
1. Vai su Cloudflare Access → Applications → seleziona la tua app Jenkins.
2. Aggiungi una nuova “Access Policy” (regola):
     - “Include”: scegli “IP ranges” e aggiungi tutti gli IP/cidr degli hook GitHub (vedi https://api.github.com/meta):
         ```
         192.30.252.0/22
         185.199.108.0/22
         140.82.112.0/20
         143.55.64.0/20
         2a0a:a440::/29
         2606:50c0::/32
         ```

      - “Action”: seleziona “Bypass”.
      - “Session duration”: scegli “No duration (expire immediately)” per maggiore sicurezza (la regola si applica solo alla richiesta webhook e non mantiene sessioni aperte).
      
**Nota:** Il path `/github-webhook/` si imposta nella configurazione dell'applicazione Jenkins su Cloudflare Access (Application settings), non come regola interna della policy. Se non puoi specificare il path, la policy di bypass si applicherà all’intera app Jenkins, ma solo agli IP di GitHub e solo per il bypass.

**Procedura consigliata:**
Per il bypass del webhook, crea una nuova applicazione Cloudflare Access dedicata, ad esempio:

    - **Application name:** `jenkins bypass application`
    - **Application domain/path:** imposta il path `/github-webhook/` (esempio: `https://jenkins.alematta.com/github-webhook/`)
    - **Session Duration:** `No duration, expires immediately`

Configura la policy BYPASS sugli IP di GitHub come descritto sopra. Così solo le richieste webhook saranno accettate senza autenticazione, mentre l’interfaccia Jenkins principale rimarrà protetta.
3. Salva la regola e riprova il test del webhook su GitHub.

Così GitHub potrà inviare la notifica al webhook Jenkins senza essere bloccato dal tunnel Cloudflare Access.

**Verifica e test webhook GitHub:**
Una volta configurata l'applicazione Cloudflare Access dedicata e la policy di bypass sugli IP di GitHub, effettua il test del webhook da GitHub (tramite "Redeliver" o "Test webhook"). Se la configurazione è corretta, la risposta sarà **200 OK** e il webhook verrà accettato da Jenkins senza autenticazione.

Esempio di risposta corretta:
```
Request URL: https://jenkins.alematta.com/github-webhook/
Request method: POST
Response: 200 OK
```
Questo conferma che la procedura di bypass Cloudflare Access per il webhook è funzionante e la pipeline Jenkins può essere triggerata automaticamente da GitHub.

---

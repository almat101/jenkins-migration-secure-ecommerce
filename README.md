# Migrazione e Espansione Pipeline CI/CD: Da GitHub Actions a Jenkins

Questo progetto nasce con l'obiettivo di migrare e ampliare la pipeline CI/CD precedentemente gestita tramite GitHub Actions, portandola su Jenkins. L'infrastruttura è stata pensata per testare e implementare pipeline sempre più complesse, partendo da semplici test tramite l'interfaccia web di Jenkins, fino ad arrivare alla creazione di pipeline avanzate tramite Jenkinsfile. La pipeline finale prevede le seguenti fasi:
- Checkout del codice
- Build dell'applicazione
- Test automatici
- Push delle immagini su un registro Docker
- Deploy tramite pull delle immagini nel docker-compose

## Differenza tra Docker-in-Docker e Docker-outside-of-Docker e r
**Docker-outside-of-Docker (DOoD)** è il metodo che sto usando attualmente: Jenkins (in container) accede direttamente al demone Docker dell'host tramite il mounting del socket Docker (`/var/run/docker.sock`). Questo approccio è semplice e funziona bene per ambienti di test e home lab, ma non è raccomandato in produzione per motivi di sicurezza, perché il container Jenkins ottiene privilegi elevati sull'host.

**Docker-in-Docker (DinD)**, invece, prevede l'avvio di un container separato che esegue il demone Docker al suo interno. Jenkins comunica con questo demone tramite API (TCP + TLS), senza accedere direttamente al socket dell'host. DinD offre maggiore isolamento e sicurezza rispetto a DOoD, ma introduce complessità aggiuntiva e non è sempre necessario, soprattutto se si usano agenti esterni.

**Approccio attuale:**
Sto usando DOoD (Jenkins + Docker) per la pipeline su VPS, ideale per test e sviluppo.

**Prossimo step:**
Quando migrerò a una soluzione più sicura e scalabile, userò Jenkins come controller (senza Docker installato) e agenti EC2 esterni con Docker/Docker Compose installati. Gli agenti EC2 eseguiranno le fasi di build, test e deploy, eliminando la necessità di DOoD o DinD sul controller Jenkins.
Inizialmente la pipeline verrà creata e testata su questa VPS (ambiente di test/home lab) con Jenkins installato e il volume del socket Docker montato, sia tramite interfaccia web che Jenkinsfile.

## Differenza tra DOoD e DinD

- **DOoD (Docker-outside-of-Docker):** Jenkins accede direttamente al demone Docker dell’host tramite il mounting del socket Docker. È semplice ma meno sicuro, adatto solo a test/home lab.
- **DinD (Docker-in-Docker):** Jenkins comunica con un demone Docker separato, avviato in un container dedicato (spesso tramite API e TLS). Offre maggiore isolamento e sicurezza, consigliato per ambienti di produzione.

Attualmente uso DOoD per semplicità, ma in futuro migrerò verso agenti EC2 per maggiore sicurezza.

## Roadmap futura
Quando la pipeline sarà funzionante, il mounting del volume Docker verrà commentato o rimosso e la pipeline verrà migrata su agenti EC2 esterni, sfruttando anche eventuali plugin per la gestione automatica degli agenti. Questo approccio permette di partire in modo semplice e poi evolvere verso una soluzione più sicura e scalabile.

## Testing con Jenkins in Container Custom
Per garantire la massima flessibilità e sicurezza, i test sono stati effettuati utilizzando un container custom di Jenkins su una VPS Hetzner. In questo container, oltre a Jenkins, è stato installato Docker seguendo la procedura ufficiale. Questo consente a Jenkins di controllare direttamente l'applicazione tramite Docker e Docker Compose.

La chiave di questa integrazione è il mounting del volume `/var/run/docker.sock` nel container Jenkins, che permette a Jenkins di interagire con il demone Docker della macchina host (VPS o PC locale). In questo modo, Jenkins può gestire i container e orchestrare le operazioni necessarie per la pipeline.


## Dockerfile di Jenkins: Permessi, Gruppi e Sicurezza Utente
Nel Dockerfile di Jenkins è stato necessario modificare i permessi del gruppo Docker (GID) e aggiungere l'utente Jenkins al gruppo Docker. Questo passaggio è fondamentale per permettere a Jenkins di utilizzare Docker senza problemi di permessi, ad esempio per eseguire build e gestire container direttamente dal job.

Per garantire la sicurezza, dopo aver installato tutti i pacchetti necessari e configurato Docker, il container viene eseguito con l'utente `jenkins` (non root). Questo segue il principio del minimo privilegio: Jenkins può accedere a Docker, ma non ha permessi amministrativi sul sistema, riducendo i rischi in caso di compromissione del servizio.

Se si prova ad accedere al container Jenkins per installare manualmente nuovi pacchetti, l'operazione non funziona perché l'utente di default è `jenkins` e non ha privilegi amministrativi. In questi casi, per operazioni di manutenzione straordinaria, è necessario accedere come root:

[Dockerfile custom di Jenkins](https://github.com/almat101/jenkins-migration-secure-ecommerce/blob/main/jenkins/Dockerfile)

```sh
docker exec -u 0 -it jenkins bash
```

## Separazione dei Makefile: Applicazione vs Infrastruttura
È stata effettuata una separazione tra il Makefile classico, dedicato all'applicazione, e un Makefile specifico per l'infrastruttura. Quest'ultimo si occupa di avviare Jenkins e il tunnel Cloudflare.

## Accesso Sicuro tramite Cloudflare Tunnel


L'accesso all'interfaccia web di Jenkins avviene tramite un tunnel Cloudflare, che garantisce sicurezza aggiuntiva e gestisce anche i certificati SSL. Sulla VPS Hetzner non è aperta nessuna porta pubblica (né 8080, né 443, solo SSH per amministrazione), quindi Jenkins non è esposto direttamente su Internet. Il tunnel Cloudflare si occupa di tutto: instrada il traffico, protegge l'accesso e fornisce il certificato SSL.

Nel container frontend, la porta 80 è mappata internamente alla 8082, ma non è necessario esporla esternamente grazie al tunnel. Per Jenkins, ho utilizzato il tunnel esistente e ho configurato il mapping da `jenkins:8080` a `jenkins.alematta.com` tramite Cloudflare.

Solo la mia mail personale può accedere a Jenkins, grazie all'autenticazione tramite PIN fornito da Cloudflare Security. Questo sistema protegge l'accesso e garantisce che solo utenti autorizzati possano gestire la pipeline.

Esempi dei passaggi di autenticazione Cloudflare:

![Cloudflare Access](screen/cloudflare_access.png)

![Cloudflare PIN](screen/cloudflare_pin.png)

---

## Jenkins controller (master) e agenti (worker)

In Jenkins, l'architettura classica prevede un **controller** (precedentemente chiamato "master") e uno o più **agenti** (detti anche "worker", in passato "slave").

- Il **controller** gestisce l'orchestrazione delle pipeline, la UI, la configurazione dei job e la distribuzione dei task agli agenti( nel mio caso puo essere il mio pc o la mia vps hetzner)
- Gli **agenti** sono macchine (VM, server, container) che eseguono fisicamente i job e le build. Possono essere configurati per eseguire job specifici, avere tool diversi installati, e scalare in base alle necessità.

La terminologia moderna preferisce "controller" e "agent" (o "worker") invece di "master/slave" per motivi di inclusività. In pratica, il controller decide dove e come eseguire i job, mentre gli agenti sono gli esecutori reali delle pipeline.

---
## Esempio di Pipeline Jenkins ( via interfaccia web )

Ho implementato la seguente pipeline tramite l’interfaccia web di Jenkins, successivamente convertibile in Jenkinsfile per una gestione più avanzata e versionata:

```groovy
pipeline {
    agent any

    stages {
        stage('checkout') {
            steps {
                // Get some code from a GitHub repository
                echo 'Checking out code...'
                git branch: 'main', url: 'https://github.com/almat101/jenkins-migration-secure-ecommerce.git'
            }
        }
        
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

### Spiegazione della pipeline

- **pipeline**: definisce la pipeline dichiarativa di Jenkins.
- **agent any**: indica che la pipeline può essere eseguita su qualsiasi agente Jenkins disponibile. Attualmente, l'agente è la VPS su cui è installato Jenkins: questa macchina esegue fisicamente i comandi della pipeline. L'agente è l'esecutore della pipeline. In futuro, quando aggiungerai un agente EC2 (o altri agenti), Jenkins potrà eseguire la pipeline su quell'agente, sfruttando le sue risorse e il suo ambiente.
- **stages**: contiene le diverse fasi della pipeline.
    - **checkout**: recupera il codice dal repository GitHub.
    - **Unit test**: esegue i test unitari tramite il comando `make auth-unit`.
    - **build**: costruisce l’applicazione con `make build`.
    - **integration test**: esegue i test di integrazione con `make auth-integration`.

Questa struttura permette di gestire in modo ordinato e automatizzato le fasi principali del ciclo CI/CD, garantendo che ogni step venga eseguito solo se il precedente ha avuto successo.

---

## Pipeline semplice con SCM e collegamento via SSH

Per una pipeline semplice gestita tramite "Pipeline from SCM", puoi usare questa struttura di Jenkinsfile:

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

**Come abilitare il trigger webhook su Jenkins:**
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


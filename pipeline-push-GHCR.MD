
## Pipeline SCM con build e push su GHCR

Questa pipeline esegue le seguenti fasi:

1. **Build dell’immagine Docker**: viene creata l’immagine del servizio (`auth-service`) e taggata con lo SHA del commit (`${GIT_COMMIT}`).
2. **Test unitari e di integrazione**: vengono eseguiti i test sul codice appena scaricato dal repository.
3. **Login a GHCR**: Jenkins si autentica su GitHub Container Registry usando il Personal Access Token (PAT) configurato nelle credenziali.
4. **Push dell’immagine**: l’immagine appena buildata e testata viene inviata su GHCR con il tag SHA.

Di seguito la struttura del Jenkinsfile utilizzata:

```groovy
pipeline {
    agent any
    environment {
        CR_PAT = credentials('GHCR_TOKEN')
        GH_USER = 'almat101'
    }
    stages {
        stage('Checking SHA') {
            steps {
                echo 'Commit SHA: ${GIT_COMMIT}'
            }
        }
        stage('build auth-service') {
            steps {
                echo 'Building auth-service with tag(sha)...'
                sh 'docker build -t ghcr.io/$GH_USER/auth-service:${GIT_COMMIT} ./backend/auth-service'
            }
        }
        stage('Unit test') {
            steps {
                echo 'Running unit test...'
                sh 'make auth-unit'
            }
        }
        stage('integration test') {
            steps {
                echo 'Running integration test...'
                sh 'make auth-integration'
            }
        }
        stage('login to GHCR') {
            steps {
                echo 'Logging in GHCR...'
                sh 'echo $CR_PAT | docker login ghcr.io -u $GH_USER --password-stdin'
            }
        }
        stage('push image') {
            steps {
                echo 'Pushing image to GHCR...'
                sh 'docker push ghcr.io/$GH_USER/auth-service:${GIT_COMMIT}'
            }
        }
    }
    post {
        always {
        sh 'docker logout'
        }
    }
}
```

## Differenza tra `environment` e `withCredentials`

In questa pipeline ho usato il blocco `environment` per definire la variabile d'ambiente `CR_PAT` a partire dalla credenziale Jenkins `GHCR_TOKEN`:

```groovy
environment {
        CR_PAT = credentials('GHCR_TOKEN')
}
```

Così facendo, `CR_PAT` è disponibile **in tutti gli stage e in tutti gli step** della pipeline. Questo è comodo quando vuoi usare **la stessa credenziale** (ad esempio il token GHCR) in punti diversi della pipeline, senza doverla ridefinire ogni volta.

`withCredentials`, invece, è uno step che rende disponibili una o più credenziali **solo dentro a un blocco specifico**. Un esempio (che qui non sto usando) sarebbe:

```groovy
withCredentials([string(credentialsId: 'GHCR_TOKEN', variable: 'CR_PAT')]) {
        sh '''
            echo $CR_PAT | docker login ghcr.io -u <github-username> --password-stdin
        '''
}
```

In questo caso, la variabile `CR_PAT` esiste **solo dentro il blocco `withCredentials`** e non è visibile fuori. È utile quando vuoi limitare al massimo lo scope della credenziale o quando usi **credenziali diverse in stage diversi**.

**Riassunto pratico:**
- `environment`: variabile disponibile ovunque nella pipeline (o nello stage), ideale quando hai **una singola credenziale** da riutilizzare in più punti.
- `withCredentials`: variabile disponibile solo nel blocco in cui è definita, più sicuro e flessibile quando vuoi **limitare la visibilità** del segreto o usare **più credenziali diverse**.

delete:packages se vuoi cancellare immagini(dopo implementero un metodo per cancellare le immagini dopo 5)

## Come creare il Personal Access Token (PAT) classic

1. Vai su [GitHub](https://github.com) e accedi con il tuo account.
2. In alto a destra, clicca sulla tua foto profilo → **Settings**.
3. Nel menu a sinistra, vai su **Developer settings** → **Personal access tokens** → **Tokens (classic)**.
4. Clicca su **Generate new token classic**.
5. Dai un nome al token (es: `jenkins-ghcr-push`).
6. Seleziona le scope necessarie:
     - Per GHCR servono almeno:
         - `write:packages`
         - `read:packages`
         - `delete:packages` (se vuoi cancellare immagini; in futuro potrai implementare la cancellazione automatica dopo 5 immagini)
     - Se vuoi fare push su repository private, aggiungi anche `repo`.
7. Imposta la durata del token (consigliato: "No expiration" solo se necessario).
8. Clicca su **Generate token** e copia subito il token (non sarà più visibile dopo).

### Dove usarlo

#### Inserire il token su Jenkins

1. Vai su Jenkins → **Gestione credenziali** (Manage Credentials).
2. Seleziona lo store **globale** (o quello del tuo folder/job se preferisci).
3. Clicca su **Aggiungi credenziale** (Add Credentials).
4. Tipo di credenziale: **Secret text**.
5. Nel campo **Secret**, incolla il token che hai generato su GitHub.
6. Nel campo **ID**, inserisci `GHCR_TOKEN` (deve corrispondere a quello usato nel Jenkinsfile).
7. Salva.

Ora la pipeline userà il token tramite la variabile `CR_PAT` per autenticarsi su GHCR.



<!-- fonti: -->
<!-- https://www.youtube.com/watch?v=HTou7pGnS0Y -->
<!-- https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry -->
<!-- https://github.com/darinpope/jenkins-example-ghcr -->
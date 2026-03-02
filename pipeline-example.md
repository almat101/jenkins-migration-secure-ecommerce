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

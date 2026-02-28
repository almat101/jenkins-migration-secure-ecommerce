# Migrazione e Espansione Pipeline CI/CD: Da GitHub Actions a Jenkins

Questo progetto nasce con l'obiettivo di migrare e ampliare la pipeline CI/CD precedentemente gestita tramite GitHub Actions, portandola su Jenkins. L'infrastruttura è stata pensata per testare e implementare pipeline sempre più complesse, partendo da semplici test tramite l'interfaccia web di Jenkins, fino ad arrivare alla creazione di pipeline avanzate tramite Jenkinsfile. La pipeline finale prevede le seguenti fasi:
- Checkout del codice
- Build dell'applicazione
- Test automatici
- Push delle immagini su un registro Docker
- Deploy tramite pull delle immagini nel docker-compose

## Testing con Jenkins in Container Custom
Per garantire la massima flessibilità e sicurezza, i test sono stati effettuati utilizzando un container custom di Jenkins su una VPS Hetzner. In questo container, oltre a Jenkins, è stato installato Docker seguendo la procedura ufficiale. Questo consente a Jenkins di controllare direttamente l'applicazione tramite Docker e Docker Compose.

La chiave di questa integrazione è il mounting del volume `/var/run/docker.sock` nel container Jenkins, che permette a Jenkins di interagire con il demone Docker della macchina host (VPS o PC locale). In questo modo, Jenkins può gestire i container e orchestrare le operazioni necessarie per la pipeline.

## Dockerfile di Jenkins: Permessi e Gruppi
Nel Dockerfile di Jenkins è stato necessario modificare i permessi del gruppo Docker (GID) e aggiungere l'utente Jenkins al gruppo Docker. Questo passaggio è fondamentale per permettere a Jenkins di utilizzare Docker senza problemi di permessi.

## Separazione dei Makefile: Applicazione vs Infrastruttura
È stata effettuata una separazione tra il Makefile classico, dedicato all'applicazione, e un Makefile specifico per l'infrastruttura. Quest'ultimo si occupa di avviare Jenkins e il tunnel Cloudflare.

## Accesso Sicuro tramite Cloudflare Tunnel
L'accesso all'interfaccia web di Jenkins avviene tramite un tunnel Cloudflare, che garantisce sicurezza aggiuntiva. Solo la mia mail personale può accedere a Jenkins, grazie all'autenticazione tramite PIN fornito da Cloudflare Security. Questo sistema protegge l'accesso e garantisce che solo utenti autorizzati possano gestire la pipeline.

---

Per ulteriori dettagli sull'architettura, consultare il file `ARCHITECTURE.md`.

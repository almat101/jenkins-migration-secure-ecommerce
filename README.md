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



---

Per ulteriori dettagli sull'architettura, consultare il file `ARCHITECTURE.md`.

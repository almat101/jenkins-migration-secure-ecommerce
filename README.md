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



---

Per ulteriori dettagli sull'architettura, consultare il file `ARCHITECTURE.md`.

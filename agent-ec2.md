# Jenkins Agent EC2: cosa e a cosa serve

## Cos'e un agente Jenkins

Un agente Jenkins (detto anche nodo worker) e una macchina, fisica o virtuale, che esegue i job della pipeline al posto del controller (master).

In pratica:
- il controller orchestra, schedula e gestisce i job;
- l'agente esegue davvero i comandi (build, test, deploy, script shell, Docker, ecc.).

Questo approccio serve per:
- separare il piano di controllo dal piano di esecuzione;
- non sovraccaricare il controller;
- usare ambienti specifici per diversi job (es. Linux, Docker, Maven, Node, ecc.);
- scalare facilmente aggiungendo altri agenti.

## Il mio caso pratico (agent1 su EC2)

Io ho creato un agente su EC2 e l'ho collegato a Jenkins in SSH.

### 1) Provisioning dell'istanza

Ho creato l'istanza EC2 via CLI.

Nota: in seguito rifaro questo provisioning anche con Terraform, cosi da avere infrastruttura ripetibile e versionata come codice.

### 2) Configurazione base con Ansible

Dopo la creazione dell'istanza, ho installato con Ansible i pacchetti fondamentali:
- git
- curl
- wget
- iproute2
- docker

Questa fase rende l'agente pronto a ricevere ed eseguire pipeline reali.

### 3) Registrazione nodo nella GUI Jenkins (controller locale)

Nel Jenkins controller (master) in esecuzione sul mio PC locale ho creato il nodo `agent1` con questa configurazione:

- Name: `agent1`
- Number of executors: `1`
- Labels: `linux docker agent1`
- Launch agents via SSH:
  - Host: IP pubblico della EC2
  - Credentials: chiave `.pem` caricata nelle Jenkins Credentials
- Availability: `Keep this agent online as much as possible`

Poi ho salvato.

Perche 1 executor?
- Ho seguito la regola vista in un video: allineare gli executor al numero di CPU/vCPU disponibili sull'agente.
- Nel mio caso l'agente ha 1 CPU (verificata con `cat /proc/cpuinfo`), quindi ho impostato 1 executor.

Perche usare piu label?
- Le label aiutano a indirizzare i job sul nodo giusto in base alle capacita del nodo.
- Nel mio caso ho usato `linux docker agent1`.
- Nel video di riferimento usavano label come Maven/Gradle; io ho Docker, quindi la label e coerente con il mio stack.

## Test di funzionamento con pipeline semplice

Dopo aver creato e configurato il nodo, ho eseguito una pipeline base dalla GUI Jenkins, forzando l'esecuzione su `agent1`:

```groovy
pipeline {
	agent { label 'agent1' }

	stages {
		stage('Hello') {
			steps {
				echo 'Hello World'
			}
		}
	}
}
```

Scopo del test:
- verificare che la connessione SSH tra controller e agente funzioni;
- verificare che il job venga realmente schedulato sull'agente con label `agent1`;
- validare il flusso minimo end-to-end prima di pipeline piu complesse.

## Conclusione

Un agente Jenkins serve a delegare l'esecuzione dei job a nodi dedicati, mantenendo il controller piu pulito e scalabile.

Nel mio setup:
- EC2 = macchina agente,
- Ansible = configurazione automatica,
- Jenkins node via SSH = collegamento operativo,
- pipeline test = conferma che l'integrazione funziona.

Prossimo passo naturale: portare il provisioning EC2 su Terraform per avere un flusso completamente Infrastructure as Code, dal nodo fino alla pipeline.

## Tuning: aumento del tmpfs per /tmp

Durante il test della pipeline mi sono accorto che lo spazio in /tmp era insufficiente (era montato di default come tmpfs con solo ~483MB).

Ho aumentato lo spazio temporaneo a 3GB (potrebbe funzionare anche con 2GB ma si accende un warning) utilizzando il comando:

```bash
sudo mount -o remount,size=3G /tmp
```

Questo comando remonta il filesystem `/tmp` (che e gia un tmpfs, quindi in RAM) con una nuova size di 3GB, prelevandola dalla memoria RAM disponibile (l'agente ha 4GB di swap).

**Output di `df -h` dopo la modifica:**

```
Filesystem      Size  Used Avail Use% Mounted on
udev            470M     0  470M   0% /dev
tmpfs            97M  544K   96M   1% /run
/dev/xvda1       30G  6.5G   22G  23% /
tmpfs           483M     0  483M   0% /dev/shm
tmpfs           5.0M     0  5.0M   0% /run/lock
tmpfs           3.0G   32K  3.0G   1% /tmp
tmpfs           1.0M     0  1.0M   0% /run/credentials/systemd-journald.service
tmpfs           1.0M     0  1.0M   0% /run/credentials/systemd-resolved.service
/dev/xvda15     124M  8.7M  116M   8% /boot/efi
tmpfs           1.0M     0  1.0M   0% /run/credentials/systemd-networkd.service
tmpfs           1.0M     0  1.0M   0% /run/credentials/getty@tty1.service
tmpfs           1.0M     0  1.0M   0% /run/credentials/serial-getty@ttyS0.service
tmpfs            97M  4.0K   97M   1% /run/user/1000
```

Come si nota, `/tmp` ora occupa 3.0G nella colonna `Size`.

**Perche?**

Jenkins monitora lo spazio disponibile in `/tmp` e **genera un warning quando scende sotto i 2GB**.

Nel mio caso, il sistema mostraba questo stato:

```
Free Temp Space	2.00 GiB
```

E ricevevo il warning di Jenkins: `tmp is below threshold of 2gb`.

Docker e altre applicazioni scrivono file temporanei in `/tmp`. Se lo spazio e insufficiente, i job possono fallire con errori di "Disk full" o "No space left on device". 

Aumentando la size di `/tmp` a 3GB:
- elimino il warning di Jenkins;
- consento ai container e ai processi dell'agente di avere sufficiente spazio di lavoro temporaneo;
- evito blocchi durante l'esecuzione di job che generano molti file temporanei;
- non impatto il disco principale (tutto rimane in RAM).

### Rendere persistente la modifica al reboot

Il comando `sudo mount -o remount,size=3G /tmp` e temporaneo: al riavvio della EC2, `/tmp` torna alla size di default (~483MB).

Per rendere la modifica **persistente**, ho aggiunto una riga a `/etc/fstab`:

```bash
echo 'tmpfs /tmp tmpfs defaults,size=3G 0 0' | sudo tee -a /etc/fstab
```

Oppure, modificando manualmente il file:

```bash
sudo nano /etc/fstab
```

E aggiungendo la riga:

```
tmpfs /tmp tmpfs defaults,size=3G 0 0
```

**Il mio `/etc/fstab` attuale:**

```
PARTUUID=caf7c5ea-3e7a-4cca-b650-2129391197c0 / ext4 rw,discard,errors=remount-ro,x-systemd.growfs 0 1
PARTUUID=2a305f41-3877-482d-9177-007c171294f9 /boot/efi vfat defaults,umask=077 0 2
/swapfile none swap sw 0 0
tmpfs /tmp tmpfs defaults,size=3G 0 0
```

Dopo il reboot, il tmpfs di 3GB sarà automaticamente montato su `/tmp` e il warning di Jenkins scomparira permanentemente.


## Setup dello swap: 4GB su EC2 Debian 13 (metodo moderno con fallocate)

Per aggiungere 4GB di swap sull'istanza EC2 (utile quando la memoria RAM non basta), ho usato il metodo moderno con `fallocate` (molto piu veloce rispetto al vecchio metodo con `dd`).

### Comandi per creare e attivare lo swap:

```bash
# 1. Creare il file di swap da 4GB (molto veloce)
sudo fallocate -l 4G /swapfile

# 2. Impostare i permessi corretti (600 = rw-------)
sudo chmod 600 /swapfile

# 3. Formattare il file come swap
sudo mkswap /swapfile

# 4. Attivare lo swap immediatamente
sudo swapon /swapfile

# 5. Verificare che lo swap sia attivo
swapon --show
free -h

# 6. Rendere lo swap persistente al reboot
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### Output atteso:

Dopo l'attivazione, `free -h` dovrebbe mostrare lo swap di 4GB:

```
              total        used        free      shared  buff/cache   available
Mem:          3.7Gi       1.2Gi       1.5Gi       20Mi       1.0Gi       2.2Gi
Swap:         4.0Gi          0B       4.0Gi
```

### Perche fallocate e non dd?

- **`fallocate`**: istantaneo, alloca lo spazio di file system direttamente senza scrivere dati (preallocazione);
- **`dd` (metodo vecchio)**: scrive effettivamente 4GB di dati zero, molto piu lento.

Con `fallocate`, la creazione del file di swap da 4GB impiega frazioni di secondo.

### Nota sulla persistenza

La linea aggiunta a `/etc/fstab`:
```
/swapfile none swap sw 0 0
```

Assicura che lo swap venga riattivato automaticamente al reboot della EC2, senza intervento manuale.


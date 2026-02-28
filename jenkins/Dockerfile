FROM jenkins/jenkins:lts

USER root
#GID pc ale 994 - GID vps hetzner 989 ( getent group docker )
ARG GID=994

#aggiunta utente jenkins al gruppo docker + modifica gid
RUN groupadd -g $GID docker && usermod -aG docker jenkins

RUN apt update && apt install -y ca-certificates curl gnupg
RUN install -m 0755 -d /etc/apt/keyrings
RUN curl -fsSL https://download.docker.com/linux/debian/gpg -o /etc/apt/keyrings/docker.asc
RUN chmod a+r /etc/apt/keyrings/docker.asc
RUN . /etc/os-release && \
echo "Types: deb" > /etc/apt/sources.list.d/docker.sources && \
echo "URIs: https://download.docker.com/linux/debian" >> /etc/apt/sources.list.d/docker.sources && \
echo "Suites: $VERSION_CODENAME" >> /etc/apt/sources.list.d/docker.sources && \
echo "Components: stable" >> /etc/apt/sources.list.d/docker.sources && \
echo "Signed-By: /etc/apt/keyrings/docker.asc" >> /etc/apt/sources.list.d/docker.sources

RUN apt update

RUN apt update && apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

USER jenkins


# Il GID (Group ID) è l’identificatore numerico di un gruppo Linux.
# Ogni gruppo ha un GID unico sul sistema.

# Il socket Docker docker.sock appartiene al gruppo docker con un certo GID (es. 994 o 989).
# Nel container, il gruppo docker deve avere lo stesso GID del gruppo docker sull’host,
# altrimenti l’utente jenkins (anche se nel gruppo docker) non avrà i permessi giusti sul socket.

# Il socket Docker è il file docker.sock.
# È un file speciale (socket UNIX) che permette la comunicazione tra client e server Docker tramite API.
# Chi ha permesso di scrittura su questo socket può controllare Docker (creare, fermare, gestire container).
# Di solito, il socket appartiene all’utente root e al gruppo docker.
# Per motivi di sicurezza, solo chi è nel gruppo docker (con il GID giusto) può usarlo senza essere root.

# node:22 e não uma mais nova: o `.tool-versions` fixa `nodejs 22.13.1` e o
# `engines` do pacote pede `>=22.13.1`. Rodar o agente numa major diferente da
# que a esteira valida é divergência silenciosa — o tipo de coisa que só aparece
# quando o build passa aqui e falha lá.
FROM node:22-bookworm

# `bash` já vem na bookworm, e o `no-espelho.sh` depende dele (o `sh` do Debian
# é o dash, que não tem `set -o pipefail`).
RUN apt-get update && apt-get install -y \
  git \
  curl \
  jq \
  ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# O CLIENTE do Docker, e só ele. Não há Docker dentro do Docker aqui: o socket
# do daemon do HOST vem montado pelo `main.ts`, e este cliente fala com ele.
#
# É isto que dá `pnpm test:e2e` ao agente — e o e2e é o único lugar onde as
# tarefas abertas deste repositório se provam, porque elas mexem em como a
# extensão compõe os layouts de um Directus de verdade.
#
# O plugin do compose vem junto porque `docker-compose.test.yml` é a suíte
# inteira: sem ele, `docker compose` responde "is not a docker command" e o
# diagnóstico parece um erro de sintaxe do script.
RUN install -m 0755 -d /etc/apt/keyrings \
  && curl -fsSL https://download.docker.com/linux/debian/gpg \
    -o /etc/apt/keyrings/docker.asc \
  && chmod a+r /etc/apt/keyrings/docker.asc \
  && echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/debian $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
    > /etc/apt/sources.list.d/docker.list \
  && apt-get update \
  && apt-get install -y docker-ce-cli docker-compose-plugin \
  && rm -rf /var/lib/apt/lists/*

# pnpm pelo npm, e **fixado**, em vez de deixado ao corepack.
#
# Dois motivos, ambos medidos. O corepack sem `packageManager` no package.json
# baixa a mais recente — e a pnpm 12 aplica uma política de idade mínima de
# publicação que recusa o lockfile sempre que alguma dependência transitiva
# tiver sido publicada nas últimas horas. O `docker-compose.test.yml` já fixa a
# 10.15.0 no runner dos testes pelo mesmo motivo, com o mesmo comentário. A
# versão aqui acompanha o `.tool-versions` da máquina.
RUN npm install -g pnpm@10.15.0

# O `prepare` do pacote é `husky`, que instala hooks de git. Dentro do sandbox
# eles não servem a ninguém — e numa worktree, cujo `.git` é um arquivo, eles
# são uma chance a mais de o install inteiro falhar por um motivo que não tem
# nada a ver com o trabalho. `HUSKY=0` é o desligamento que o próprio husky
# documenta.
ENV HUSKY=0

# Alinhamento de UID/GID com o usuário do host: o que a imagem cria e o que vem
# montado passam a compartilhar dono, sem chown em tempo de execução.
ARG AGENT_UID=1000
ARG AGENT_GID=1000

RUN groupmod -o -g $AGENT_GID node \
  && usermod -o -u $AGENT_UID -g $AGENT_GID -d /home/agent -m -l agent node

# O grupo do socket do Docker do host. O `main.ts` passa `--group-add` com este
# GID; o grupo precisa EXISTIR na imagem para o nome aparecer, mas o número é o
# que vale para a permissão do socket. Em máquina onde o GID do grupo `docker`
# for outro, este build-arg é o que muda.
ARG DOCKER_GID=999
RUN groupadd -o -g $DOCKER_GID docker-host && usermod -aG docker-host agent

USER ${AGENT_UID}:${AGENT_GID}

RUN curl -fsSL https://claude.ai/install.sh | bash
ENV PATH="/home/agent/.local/bin:$PATH"

# Configuração global do pnpm, e não flags num comando só.
#
# A alternativa já falhou em produção no geohub: o setup passava as flags no
# hook e funcionava, mas o agente, mais tarde, rodou um `pnpm` sem elas e caiu
# num store vazio. Configuração presa a um comando vale enquanto for aquele
# comando; aqui ela é propriedade do ambiente, então todo pnpm herda —
# inclusive o que o agente digita sem saber destas restrições.
#
# `storeDir` fora da montagem porque é cache de máquina e não tem por que morar
# na worktree. O `virtualStoreDir` fica no padrão de propósito: o
# `node_modules/.pnpm` PRECISA estar dentro da árvore, já que o espelho que o
# Docker enxerga é a mesma árvore, e mover os arquivos para fora do bind mount
# os tiraria do alcance do host.
#
# `verifyDepsBeforeRun: false` desarma o gatilho da história acima: por padrão
# qualquer `pnpm <script>` confere as dependências e dispara um install sozinho.
# Num sandbox preparado isso nunca ajuda — só tem como piorar, e mexe no
# lockfile.
RUN mkdir -p /home/agent/.config/pnpm && \
  printf 'storeDir: /home/agent/.pnpm-store\nverifyDepsBeforeRun: false\n' \
  > /home/agent/.config/pnpm/config.yaml

WORKDIR /home/agent

ENTRYPOINT ["sleep", "infinity"]

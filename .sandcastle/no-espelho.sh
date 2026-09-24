#!/usr/bin/env bash
#
# Roda um comando que fala com o Docker a partir do caminho ESPELHO da worktree.
#
# Por que isto existe, e por que não dá para pular: o agente trabalha em
# `/home/agent/workspace`, mas o daemon do Docker é o do HOST — o socket vem
# montado. Todo caminho que o `docker-compose.test.yml` escreve (`./`,
# `./dist/index.js`) é resolvido pelo daemon **no host**, onde
# `/home/agent/workspace` não existe.
#
# E o Docker não reclama disso. Ele CRIA o diretório vazio e segue: o Directus
# sobe sem a extensão, o runner monta um `/workspace` vazio, e a suíte falha por
# um motivo que não é o dela — longe da causa, com a mensagem errada.
#
# A saída é a paridade de caminho: o `main.ts` monta o diretório de worktrees do
# host no container **no mesmo caminho absoluto**. Os mesmos arquivos aparecem
# em dois lugares, e um deles tem o nome que o host entende. É desse que o
# compose precisa ser chamado.
#
# Uso:
#   .sandcastle/no-espelho.sh pnpm test:e2e
#   .sandcastle/no-espelho.sh pnpm screenshot
set -euo pipefail

if [ "$#" -eq 0 ]; then
  echo "uso: .sandcastle/no-espelho.sh <comando> [args...]" >&2
  exit 64
fi

gitdir=$(git rev-parse --git-dir)
case "$gitdir" in
  */.git/worktrees/*) ;;
  *)
    echo "no-espelho: isto não é uma worktree do Sandcastle (git-dir: $gitdir)." >&2
    echo "  Fora do sandbox, rode o comando direto — o espelho não é necessário." >&2
    exit 1
    ;;
esac

nome=$(basename "$gitdir")
# O git-dir de uma worktree é `<repo>/.git/worktrees/<nome>`: são TRÊS níveis
# até a raiz do repositório, não dois. Com dois, `repo` parava em `<repo>/.git`
# e o espelho era procurado dentro do diretório do git, que nunca existiu — o
# script abortava dizendo que a montagem não chegou, com a montagem no lugar.
repo=$(dirname "$(dirname "$(dirname "$gitdir")")")
espelho="$repo/.sandcastle/worktrees/$nome"

# A prova de que o espelho é a MESMA árvore, e não um diretório de mesmo nome:
# dois bind mounts da mesma origem mostram o mesmo inode. Sem esta conferência,
# um espelho vazio — que é justamente o que o Docker cria sozinho quando o
# caminho não existe — passaria por bom e a suíte rodaria no nada.
if [ ! -e "$espelho/package.json" ]; then
  echo "no-espelho: $espelho não tem package.json — a montagem espelho não chegou." >&2
  exit 1
fi
if [ "$(stat -c %i "$espelho/package.json")" != "$(stat -c %i ./package.json)" ]; then
  echo "no-espelho: $espelho é outra árvore, não o espelho desta worktree." >&2
  exit 1
fi

echo "no-espelho: $espelho"
cd "$espelho"
exec "$@"

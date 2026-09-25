Você trabalha no **directus-extension-mapgrid**, uma extensão de layout do
Directus (Vue 3 + TypeScript, um pacote só, pnpm). Pegue **uma** tarefa,
feche-a por completo, e pare.

## Escolha da tarefa

```
!`node --experimental-strip-types .sandcastle/task-queue/cli.ts`
```

**A primeira linha da tabela é a sua: o menor número de `Priority` vence.**
Neste repositório `Priority` é a ORDEM da fila que o taskin grava — não é peso.
O commit `f83f2a6` repriorizou as tarefas abertas justamente para a ordem
refletir dependência: a 010 vale 10 porque vem antes; a 007 e a 006 dizem no
próprio texto que dependem dela.

Não troque a ordem por conta própria, e não "adiante" uma tarefa de baixo
porque parece mais fácil. Se a primeira da fila estiver travada por algo que
você não pode resolver, **pare e relate** — não caia na seguinte.

**Tarefa listada como Reservada não é sua**, por mais que esteja no topo. A fila
imprime cada uma com o motivo.

Use o CLI do taskin para mudar estado:

```
pnpm taskin start <ID>
pnpm taskin review <ID>
```

Se um comando do taskin não existir ou falhar, **relate na mensagem de commit** e
siga pela alternativa. Fallback silencioso esconde exatamente o defeito que vale
conhecer.

## Como trabalhar

**TDD, vermelho primeiro.** Escreva o teste que falha, veja-o falhar, e só então
implemente. Teste escrito depois valida o que o código faz, não o que ele
deveria fazer.

Leia o `README.md` e os documentos em `dev-docs/padroes/` antes de mexer em
configuração de teste ou de build. O documento da própria tarefa, em `TASKS/`,
costuma trazer medições — leia-o inteiro antes de começar, inclusive as
`## Notes`.

**Nunca rode `pnpm install`, e nunca tente consertar o `node_modules`.** O
ambiente já vem instalado e construído antes de você começar. Se algo parecer
quebrado — módulo que não resolve, arquivo faltando —, **pare e relate**. Uma
rodada já se perdeu exatamente assim, com o agente esperando dez minutos por um
`pnpm install --force` que não tinha como fechar, até o Sandcastle matar a
iteração por ociosidade. O trabalho inteiro da tarefa se perdeu porque não
chegou a virar commit.

**Commite o que já está pronto antes de investigar qualquer problema de
ambiente.** Trabalho não commitado morre com a iteração.

## Os gates

Rode, sempre, antes de commitar:

```
pnpm test        # vitest
pnpm typecheck   # vue-tsc + tsc dos testes
pnpm lint        # biome
pnpm build       # o dist que o e2e monta no Directus
```

## O e2e roda aqui dentro — pelo espelho, nunca direto

Este sandbox recebe o socket do Docker do host, então a suíte que sobe Directus
de verdade **roda**. Mas ela só funciona por um caminho:

```
.sandcastle/on-mirror.sh pnpm test:e2e
.sandcastle/on-mirror.sh pnpm test:integration
.sandcastle/on-mirror.sh pnpm screenshot
```

O motivo, porque ele decide se você vai perder uma hora: o daemon do Docker é o
do host. Todo caminho do `docker-compose.test.yml` (`./`, `./dist/index.js`) é
resolvido **no host**, onde `/home/agent/workspace` não existe — e o Docker,
nesse caso, **cria um diretório vazio em vez de falhar**. O Directus sobe sem a
extensão e a suíte reprova por um motivo que não é o dela. O `on-mirror.sh`
troca para o caminho que o host entende, e confere que é a mesma árvore antes de
rodar.

Duas consequências práticas:

- `pnpm test:e2e` já faz `pnpm build` antes — mas o Directus carrega a extensão
  no boot, então **todo rebuild exige derrubar a pilha**, e é o que o script faz.
- Nada de `--host`, `--ui` ou `--debug`: não há navegador nem porta publicada
  visível daqui.

Se o e2e falhar por ambiente (imagem que não baixa, porta ocupada, Directus que
não sobe), **diga isso na mensagem de commit** em vez de mascarar com `skip`.

## Mexeu em tela? A evidência tem que mostrar a tela

Se a tarefa alterou algo **renderizado**, o documento da tarefa precisa trazer a
imagem do resultado, não só a descrição. "Liguei os controles do painel" não
permite julgar espaçamento, contraste, nem se a tela renderiza.

```
EVIDENCE_TASK=010 EVIDENCE_LABEL=composicao EVIDENCE_MOMENT=depois \
  .sandcastle/on-mirror.sh pnpm screenshot
```

As imagens vão para `TASKS/assets/`, no formato `task-NNN-<rotulo>-<momento>.png`.
**Confira a imagem antes de anexar** — duas capturas byte-idênticas entre antes e
depois não são evidência, são a mesma tela fotografada duas vezes. Compare o
tamanho ou o hash.

Se a captura não for possível nesta rodada, **diga isso em voz alta**, na
mensagem de commit e no doc da tarefa, em vez de fechar a tarefa sem a
evidência.

## Commit

Conventional commits com **descrição em português**: `tipo(escopo): descrição`.

A mensagem explica **por que**, não o que o diff já mostra. Se você descobriu
algo no caminho — um defeito vizinho, uma suposição que não se confirmou, uma
medição que contradiz o que a tarefa dizia —, isso vai na mensagem. É a parte que
não se recupera depois.

Se deixou algo por fazer, diga o que e por quê. Marque no `TASKS/task-NNN-*.md`
o que fechou e o que não fechou: a lista de tarefas do documento é o registro, e
ela vale mais atualizada do que bonita.

## Quando parar

Feche **uma** tarefa e pare. As tarefas deste repositório são grandes; se a sua
não couber numa iteração, **commite o que está pronto e verificado**, deixe o
documento dizendo onde parou, e pare — trabalho em pedaço commitado vale mais
que tarefa inteira perdida.

Se no meio do caminho descobrir que a tarefa depende de decisão que não é sua —
qual dos dois desenhos seguir, o que fazer com o `MapToolbar`, se a migração de
preset volta ou é abandonada —, **pare e relate**. Decidir por conta própria o
que foi reservado para uma pessoa é pior que não entregar.

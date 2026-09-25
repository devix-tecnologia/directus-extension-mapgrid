# 🧩 Task 017 — Traduzir o projeto inteiro para inglês, mantendo em português só o TASKS/

- Status: pending
- Type: refactor
- Assignee: Sidarta Veloso
- Priority: 810

## Description

O MapGrid é pacote público, e a regra do `CLAUDE.md` da raiz é código em inglês.
A task-013 traduziu `src/`, `tests/`, `.sandcastle/` e `scripts/screenshot/`.
Esta task estende a regra ao projeto inteiro: **tudo o que não estiver em
`TASKS/` e seus subdiretórios passa a ser em inglês** — arquivos, conteúdo,
comentários e nomes. É renomeação e reescrita de texto, sem mudar
comportamento; os testes (unitários e e2e) são a rede.

Ficam em português, por decisão tomada na criação (Sidarta, 2026-09-25):

- **`README.md`, seção pt-BR** — é decisão de publicação: o README é bilíngue
  de propósito, para os leitores do pacote público (o próprio texto das duas
  seções pede que a prosa seja corrigida nas duas)
- **`src/shared/messages.ts`, textos pt-BR** — é o recurso de interface
  bilíngue que acompanha o idioma do app do Directus; é característica, não
  resto
- **Mensagens de commit** — regra vigente do `CLAUDE.md`

## Inventário (medido em 2026-09-25)

Documentos e configuração, por área:

- `dev-docs/padroes/` — a pasta e o `estrutura-de-modulos.md` inteiro, em
  português. Atenção: é o registro de padrão de **outro** projeto (OpenTask),
  cita irmãos que não existem aqui (`typestate-handles.md`,
  `arquitetura-casos-de-uso.md`, `packages/declaracao-saude-types/...`) e dita
  "**Português primeiro** em nomes" — o oposto da regra deste repo. Ver "O
  destino do `dev-docs/padroes/`" em `## Notes`
- `.sandcastle/README.md`, `.sandcastle/prompt.md` e `.sandcastle/.env.example`
  — documentação em português. O `prompt.md` é o documento que instrui o
  agente; ele manda a fila, e o texto que a fila renderiza está em
  `.sandcastle/task-queue/task-queue.ts` — os dois mudam juntos
- `.sandcastle/task-queue/task-queue.ts` e `.test.ts` — o texto que a fila
  imprime é português, e o teste compara por regex em português
- `scripts/tamanho-de-evidencia/` — pasta, nomes, mensagens e testes em
  português. A task-013 **adiou** a renomeação ("sai quando o taskin com teto
  de anexo for adotado; não renomear"); esta task desfaz o adiamento. Está
  isolada — nenhum script do `package.json` nem do sandbox a chama
- Comentários em português: `docker-compose.yaml`, `docker-compose.test.yml`,
  `.gitignore`, `.sandcastle/Dockerfile`, `.storybook/preview.ts` (o rótulo
  `'Português'` do seletor de locale)
- `README.md` — as duas seções citam caminhos que renomearem (ex. `src/` com
  `centralizador-de-mapa/` já desatualizado, `dev-docs/padroes/`, o layout das
  pastas em "Project structure"); os links precisam acompanhar os nomes novos.
  O **conteúdo** em si fica como está (decisão de publicação)

Não é escopo, e fica como está:

- `src/`, `tests/`, `scripts/screenshot/`, `.sandcastle/` (código) — já em
  inglês desde a task-013
- Dados de fixture dos testes — nomes de lugar como `'Rio → São Paulo'`,
  `'Manaus → Belém'`, `'São Paulo'` são **valor de dado** de teste, não
  português-as-código
- `tests/e2e/mapgrid-options-persistence.spec.ts` — o seletor bilíngue
  `/comfortable|confortável/i`: o app do Directus muda de idioma, e o spec tem
  de casar nos dois (regra registrada na task-013)
- `docs/tela.jpg`, `featured.png`, `icon.png` — binários
- `TASKS/` e `TASKS/assets/` — a exceção inteira, inclusive o sufixo
  `-antes`/`-depois` dos PNG de evidência

## Tasks

<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [ ] Decidir o destino do `dev-docs/padroes/` (traduzir, arquivar ou mover) e
      executar — ver "O destino do `dev-docs/padroes/`"
- [ ] Traduzir a documentação do sandbox — `.sandcastle/README.md`,
      `.sandcastle/prompt.md`, `.sandcastle/.env.example` — e, no mesmo passo,
      o texto que a fila renderiza (`task-queue.ts`) com as regex do teste
- [ ] Renomear `scripts/tamanho-de-evidencia/` para inglês (ex.
      `scripts/evidence-size/`) e traduzir nomes, mensagens e testes
- [ ] Traduzir os comentários de `docker-compose.yaml`, `docker-compose.test.yml`,
      `.gitignore`, `.sandcastle/Dockerfile` e `.storybook/preview.ts`
- [ ] Atualizar no `README.md` (nas duas seções) os caminhos e a árvore de
      pastas que renomearem — conteúdo em si fica
- [ ] Conferir por busca que não sobrou conteúdo em português fora de `TASKS/`;
      o que ficou está em `## Notes`, com o motivo
- [ ] `pnpm lint`, `pnpm typecheck`, `pnpm typecheck:sandcastle`, `pnpm test` e
      `pnpm test:e2e` verdes
- [ ] ... — adiado: o que não couber na rodada, deixar documentado aqui

## Notes

### O destino do `dev-docs/padroes/`

O `estrutura-de-modulos.md` descreve o padrão de módulos da **OpenTask**, não do
MapGrid: cita `packages/declaracao-saude-types/`, irmãos que não existem nesta
árvore e manda "português primeiro". Traduzi-lo cega é trabalho perdido — o
documento pode nem pertencer a este repositório. Cabe decisão (reservada a uma
pessoa, não ao agente):

1. **Arquivar/mover** para um lugar que diga que é de outro projeto, e apontar
   o link do README para outro lugar, ou
2. **Traduzir e adaptar** o registro ao MapGrid (que já segue o mesmo padrão
   de uma pasta por classe), ou
3. **Remover** a pasta e o link do README.

A `## Description` desta task diz "projeto inteiro em inglês", mas o destino
desta pasta é decisão de conteúdo, não de idioma — por isso é o primeiro item
da lista, antes de qualquer tradução.

### O texto da fila e o `prompt.md` mudam juntos

O `task-queue.ts` monta o texto que o `prompt.md` manda o agente ler ("A
primeira linha da tabela é a sua..."). Se o `prompt.md` vira inglês mas a fila
continua em português, o agente lê um documento em inglês citando um texto em
português. Os dois passam no mesmo passo, e o `task-queue.test.ts` acompanha as
regex.

### O que fica em português, e por quê

- **`README.md` pt-BR** e **`src/shared/messages.ts` pt-BR** — decisões da
  criação, em `## Description`
- **Dados de fixture** dos testes (nomes de lugar) — são valor de dado
- **O seletor bilíngue** `/comfortable|confortável/i` — o app do Directus muda
  de idioma
- **Mensagens de commit** — regra vigente do `CLAUDE.md`
- **`TASKS/` e `TASKS/assets/`** — a exceção que esta task preserva, incluindo
  os PNG de evidência já versionados e o sufixo `-antes`/`-depois`

### Origem do inventário

Levantado em 2026-09-25 por busca de acentos e palavras portuguesas em arquivos
versionados fora de `TASKS/`. A conferência final ("conferido por busca") é o
mesmo método da task-013.
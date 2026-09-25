# Directus - MapGrid Layout Extension

[![Build](https://img.shields.io/github/actions/workflow/status/devix-tecnologia/directus-extension-mapgrid/release.yml?branch=main)](https://github.com/devix-tecnologia/directus-extension-mapgrid/actions)
[![Version](https://img.shields.io/npm/v/@devix-tecnologia/directus-extension-mapgrid)](https://www.npmjs.com/package/@devix-tecnologia/directus-extension-mapgrid)
[![License](https://img.shields.io/npm/l/@devix-tecnologia/directus-extension-mapgrid)](https://github.com/devix-tecnologia/directus-extension-mapgrid/blob/main/License.txt)

A Layout-type extension for Directus that displays a collection in map and grid form at the same time. Built by [Devix Tecnologia](https://devix.co).

![Extension visualization screen](https://raw.githubusercontent.com/devix-tecnologia/directus-extension-mapgrid/develop/docs/tela.jpg)

**🇺🇸 English** · [🇧🇷 Português](#-português)

---

## 🇺🇸 English

### Features

- **Map and grid together**: the Directus map layout and the Directus table layout side by side,
  over the same query and the same selection
- **Click a row, the map goes there**: the map flies to the item, keeping the current zoom — or
  zooming in, with *Zoom on focus*
- **Click a marker, the row is marked**: instead of leaving the layout for the item page. The mark
  is not the selection, so it does not arm the bulk actions
- **Walk the records**: first, previous, next and last, in the query's order. When the record is on
  another page, the page turns first
- **Play them back**: the camera walks the records on its own, at a configurable interval. With a
  vehicle tracking collection sorted by date, it drives the route in the order it happened
- **Camera tracking**: *free* leaves the map where you left it, *follow* moves only when the record
  leaves the visible area, *keep centred* keeps it in the middle at every step
- **What the Directus layouts already do**: basemap, clustering and display template from the map
  layout; columns, sorting, pagination and spacing from the table layout
- **Reset view**: re-fit the map to the current result set at any time
- **Bulk delete**: select rows and delete them from the layout header
- **Bilingual interface**: follows the Directus app locale (en-US, pt-BR)

### Installation

```bash
npm install @devix-tecnologia/directus-extension-mapgrid
```

### Configuration

1. Make sure your collection has a field of type **Map** (geolocation).
2. In the layout dropdown on the right, select **MapGrid**.
3. The layout options have four sections:
   - **Map**: the Directus map layout's own options — basemap, geospatial field, display template
     and clustering
   - **Grid**: the Directus table layout's own options
   - **Zoom on focus**: zoom in on the focused record instead of keeping the current zoom. It says
     nothing about *whether* the camera moves — that is the camera tracking's call
   - **Playback**: how many seconds to wait between records while playing back. One second is the
     floor, because each step asks the map for a camera animation

The geospatial field is detected from the collection, so the layout works before anything is set.

#### Walking the records

The controls sit on the map, in the MapGrid's own toolbar:

| Control | What it does |
| --- | --- |
| ⏮ First / ⏭ Last | The ends of the **query**, not of the page: they turn the page when they have to |
| ◀ Previous / ▶ Next | One record. At the edge of a page, the page turns and the record is the one at the other end of it |
| ▶ Play / ⏹ Stop | Walks forward on its own, and stops by itself at the last record |
| GPS | Cycles the camera tracking: free → follow → keep centred |

The same steps answer to the keyboard while the layout has the focus: **Home** and **End** for the
ends of the query, **←** and **→** for one record, and **Space** for play/stop. Every Directus
shortcut carries the meta key — `meta+s`, and the `meta+a` of the table below — so holding any
modifier hands the key back to them, and so does typing in a field. Each toolbar control shows its
key in the tooltip.

The order that defines "next" is the query's `sort`, which is the one showing in the grid header.
Sorting by a date/time field is what makes playback drive a route in the order it happened; with
any other sort, it walks that order instead. While a page is being fetched the controls wait, so no
record is skipped.

The current record is marked on its grid row and scrolled into view. It is deliberately **not** the
selection: that one also arms the bulk actions, and "I am looking at this" should not read as "I
marked this to be deleted". On the map it gets a ring of its own, drawn over the canvas: with
**Cluster data** on, the record's point would otherwise be inside a cluster and the playback would
be invisible. The ring is placed by projecting the geometry with the camera the map publishes,
which it only does when a movement ends — so it appears once the camera lands.

The basemaps offered are the ones in **Project Settings → Map**, as in every map of the app. The
chosen basemap is the app's choice, not the MapGrid's: it is shared with the other map layouts and
is not stored in the MapGrid preset — which is why a screen may look different from the one above.

#### Columns

Columns are chosen in the grid's own header, the way the Directus tabular layout does it — not in
the sidebar. The **+** at the end of the header row opens the collection's field list, and dragging
a header moves the column. Clicking a header opens that column's menu, which sorts it ascending or
descending and hides the field — in the Directus tabular layout sorting lives in that menu rather
than in the click itself. Every one of those choices is stored in the preset, so it is still there
on the next visit.

There is no limit on how many columns the grid can show.

> **Upgrading from 1.x.** Columns used to live in five numbered keys (`coluna1` … `coluna5`). The
> layout no longer reads them: after upgrading, the grid shows the Directus default columns until
> they are chosen again in its header.

### Running Directus with Docker Compose

Download this project, or copy its `docker-compose.yaml`, and start a clean install. With [Docker installed](https://docs.docker.com/get-docker/), run:

```bash
docker compose up
```

### Development

**Prerequisites:** Node.js >= 22.13.1 and pnpm >= 10.15.0.

```bash
git clone https://github.com/devix-tecnologia/directus-extension-mapgrid.git
cd directus-extension-mapgrid
pnpm install
docker compose up
```

#### Available scripts

```bash
# Development
pnpm dev              # Build in watch mode
pnpm storybook        # Start the Storybook dev server

# Build
pnpm build            # Build the extension
pnpm build-storybook  # Build Storybook

# Code quality
pnpm lint             # Run the Biome linter
pnpm lint:fix         # Fix what the linter can fix
pnpm format           # Format the source
pnpm typecheck        # Typecheck the source and the tests

# Testing
pnpm test             # Unit tests
pnpm test:watch       # Unit tests in watch mode
pnpm check:stories    # Open every story in a browser, fail on console output
pnpm screenshot       # Regenerate docs/tela.jpg from a running Directus
pnpm test:integration # Integration tests (requires Docker)
pnpm test:e2e         # End-to-end tests (requires Docker)
pnpm test:all         # Everything above that needs Docker
```

#### Project structure

```
src/
├── contract/            # Shapes crossing the Directus boundary
├── components/
│   ├── atoms/           # DeleteAction
│   ├── molecules/       # MapToolbar
│   └── templates/       # MapgridLayout, MapgridOptions
├── services/
│   ├── centralizador-de-mapa/ # Moves the embedded Directus map (works around its limitation)
│   ├── embedded-layout/ # Runs a Directus layout's setup() inside the MapGrid
│   └── optimistic-sync/ # Two writes to the preset in the same tick no longer erase each other
├── shared/              # Extension strings (en-US, pt-BR)
├── mocks/               # Directus environment and the mappable-collection catalogue
└── index.ts             # Extension entry point
```

The `contract/` layer is also published as a subpath (`@devix-tecnologia/directus-extension-mapgrid/contract`), so another extension in the same project can import the same types instead of redrawing them.

### Testing

| Suite | Needs Docker | What it covers |
| --- | --- | --- |
| `pnpm test` | no | Pure logic and components, with Vitest |
| `pnpm check:stories` | no | Every story opened in Chromium; fails on any console message |
| `pnpm test:integration` | yes | Extension logic against a real Directus instance |
| `pnpm test:e2e` | yes | The whole UI in a browser, with Playwright |

`RUNNER_ARGS` narrows a Docker run to one spec, which is what a measurement
usually wants: `RUNNER_ARGS=tests/e2e/mapgrid-playback-anticipation.spec.ts pnpm test:e2e`.

```
tests/
├── stories/                      # Storybook console check (Playwright, no Docker)
├── e2e/                          # End-to-end tests (Playwright)
│   ├── mapgrid-layout.spec.ts    # Map/grid rendering and interaction
│   ├── global-setup.ts           # Seeds the MapGrid preset before the suite
│   └── helpers/map-projection.ts # Web Mercator projection for canvas clicks
├── helpers/                      # Shared API/wait/preset helpers
├── helper-collection.ts          # Test collection with a Map field
├── run-docker-tests.js           # Docker runner (integration + e2e)
└── mapgrid.spec.ts               # Integration tests (Vitest)
```

### Engineering standards

Technical standard records live under [dev-docs/padroes/](dev-docs/padroes/). The codebase follows the Total TypeScript principles: honest types over assertions, derived types over duplicated shapes, and compiler and linter strictness kept on rather than silenced. Values crossing the Directus boundary are parsed in `contract/`, never asserted with `as`.

### Contributing

The README shows a screenshot of the running layout (`docs/tela.jpg`) right at
the top, and it is the first thing anyone sees on GitHub and on the npm page. Any
change that alters how a component looks has to refresh that screenshot as part
of the same work — a stale image advertises a product that no longer exists.
`pnpm screenshot` regenerates it against a real Directus, so this is a command
rather than a chore. The README is two complete documents, one per language, so
behaviour described in prose has to be corrected in both.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push the branch (`git push origin feature/amazing-feature`)
5. Open a pull request

### License

MIT — see [License.txt](License.txt).

### Links

- [Directus documentation](https://docs.directus.io/)
- [Directus extensions guide](https://docs.directus.io/extensions/overview.html)
- [Report an issue](https://github.com/devix-tecnologia/directus-extension-mapgrid/issues)

---

## 🇧🇷 Português

Extensão de layout para o Directus que exibe uma coleção simultaneamente em **mapa** e **grade**. Desenvolvida pela [Devix Tecnologia](https://devix.co).

[🇺🇸 English](#-english) · **🇧🇷 Português**

### Recursos

- **Mapa e grade juntos**: o layout de mapa e o layout de tabela do Directus lado a lado, sobre a
  mesma consulta e a mesma seleção
- **Clicar na linha leva o mapa até o item**: o mapa voa até ele mantendo o zoom de agora — ou
  aproximando, com *Zoom ao focar*
- **Clicar no marcador marca a linha**: em vez de sair do layout para a página do item. A marca não
  é a seleção, então não arma as ações em lote
- **Percorrer os registros**: primeiro, anterior, próximo e último, na ordem da consulta. Se o
  registro está em outra página, a página é trocada antes
- **Reproduzir**: a câmera percorre os registros sozinha, num intervalo configurável. Numa coleção
  de rastreamento veicular ordenada por data, ela refaz o trajeto na ordem em que ele aconteceu
- **Acompanhamento da câmera**: *livre* deixa o mapa onde você deixou, *seguir* move só quando o
  registro sai da área visível, *centralizar* mantém o registro sempre no meio
- **O que os layouts do Directus já fazem**: mapa base, agrupamento e template de exibição vêm do
  layout de mapa; colunas, ordenação, paginação e espaçamento vêm do layout de tabela
- **Reenquadrar**: reajustar o mapa ao resultado atual a qualquer momento
- **Exclusão em lote**: selecionar linhas e excluí-las pelo cabeçalho do layout
- **Interface bilíngue**: acompanha o idioma do app do Directus (en-US, pt-BR)

### Instalação

```bash
npm install @devix-tecnologia/directus-extension-mapgrid
```

### Configuração

1. Garanta que a coleção possua um campo do tipo **Map** (geolocalização).
2. No menu de layouts à direita, selecione **MapGrid**.
3. As opções do layout têm quatro seções:
   - **Mapa**: as opções do próprio layout de mapa do Directus — mapa base, campo geoespacial,
     template de exibição e agrupamento
   - **Grade**: as opções do próprio layout de tabela do Directus
   - **Zoom ao focar**: aproximar do registro focado em vez de manter o zoom de agora. Não diz nada
     sobre *se* a câmera se move — isso é do acompanhamento da câmera
   - **Reprodução**: quantos segundos esperar entre um registro e o próximo durante a reprodução. O
     piso é um segundo, porque cada passo pede uma animação de câmera ao mapa

O campo geoespacial é detectado a partir da coleção, então o layout funciona antes de qualquer
opção ser preenchida.

#### Percorrendo os registros

Os controles ficam sobre o mapa, na barra do próprio MapGrid:

| Controle | O que faz |
| --- | --- |
| ⏮ Primeiro / ⏭ Último | As pontas da **consulta**, não da página: trocam de página quando precisam |
| ◀ Anterior / ▶ Próximo | Um registro. Na borda da página, a página vira e o registro é o da outra ponta dela |
| ▶ Play / ⏹ Stop | Avança sozinho, e para no último registro por conta própria |
| GPS | Cicla o acompanhamento da câmera: livre → seguir → centralizar |

Os mesmos passos atendem ao teclado enquanto o layout está em foco: **Home** e **End** para as
pontas da consulta, **←** e **→** para um registro, e **Espaço** para play/stop. Todo atalho do
Directus leva a tecla meta — `meta+s`, e o `meta+a` da tabela abaixo —, então segurar qualquer
modificador devolve a tecla para eles, e digitar num campo também. Cada controle da barra mostra a
sua tecla na dica.

A ordem que define "próximo" é o `sort` da consulta, que é o que está à vista no cabeçalho da
grade. Ordenar por um campo de data/hora é o que faz a reprodução refazer um trajeto na ordem em
que ele aconteceu; com qualquer outra ordem, ela percorre essa outra ordem. Enquanto uma página
está sendo buscada, os controles esperam — nenhum registro é pulado.

O registro atual é marcado na linha da grade e rolado até a vista. Ele deliberadamente **não** é a
seleção: ela também arma as ações em lote, e "estou vendo este" não pode aparecer como "marquei
este para apagar". No mapa ele ganha um anel próprio, desenhado sobre a tela: com o **Cluster
data** ligado, o ponto do registro estaria dentro do agrupamento e a reprodução ficaria invisível.
O anel é posicionado projetando a geometria com a câmera que o mapa publica, e ele só a publica
quando um movimento termina — por isso a marca aparece quando a câmera pousa.

Os mapas base oferecidos são os de **Project Settings → Map**, como em todo mapa do app. O mapa base
escolhido é uma escolha do app, e não do MapGrid: vale também para os outros layouts de mapa e não
fica gravado no preset do MapGrid — por isso uma tela pode parecer diferente da que está acima.

#### Colunas

As colunas se escolhem no próprio cabeçalho da grade, como no layout tabular do Directus — e não no
painel lateral. O **+** no fim da linha de cabeçalho abre a lista de campos da coleção, e arrastar um
cabeçalho move a coluna. Clicar num cabeçalho abre o menu daquela coluna, que a ordena em ordem
crescente ou decrescente e oculta o campo — no layout tabular do Directus a ordenação mora nesse
menu, e não no clique em si. Cada uma dessas escolhas fica gravada no preset, então continua lá na
próxima visita.

Não há limite de quantas colunas a grade exibe.

> **Vindo da 1.x.** As colunas ficavam em cinco chaves numeradas (`coluna1` … `coluna5`). O layout
> não as lê mais: depois de atualizar, a grade mostra as colunas padrão do Directus até que sejam
> escolhidas de novo no cabeçalho dela.

### Rodando o Directus com Docker Compose

Baixe este projeto, ou copie o `docker-compose.yaml` dele, e inicie uma instalação limpa. Com o [Docker instalado](https://docs.docker.com/get-docker/), execute:

```bash
docker compose up
```

### Desenvolvimento

**Pré-requisitos:** Node.js >= 22.13.1 e pnpm >= 10.15.0.

```bash
git clone https://github.com/devix-tecnologia/directus-extension-mapgrid.git
cd directus-extension-mapgrid
pnpm install
docker compose up
```

#### Scripts disponíveis

```bash
# Desenvolvimento
pnpm dev              # Build em modo watch
pnpm storybook        # Sobe o servidor de desenvolvimento do Storybook

# Build
pnpm build            # Compila a extensão
pnpm build-storybook  # Compila o Storybook

# Qualidade de código
pnpm lint             # Roda o linter (Biome)
pnpm lint:fix         # Corrige o que o linter consegue corrigir
pnpm format           # Formata o código-fonte
pnpm typecheck        # Checa os tipos do código e dos testes

# Testes
pnpm test             # Testes unitários
pnpm test:watch       # Testes unitários em modo watch
pnpm check:stories    # Abre cada story num navegador e falha se houver console
pnpm screenshot       # Refaz docs/tela.jpg a partir de um Directus em execução
pnpm test:integration # Testes de integração (requer Docker)
pnpm test:e2e         # Testes ponta a ponta (requer Docker)
pnpm test:all         # Tudo acima que precisa de Docker
```

#### Estrutura do projeto

```
src/
├── contract/            # Formas que cruzam a fronteira com o Directus
├── components/
│   ├── atoms/           # DeleteAction
│   ├── molecules/       # MapToolbar
│   └── templates/       # MapgridLayout, MapgridOptions
├── services/
│   ├── centralizador-de-mapa/ # Move o mapa embutido do Directus (contorna a limitação dele)
│   ├── embedded-layout/ # Roda o setup() de um layout do Directus dentro do MapGrid
│   └── optimistic-sync/ # Duas escritas no preset no mesmo tick deixam de se apagar
├── shared/              # Textos da extensão (en-US, pt-BR)
├── mocks/               # Ambiente do Directus e catálogo de coleções mapeáveis
└── index.ts             # Ponto de entrada da extensão
```

A camada `contract/` também é publicada como subcaminho (`@devix-tecnologia/directus-extension-mapgrid/contract`), para outra extensão do mesmo projeto importar os mesmos tipos em vez de redesenhá-los.

### Testes

| Suíte | Precisa de Docker | O que cobre |
| --- | --- | --- |
| `pnpm test` | não | Lógica pura e componentes, com Vitest |
| `pnpm check:stories` | não | Cada story aberta no Chromium; falha a qualquer mensagem de console |
| `pnpm test:integration` | sim | Lógica da extensão contra um Directus real |
| `pnpm test:e2e` | sim | A interface inteira num navegador, com Playwright |

O `RUNNER_ARGS` restringe uma execução no Docker a um spec só, que é o que uma
medição costuma querer: `RUNNER_ARGS=tests/e2e/mapgrid-playback-anticipation.spec.ts pnpm test:e2e`.

```
tests/
├── stories/                      # Checagem do console das stories (Playwright, sem Docker)
├── e2e/                          # Testes ponta a ponta (Playwright)
│   ├── mapgrid-layout.spec.ts    # Renderização e interação de mapa/grade
│   ├── global-setup.ts           # Semeia o preset do MapGrid antes da suíte
│   └── helpers/map-projection.ts # Projeção Web Mercator para cliques no canvas
├── helpers/                      # Auxiliares de API, espera e preset
├── helper-collection.ts          # Coleção de teste com campo Map
├── run-docker-tests.js           # Executor Docker (integração + e2e)
└── mapgrid.spec.ts               # Testes de integração (Vitest)
```

### Padrões de engenharia

Os registros de padrão técnico ficam em [dev-docs/padroes/](dev-docs/padroes/). O código segue a filosofia Total TypeScript: tipos honestos em vez de asserções, tipos derivados em vez de formas duplicadas, e a severidade do compilador e do linter mantida ligada em vez de silenciada. Valores que cruzam a fronteira com o Directus são parseados em `contract/`, nunca asseverados com `as`.

### Contribuindo

O README exibe logo no topo uma captura do layout em funcionamento
(`docs/tela.jpg`), e ela é a primeira coisa que alguém vê no GitHub e na página
do npm. Toda mudança que altere a aparência de um componente precisa refazer essa
captura como parte do mesmo trabalho — uma imagem desatualizada anuncia um
produto que não existe mais. O `pnpm screenshot` refaz a imagem contra um
Directus de verdade, então isso é um comando e não uma tarefa manual. O README
são dois documentos completos, um por idioma, então comportamento descrito em
texto precisa ser corrigido nos dois.

1. Faça um fork do repositório
2. Crie sua branch (`git checkout -b feature/recurso-incrivel`)
3. Faça o commit (`git commit -m 'feat: adiciona recurso incrível'`)
4. Envie a branch (`git push origin feature/recurso-incrivel`)
5. Abra um pull request

### Licença

MIT — veja [License.txt](License.txt).

### Links

- [Documentação do Directus](https://docs.directus.io/)
- [Guia de extensões do Directus](https://docs.directus.io/extensions/overview.html)
- [Relatar um problema](https://github.com/devix-tecnologia/directus-extension-mapgrid/issues)

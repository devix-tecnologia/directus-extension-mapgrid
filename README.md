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

- **Interactive map**: items drawn on a MapLibre GL map
- **Grid**: the same items in a sortable, selectable table
- **Synchronised selection**: click a row to highlight its marker, click a marker to highlight its row
- **Clustering**: automatic grouping where points are dense
- **Configurable columns**: choose which fields the grid shows
- **Zoom on click**: fly to an item, or only pan when it is off screen
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
3. Set the layout options:
   - **Geolocation**: the map field to read on each item
   - **Popup Pin Map**: the template shown in a marker's popup
   - **Map Center**: the starting coordinates and zoom
   - **Table Columns**: which fields appear in the grid

The layout detects sensible defaults from the collection, so it is usable before any of these are set.

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
pnpm test:integration # Integration tests (requires Docker)
pnpm test:e2e         # End-to-end tests (requires Docker)
pnpm test:all         # Everything above that needs Docker
```

#### Project structure

```
src/
├── contract/            # Shapes crossing the Directus boundary, and their parsers
├── components/
│   ├── atoms/           # DeleteAction, ValueCell
│   ├── molecules/       # MapToolbar
│   ├── organisms/       # MapComponent, TableComponent
│   └── templates/       # MapgridLayout, MapgridOptions
├── services/
│   ├── geo/             # GeoJSON building, map camera, maplibre feature parsing
│   ├── table/           # Table header types
│   └── value-formatter/ # Field template resolution and value serialization
├── shared/              # Extension strings (en-US, pt-BR)
├── mocks/               # Directus environment and the mappable-collection catalogue
└── index.ts             # Extension entry point
```

The `contract/` layer is also published as a subpath (`@devix-tecnologia/directus-extension-mapgrid/contract`), so another extension in the same project can import the same types and normalizers instead of redrawing them.

### Testing

| Suite | Needs Docker | What it covers |
| --- | --- | --- |
| `pnpm test` | no | Pure logic and components, with Vitest |
| `pnpm check:stories` | no | Every story opened in Chromium; fails on any console message |
| `pnpm test:integration` | yes | Extension logic against a real Directus instance |
| `pnpm test:e2e` | yes | The whole UI in a browser, with Playwright |

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

- **Mapa interativo**: os itens desenhados num mapa MapLibre GL
- **Grade**: os mesmos itens numa tabela ordenável e selecionável
- **Seleção sincronizada**: clicar numa linha destaca o marcador, clicar num marcador destaca a linha
- **Agrupamento**: junção automática onde os pontos são densos
- **Colunas configuráveis**: escolha quais campos a grade mostra
- **Zoom ao clicar**: voar até o item, ou apenas deslocar quando ele está fora da tela
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
3. Ajuste as opções do layout:
   - **Geolocalização**: o campo de mapa a ler em cada item
   - **Popup do marcador**: o template exibido no popup
   - **Centro do mapa**: coordenadas e zoom iniciais
   - **Colunas da grade**: quais campos aparecem na grade

O layout detecta padrões razoáveis a partir da coleção, então já é utilizável antes de qualquer uma dessas opções ser preenchida.

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
pnpm test:integration # Testes de integração (requer Docker)
pnpm test:e2e         # Testes ponta a ponta (requer Docker)
pnpm test:all         # Tudo acima que precisa de Docker
```

#### Estrutura do projeto

```
src/
├── contract/            # Formas que cruzam a fronteira com o Directus, e seus parsers
├── components/
│   ├── atoms/           # DeleteAction, ValueCell
│   ├── molecules/       # MapToolbar
│   ├── organisms/       # MapComponent, TableComponent
│   └── templates/       # MapgridLayout, MapgridOptions
├── services/
│   ├── geo/             # Montagem do GeoJSON, câmera do mapa, parse das features
│   ├── table/           # Tipos dos cabeçalhos da grade
│   └── value-formatter/ # Resolução de template e serialização de valores
├── shared/              # Textos da extensão (en-US, pt-BR)
├── mocks/               # Ambiente do Directus e catálogo de coleções mapeáveis
└── index.ts             # Ponto de entrada da extensão
```

A camada `contract/` também é publicada como subcaminho (`@devix-tecnologia/directus-extension-mapgrid/contract`), para outra extensão do mesmo projeto importar os mesmos tipos e normalizadores em vez de redesenhá-los.

### Testes

| Suíte | Precisa de Docker | O que cobre |
| --- | --- | --- |
| `pnpm test` | não | Lógica pura e componentes, com Vitest |
| `pnpm check:stories` | não | Cada story aberta no Chromium; falha a qualquer mensagem de console |
| `pnpm test:integration` | sim | Lógica da extensão contra um Directus real |
| `pnpm test:e2e` | sim | A interface inteira num navegador, com Playwright |

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

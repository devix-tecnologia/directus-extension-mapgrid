# Directus - MapGrid Layout Extension

[![Build](https://img.shields.io/github/actions/workflow/status/devix-tecnologia/directus-extension-mapgrid/release.yml?branch=main)](https://github.com/devix-tecnologia/directus-extension-mapgrid/actions)
[![Version](https://img.shields.io/npm/v/@devix-tecnologia/directus-extension-mapgrid)](https://www.npmjs.com/package/@devix-tecnologia/directus-extension-mapgrid)
[![License](https://img.shields.io/npm/l/@devix-tecnologia/directus-extension-mapgrid)](https://github.com/devix-tecnologia/directus-extension-mapgrid/blob/main/License.txt)

A Layout-type extension for Directus that displays content in both map and grid formats simultaneously. Developed by [Devix Tecnologia](https://devix.co).

![Extension visualization screen](https://raw.githubusercontent.com/devix-tecnologia/directus-extension-mapgrid/develop/docs/tela.jpg)

> [🇧🇷 Guia de uso em português](#-guia-de-uso-pt-br) | [🇺🇸 Usage guide in English](#-usage-guide-en)

## Features

- **Interactive Map**: Display items on an interactive map using MapLibre GL
- **Grid Table**: View items in a sortable, selectable table
- **Synchronized Selection**: Click a row to highlight on map, click a marker to highlight in table
- **Clustering**: Automatic clustering for dense map areas
- **Customizable Columns**: Configure which fields to display in the table
- **Zoom Controls**: Zoom to items on click or pan to visible area
- **Reset View**: Re-fit the map to the current result set at any time

---

## 🇧🇷 Guia de uso (PT-BR)

Extensão de layout para o Directus que exibe o conteúdo de uma coleção simultaneamente em **mapa** e **grade** (grid).

### Instalação

```bash
npm install @devix-tecnologia/directus-extension-mapgrid
```

### Usando a extensão

- Garanta que a coleção possua um campo do tipo **"Map"** e selecione esse campo nas Opções do Layout (campo **Geolocation**).
- Ative o layout no menu de configurações à direita selecionando **"MapGrid"** na lista de layouts.
- Configure as opções do layout:
  - **Geolocation**: campo de mapa da sua coleção
  - **Popup Pin Map**: template exibido no popup dos marcadores
  - **Map Center**: coordenadas e zoom iniciais do mapa
  - **Table Columns**: quais campos aparecem na grade

### Rodando o Directus com Docker Compose

- Baixe este projeto ou copie o arquivo `docker-compose.yaml` e inicie uma instalação limpa.
- Com o Docker instalado na sua máquina ([saiba mais](https://docs.docker.com/get-docker/)), execute:

```bash
docker compose up
```

### Links importantes

- [Directus Quickstart](https://docs.directus.io/getting-started/quickstart.html) (na aba Docker Installation)
- [Como criar uma extensão](https://docs.directus.io/extensions/creating-extensions.html)
- [Acessar serviços do Directus](https://docs.directus.io/extensions/services/introduction.html)
- [Acessar itens armazenados de coleções](https://docs.directus.io/extensions/services/accessing-items.html)

---

## 🇺🇸 Usage guide (EN)

### Installation

```bash
npm install @devix-tecnologia/directus-extension-mapgrid
```

### Using the extension

- Make sure your collection has a field of type **"Map"** and select that field in the Layout Options (**Geolocation** field).
- Enable the layout from the settings menu on the right by selecting **"MapGrid"** from the layout dropdown.
- Configure the layout options:
  - **Geolocation**: Select the map field from your collection
  - **Popup Pin Map**: Configure the template for map markers
  - **Map Center**: Set the default center coordinates and zoom level
  - **Table Columns**: Select which fields to display in the grid

### Running Directus with Docker Compose

- Download this project or copy the `docker-compose.yaml` file and start a fresh installation.
- With Docker installed on your machine ([learn more](https://docs.docker.com/get-docker/)), run:

```bash
docker compose up
```

### Important links

- [Directus Quickstart](https://docs.directus.io/getting-started/quickstart.html) (under the Docker Installation tab)
- [How to Create an Extension](https://docs.directus.io/extensions/creating-extensions.html)
- [Access Directus Services](https://docs.directus.io/extensions/services/introduction.html)
- [Access Stored Collection Items](https://docs.directus.io/extensions/services/accessing-items.html)

---

## Development

### Prerequisites

- Node.js >= 22.13.1
- pnpm >= 10.15.0

### Setup

```bash
# Clone the repository
git clone https://github.com/devix-tecnologia/directus-extension-mapgrid.git
cd directus-extension-mapgrid

# Install dependencies
pnpm install

# Start Directus with Docker
docker compose up
```

### Available Scripts

```bash
# Development
pnpm dev              # Build with watch mode
pnpm storybook        # Start Storybook dev server

# Build
pnpm build            # Build the extension
pnpm build-storybook  # Build Storybook

# Code Quality
pnpm lint             # Run Biome linter
pnpm lint:fix         # Fix linting issues
pnpm format           # Format code
pnpm typecheck        # Run TypeScript type checking

# Testing
pnpm test             # Run unit tests
pnpm test:watch       # Run tests in watch mode
pnpm check:stories    # Open every story in a browser, fail on console output
pnpm test:integration # Run integration tests (requires Docker)
pnpm test:e2e         # Run E2E tests (requires Docker)
pnpm test:e2e:debug   # Run E2E tests in debug mode
pnpm test:e2e:headed  # Run E2E tests in headed mode
pnpm test:e2e:report  # Show E2E test report
pnpm test:all         # Run all tests
```

### Project Structure

```
src/
├── components/
│   ├── atoms/           # Atomic components (DeleteAction, ValueCell)
│   ├── molecules/       # Molecular components (MapToolbar)
│   ├── organisms/       # Organism components (MapComponent, TableComponent)
│   └── templates/       # Template components (MapgridLayout, MapgridOptions)
├── services/
│   ├── geo/             # GeoJSON building and coordinate extraction
│   ├── table/           # Table header types
│   └── value-formatter/ # Field template resolution and value serialization
├── index.ts             # Extension entry point
├── types.ts             # TypeScript type definitions
└── shims.d.ts           # Vue module declarations
```

## Tech Stack

- [Vue 3](https://vuejs.org/) - UI Framework
- [MapLibre GL](https://maplibre.org/) - Map rendering
- [Directus SDK](https://docs.directus.io/) - Directus integration
- [Biome](https://biomejs.dev/) - Linting and formatting
- [Storybook](https://storybook.js.org/) - Component documentation
- [Vitest](https://vitest.dev/) - Unit and integration testing
- [Playwright](https://playwright.dev/) - End-to-end testing

## Testing

### Prerequisites

- Docker and Docker Compose
- Node.js >= 22.13.1
- pnpm >= 10.15.0

### Test Structure

```
tests/
├── e2e/                          # E2E tests (Playwright)
│   ├── mapgrid-layout.spec.ts    # UI tests for map/grid rendering and interaction
│   ├── global-setup.ts           # Seeds the global MapGrid preset before the suite
│   └── helpers/
│       └── map-projection.ts     # Web Mercator projection for canvas clicks
├── stories/                      # Storybook console check (Playwright, no Docker)
│   └── console.spec.ts           # Fails if any story writes to the browser console
├── helpers/                      # Shared API/wait/preset helpers
├── helper-collection.ts          # Test collection creation with Map field
├── setup.ts                      # Docker environment setup/teardown
├── test-env.ts                   # Test environment variables
├── test-logger.ts                # Test logger
├── run-docker-tests.js           # Docker test runner (integration + e2e suites)
└── mapgrid.spec.ts               # Integration tests (Vitest)
```

### Running Tests

```bash
# Unit tests (no Docker required)
pnpm test

# Storybook console check (no Docker required)
# Starts Storybook, opens every story in Chromium and fails on any console
# warning or error. Catches what build-storybook and unit tests cannot see:
# undeclared props reaching a component, plugins breaking at render time.
pnpm check:stories

# Integration tests (requires Docker)
# Tests extension logic against a real Directus instance
pnpm test:integration

# E2E tests (requires Docker)
# Tests the full UI in a browser via Playwright
pnpm test:e2e

# Run all tests
pnpm test:all
```

## Engineering Standards

Technical standard records live under [dev-docs/padroes/](dev-docs/padroes/). The codebase follows
the Total TypeScript principles: honest types over assertions, derived types over duplicated shapes,
and compiler/linter strictness kept on rather than silenced.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [License.txt](License.txt) file for details.

## Links

- [Directus Documentation](https://docs.directus.io/)
- [Directus Extensions Guide](https://docs.directus.io/extensions/overview.html)
- [Report Issues](https://github.com/devix-tecnologia/directus-extension-mapgrid/issues)

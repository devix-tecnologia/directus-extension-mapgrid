# Directus - MapGrid Layout Extension

[![Build](https://img.shields.io/github/actions/workflow/status/devix-tecnologia/directus-extension-mapgrid/ci.yml?branch=main)](https://github.com/devix-tecnologia/directus-extension-mapgrid/actions)
[![Version](https://img.shields.io/npm/v/@devix-tecnologia/directus-extension-mapgrid)](https://www.npmjs.com/package/@devix-tecnologia/directus-extension-mapgrid)
[![License](https://img.shields.io/npm/l/@devix-tecnologia/directus-extension-mapgrid)](https://github.com/devix-tecnologia/directus-extension-mapgrid/blob/main/License.txt)

A Layout-type extension for Directus that displays content in both map and grid formats simultaneously. Developed by [Devix Tecnologia](https://devix.co).

![Extension visualization screen](https://raw.githubusercontent.com/devix-tecnologia/directus-extension-mapgrid/develop/docs/tela.jpg)

## Features

- **Interactive Map**: Display items on an interactive map using MapLibre GL
- **Grid Table**: View items in a sortable, selectable table
- **Synchronized Selection**: Click a row to highlight on map, click a marker to highlight in table
- **Clustering**: Automatic clustering for dense map areas
- **Customizable Columns**: Configure which fields to display in the table
- **Zoom Controls**: Zoom to items on click or pan to visible area

## Installation

```bash
npm install @devix-tecnologia/directus-extension-mapgrid
```

## Configuration

1. Ensure your collection has a field of type **Map** (geolocation)
2. Enable the Layout in the Directus settings by selecting **MapGrid** from the dropdown
3. Configure the layout options:
   - **Geolocation**: Select the map field from your collection
   - **Popup Pin Map**: Configure the template for map markers
   - **Map Center**: Set the default center coordinates and zoom level
   - **Table Columns**: Select which fields to display in the grid

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
│   ├── atoms/           # Atomic components (DeleteAction)
│   ├── molecules/       # Molecular components (MapGridOptions)
│   ├── organisms/       # Organism components (MapComponent, TableComponent)
│   └── templates/       # Template components (MapGridLayout)
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
│   └── mapgrid-layout.spec.ts    # UI tests for map/grid rendering and interaction
├── helpers/                      # Shared helpers
├── helper-collection.ts          # Test collection creation with Map field
├── helper-items.ts               # Test items CRUD
├── setup.ts                      # Docker environment setup/teardown
├── test-env.ts                   # Test environment variables
├── test-logger.ts                # Test logger
├── run-e2e.js                    # E2E test runner (manages Docker containers)
└── mapgrid.spec.ts               # Integration tests (Vitest)
```

### Running Tests

```bash
# Unit tests (no Docker required)
pnpm test

# Integration tests (requires Docker)
# Tests extension logic against a real Directus instance
pnpm test:integration

# E2E tests (requires Docker)
# Tests the full UI in a browser via Playwright
pnpm test:e2e

# Run all tests
pnpm test:all
```

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

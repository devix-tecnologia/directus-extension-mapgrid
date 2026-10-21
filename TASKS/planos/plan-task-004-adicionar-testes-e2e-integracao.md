# Plano de Execucao -- Task 004: Adicionar Testes E2E/Integracao

**Status:** pendente
**Data:** 2026-08-21
**Responsavel:** marcospatricio

---

## Objetivo

Adicionar testes e2e/integracao em TypeScript que confirmem o funcionamento da extensao MapGrid, seguindo o padrao estabelecido nos projetos de referencia: **Playwright** para testes e2e, **Vitest** para testes de integracao, e **Docker** (`docker-compose.test.yml`) para subir uma instancia isolada do Directus.

---

## Analise do Estado Atual

### Estrutura do Projeto

| Item | Status |
|---|---|
| Extensao tipo | `layout` (nao bundle nem module) |
| Diretorio fonte | `src/` com Atomic Design (atoms/molecules/organisms/templates) |
| Testes unitarios existentes | `*.spec.ts` em cada componente (Vitest + happy-dom) |
| Config Vitest existente | `vitest.config.ts` (environment: happy-dom, include: `src/**/*.spec.ts`) |
| Docker existente | `docker-compose.yaml` (dev com PostGIS + pgAdmin) |
| Playwright | Nao instalado |
| docker-compose.test.yml | Nao existe |
| tests/ | Nao existe |
| Scripts de teste no package.json | `test` e `test:watch` (apenas Vitest unitario) |

### Componentes da Extensao

| Componente | Arquivo | Responsabilidade |
|---|---|---|
| Layout principal | `src/components/templates/MapGridLayout.vue` | Orquestra mapa + tabela, gerencia selecao |
| Mapa | `src/components/organisms/MapComponent.vue` | Renderiza mapa MapLibre GL, markers, clusters, popups |
| Tabela | `src/components/organisms/TableComponent.vue` | Renderiza grid com `v-table`, selecao de linhas |
| Opcoes | `src/components/molecules/MapGridOptions.vue` | Painel de configuracao (colunas, geolocalizacao, etc.) |
| DeleteAction | `src/components/atoms/DeleteAction.vue` | Botao de exclusao em lote |
| Entry point | `src/index.ts` | `defineLayout` com setup (opcoes, items, delete) |
| Utilitarios | `src/utils.ts` | `serializeFieldValue`, `serializeItemRow` |
| Tipos | `src/types.ts` | `RowItem`, `GeoItem`, `GeoJsonFeature`, `LayoutOptions`, `LayoutQuery` |

### Funcionalidades Criticas a Testar

1. **Renderizacao do mapa** -- MapLibre GL inicializa e exibe tiles OpenStreetMap
2. **Renderizacao da grade** -- `v-table` exibe itens da colecao
3. **Carregamento de itens** -- Itens com campo geografico sao exibidos em ambos
4. **Interacao grid -> mapa** -- Clicar em um registro do grid centraliza o mapa no marker correspondente (via `focusOnItem`)
5. **Interacao mapa -> grid** -- Clicar em um marker no mapa seleciona o item no grid (via `select-item` emit)
6. **Controles** -- Botao de reset do mapa, paginacao, ordenacao
7. **GeoJSON** -- Construcao correta do FeatureCollection a partir dos itens
8. **Serializacao** -- `serializeFieldValue` e `serializeItemRow` transformam dados corretamente

---

## Plano de Acao

### Fase 1: Infraestrutura Docker para Testes

**Arquivo:** `docker-compose.test.yml`

Criar compose de teste isolado seguindo o padrao dos projetos de referencia:

- **Servico `directus`**: Directus 11.x com SQLite (leve, sem dependencia externa), com a extensao montada via volume, healthcheck via `/server/health`
- **Servico `tests`**: Container Playwright (`mcr.microsoft.com/playwright`) que instala dependencias, roda `playwright install --with-deps` e executa os testes
- **Rede isolada** para comunicacao entre containers
- **Porta dinamica** (`0:8055`) para evitar conflitos
- **tmpfs** para banco de dados e uploads (performance)

**Adaptacoes em relacao aos projetos de referencia:**

- O mapgrid e uma extensao `layout` (nao `bundle`), entao o volume deve mapear `dist/index.js` (nao `dist/app.js` + `dist/api.js`)
- Usar SQLite ao inves de PostGIS para simplificar os testes (o campo Map do Directus funciona com SQLite)
- O container de testes precisa de acesso ao Playwright com dependencias de sistema (Chromium)

**Notas sobre o campo "Map" no Directus:**

- O campo de geolocalizacao do Directus (interface `map`) armazena dados no formato GeoJSON (`{ type: "Point", coordinates: [lng, lat] }`)
- A extensao mapgrid espera que o campo geografico esteja presente nos itens para renderizar markers
- O teste deve criar a colecao com um campo do tipo `json` com interface `map`

### Fase 2: Infraestrutura de Testes -- Utilitarios Compartilhados

**Arquivos a criar:**

```
tests/
├── e2e/                          # Testes E2E (Playwright)
│   └── .gitignore                # Ignorar test-results/
├── helpers/                      # Helpers compartilhados
│   └── directus-api.ts           # Funcoes para interagir com a API do Directus
├── helper-collection.ts          # Criacao de colecao de teste com campo Map
├── helper-items.ts               # CRUD de itens de teste
├── setup.ts                      # Setup/teardown do ambiente Docker
├── test-env.ts                   # Variaveis de ambiente de teste
├── test-logger.ts                # Logger simples para testes
├── run-e2e.js                    # Script runner para E2E (manage containers)
├── mapgrid.spec.ts               # Testes de integracao (Vitest)
└── e2e/
    └── mapgrid-layout.spec.ts    # Testes E2E (Playwright)
```

#### `tests/test-env.ts`
Variaveis de ambiente de teste (credenciais admin, URL interna do Directus).

#### `tests/test-logger.ts`
Logger simples com levels (info, debug, warn, error), seguindo o padrao do inframe.

#### `tests/setup.ts`
Funcoes `setupTestEnvironment` e `teardownTestEnvironment`:
- Detectar comando `docker compose` vs `docker-compose`
- Limpar containers anteriores
- Subir containers via `docker-compose.test.yml`
- Aguardar healthcheck do Directus
- Aguardar bootstrap (verificar `/server/health` e fazer login)
- Retornar `access_token` para uso nos testes
- Funcao `dockerHttpRequest` para fazer requisicoes HTTP via `docker exec` dentro do container

#### `tests/helper-collection.ts`
Funcoes para criar a colecao de teste programaticamente:

- Criar colecao `test_mapgrid_items`
- Campos: `id` (integer, primary key), `name` (string), `location` (json, interface: map), `status` (string)
- Popular com 5-10 itens com coordenadas reais (Brasil)
- Configurar mapgrid como layout de visualizacao da colecao

**Nota importante:** O campo "Map" no Directus e armazenado como `json` no banco. O teste deve criar o campo com `type: 'json'` e `meta.interface: 'map'`. A configuracao do mapgrid como layout requer criar um registro na tabela `directus_presets` ou configurar via API de metadados.

#### `tests/helper-items.ts`
Funcoes CRUD para itens de teste:
- `createTestItem(name, location, status)` -- Cria um item via API
- `getTestItems()` -- Lista itens
- `deleteTestItems()` -- Remove todos os itens de teste

#### `tests/run-e2e.js`
Script Node.js que gerencia o ciclo de vida dos containers para testes E2E:
1. Verificar/parar container existente
2. Iniciar container novo
3. Aguardar healthcheck
4. Obter porta dinamica
5. Executar `playwright test` com `DIRECTUS_URL` configurado
6. Retornar exit code

### Fase 3: Configuracao dos Testadores

#### `playwright.config.ts` (ou `.cjs`)
- `testDir: './tests/e2e'`
- `timeout: 180000` (3 min por teste)
- `fullyParallel: true`
- `retries: 2` (CI), `0` (local)
- `reporter: 'html'`
- `use.baseURL: process.env.DIRECTUS_URL || 'http://localhost:8055'`
- `use.trace: 'retain-on-failure'`
- `use.screenshot: 'only-on-failure'`
- `use.video: 'retain-on-failure'`
- `projects: [{ name: 'chromium', use: devices['Desktop Chrome'] }]`

#### `vitest.config.ts` (atualizar)
O `vitest.config.ts` atual e para testes unitarios (happy-dom). Para os testes de integracao que rodam contra o Directus via Docker, criar uma configuracao separada:

- Criar `vitest.integration.config.ts` com `environment: 'node'` e `include: ['tests/**/*.spec.ts']`
- Manter o `vitest.config.ts` atual para testes unitarios (`src/**/*.spec.ts`)

**Decisao:** Criar `vitest.integration.config.ts` separado para manter compatibilidade com os testes unitarios existentes.

### Fase 4: Testes de Integracao (Vitest)

**Arquivo:** `tests/mapgrid.spec.ts`

Testes que validam a logica da extensao contra uma instancia real do Directus:

1. **Extension should be registered as layout** -- Verificar via API que a extensao mapgrid esta disponivel
2. **Test collection should have Map field configured** -- GET `/fields/test_mapgrid_items/location` -> verificar tipo json, interface map
3. **Test items should have valid geolocation data** -- GET `/items/test_mapgrid_items` -> verificar que `location.coordinates` existem
4. **GeoJSON construction should work correctly** -- Testar a logica de `buildGeoJson` com dados reais da API, verificar formato FeatureCollection
5. **serializeFieldValue should handle all field types** -- Testar com strings, numeros, null, undefined, objetos com coordinates, arrays
6. **serializeItemRow should handle missing fields** -- Testar com item completo, item sem campo, campo vazio
7. **Layout options should have correct defaults** -- Verificar que `mapCenterLng=-47.9292`, `mapCenterLat=-15.7801`, `mapZoom=4`
8. **Items should be filterable and sortable** -- Testar query com filter e sort via API

### Fase 5: Testes E2E (Playwright)

**Arquivo:** `tests/e2e/mapgrid-layout.spec.ts`

Testes que validam a UI completa no navegador:

1. **Renderizacao do mapa** -- Navegar para a colecao com layout mapgrid, verificar que o container do mapa existe no DOM
2. **Renderizacao da grade** -- Verificar que a tabela (`v-table`) e renderizada com os itens
3. **Carregamento de itens** -- Verificar que os marcadores sao exibidos no mapa (via canvas ou elementos SVG)
4. **Interacao grid -> mapa (foco no marker)** -- Clicar em uma linha da tabela, verificar que o mapa centraliza no marker correspondente (verificar mudanca de center/zoom ou presenca de popup)
5. **Interacao mapa -> grid (selecao)** -- Clicar em um marker no mapa, verificar que a linha correspondente e selecionada no grid (classe `selected-row`)
6. **Botao de reset** -- Clicar no botao de reset do mapa, verificar que o mapa volta ao estado inicial
7. **Estado vazio** -- Navegar para uma colecao sem itens, verificar que a mensagem "No items found" e exibida

**Fluxo de cada teste E2E:**
1. Login no Directus via API (obter cookie/session)
2. Navegar para a URL da colecao com layout mapgrid configurado
3. Aguardar renderizacao (waitForSelector ou waitForResponse)
4. Interagir com os elementos
5. Validar o resultado

### Fase 6: Scripts no package.json e Documentacao

**Scripts a adicionar em `package.json`:**

```json
"test": "vitest run",
"test:watch": "vitest",
"test:integration": "vitest run --config vitest.integration.config.ts",
"test:e2e": "VERBOSE=true node tests/run-e2e.js",
"test:e2e:ui": "VERBOSE=true node tests/run-e2e.js --ui",
"test:e2e:debug": "playwright test --debug",
"test:e2e:headed": "playwright test --headed",
"test:e2e:report": "playwright show-report",
"test:all": "pnpm test && pnpm test:integration && pnpm test:e2e"
```

**Documentacao no README.md** (secao de testes):
- Como rodar testes unitarios: `pnpm test`
- Como rodar testes de integracao: `pnpm test:integration`
- Como rodar testes E2E: `pnpm test:e2e`
- Requisitos: Docker, Node.js, pnpm
- Estrutura da pasta `tests/`

### Fase 7: Validacao Final

Rodar e validar todos os comandos:
1. `pnpm lint` -- Biome check sem erros
2. `pnpm typecheck` -- TypeScript sem erros
3. `pnpm test` -- Testes unitarios existentes passam
4. `pnpm test:integration` -- Testes de integracao passam
5. `pnpm test:e2e` -- Testes E2E passam
6. `pnpm build` -- Build da extensao funciona

---

## Dependencias a Instalar

```bash
# Playwright (testes E2E)
pnpm add -D @playwright/test playwright

# Axios (requisicoes HTTP nos helpers de teste)
pnpm add -D axios

# Dependencias ja existentes (nao precisa instalar):
# - vitest (ja existe)
# - @vitest/coverage-v8 (ja existe)
# - typescript (ja existe)
```

---

## Arquivos a Criar/Modificar

| Arquivo | Acao | Prioridade |
|---|---|---|
| `docker-compose.test.yml` | Criar | Alta |
| `playwright.config.ts` | Criar | Alta |
| `vitest.integration.config.ts` | Criar | Alta |
| `tests/test-env.ts` | Criar | Alta |
| `tests/test-logger.ts` | Criar | Alta |
| `tests/setup.ts` | Criar | Alta |
| `tests/helper-collection.ts` | Criar | Alta |
| `tests/helper-items.ts` | Criar | Alta |
| `tests/run-e2e.js` | Criar | Alta |
| `tests/mapgrid.spec.ts` | Criar | Alta |
| `tests/e2e/.gitignore` | Criar | Media |
| `tests/e2e/mapgrid-layout.spec.ts` | Criar | Alta |
| `package.json` | Modificar (scripts + deps) | Alta |
| `.gitignore` | Modificar (adicionar test-results/) | Media |
| `README.md` | Modificar (secao de testes) | Media |

---

## Ordem de Execucao

1. Instalar dependencias (`@playwright/test`, `playwright`, `axios`)
2. Criar `docker-compose.test.yml`
3. Criar utilitarios de teste (`test-env.ts`, `test-logger.ts`, `setup.ts`, `helper-collection.ts`, `helper-items.ts`)
4. Criar `vitest.integration.config.ts`
5. Criar `tests/mapgrid.spec.ts` (testes de integracao)
6. Rodar `pnpm test:integration` e validar
7. Criar `playwright.config.ts`
8. Criar `tests/run-e2e.js`
9. Criar `tests/e2e/.gitignore`
10. Criar `tests/e2e/mapgrid-layout.spec.ts` (testes E2E)
11. Rodar `pnpm test:e2e` e validar
12. Atualizar `package.json` (scripts)
13. Atualizar `.gitignore` (test-results/)
14. Atualizar `README.md` (secao de testes)
15. Rodar validacao final (`pnpm lint`, `pnpm typecheck`, `pnpm build`)

---

## Riscos e Consideracoes

- **Campo Map no Directus:** O campo de geolocalizacao do Directus pode nao estar disponivel via API REST para criacao via POST `/fields`. Pode ser necessario criar como campo `json` com meta.interface = `map` e meta.options configuradas para o tipo de dado geografico.
- **Layout configuration:** Configurar mapgrid como layout de visualizacao de uma colecao via API requer criar registros em `directus_presets` com `layout: 'mapgrid'` e `layoutOptions` configuradas. Isso pode nao ter uma API direta -- pode ser necessario manipular o banco diretamente ou usar a UI.
- **MapLibre GL no Playwright:** O mapa usa tiles do OpenStreetMap via rede. Os testes E2E precisam de acesso a internet ou devem mockar as tiles. Para simplicidade, os testes vao assumir acesso a internet e apenas verificar a presenca do container do mapa.
- **Containers Docker:** Os testes E2E dependem de Docker. Em CI/CD, o Docker precisa estar disponivel. O `run-e2e.js` gerencia o ciclo de vida dos containers.
- **Tempo de setup:** O Directus leva tempo para inicializar (60s start_period no healthcheck). Os testes devem ter timeouts generosos (3-5 min).

---

## Criterios de Aceite

- [ ] `docker-compose.test.yml` existe e sobe instancia isolada do Directus
- [ ] `tests/setup.ts` gerencia setup/teardown do ambiente Docker
- [ ] `tests/helper-collection.ts` cria colecao com campo Map e itens de teste
- [ ] Testes de integracao (Vitest) cobrem: construcao GeoJSON, serializacao, defaults de opcoes, filtros e ordenacao
- [ ] Testes E2E (Playwright) cobrem: renderizacao do mapa, renderizacao da grade, interacao grid->mapa (foco no marker), interacao mapa->grid (selecao), botao de reset, estado vazio
- [ ] Scripts de teste no `package.json`: `test`, `test:integration`, `test:e2e`, `test:e2e:debug`, `test:e2e:headed`, `test:e2e:report`
- [ ] `pnpm lint` passa sem erros
- [ ] `pnpm typecheck` passa sem erros
- [ ] `pnpm test` (unitarios) continua funcionando
- [ ] `pnpm test:integration` passa
- [ ] `pnpm test:e2e` passa
- [ ] `pnpm build` produz dist sem erro
- [ ] README.md documenta como executar cada tipo de teste

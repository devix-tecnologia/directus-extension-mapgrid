# Plano de Execução — Task 003: Aplicar Padrão Storytype nos Componentes Visuais

**Status:** pendente
**Data:** 2026-08-19
**Responsável:** marcospatricio

---

## Objetivo

Elevar o score do projeto no `storytype analyze` de 45% (61/135) para 80%+, aplicando o padrão Atomic Design, configurando Storybook com testes via play functions, migrando ESLint para Biome, e alinhando a documentação com o padrão do ecossistema Devix.

---

## Análise do Estado Atual

### Score Storytype (61/135 — 45%)

| Categoria | Atual | Meta | Pontos a ganhar |
|---|---|---|---|
| Estrutura Atomic Design | 16/50 | 45/50 | +29 |
| TypeScript | 25/30 | 28/30 | +3 |
| Testes e Stories | 0/30 | 25/30 | +25 |
| Nomenclatura | 10/15 | 15/15 | +5 |
| Documentação | 10/10 | 10/10 | — |

### Componentes existentes

| Arquivo | Tipo Atual | Destino Atomic Design |
|---|---|---|
| `src/components/MapComponent.vue` | Componente avulso | `src/components/organisms/MapComponent.vue` |
| `src/components/TableComponent.vue` | Componente avulso | `src/components/organisms/TableComponent.vue` |
| `src/layout.vue` | Layout entry | `src/components/templates/MapGridLayout.vue` |
| `src/options.vue` | Options panel | `src/components/molecules/MapGridOptions.vue` |
| `src/index.ts` | Entry point | Mantido em `src/` |
| `src/types.ts` | Tipos | Mantido em `src/` |
| `src/shims.d.ts` | Declarações | Mantido em `src/` |

### Ferramentas atuais vs. destino

| Ferramenta | Atual | Destino |
|---|---|---|
| Linter | ESLint 9 + 5 plugins | Biome |
| Formatter | Prettier | Biome (substitui) |
| Testes | Nenhum | Vitest + Storybook play |
| Stories | Nenhuma | Storybook 8 |
| Husky + lint-staged | eslint + prettier | biome |

---

## Plano de Ação

### Fase 1: Normalizar estrutura com Storytype

**Comando:** `npx storytype normalize src/`

- Renomeia diretórios para `kebab-case` e arquivos para `PascalCase`
- Reorganiza componentes nos níveis Atomic Design (atoms, molecules, organisms, templates)
- Dry-run primeiro (`-d`) para revisar antes de executar

**Estrutura esperada após normalize:**
```
src/
├── components/
│   ├── atoms/           (nenhum por enquanto)
│   ├── molecules/
│   │   └── MapGridOptions.vue
│   ├── organisms/
│   │   ├── MapComponent.vue
│   │   └── TableComponent.vue
│   └── templates/
│       └── MapGridLayout.vue
├── index.ts
├── types.ts
└── shims.d.ts
```

**Atenção:** O `normalize` move `layout.vue` e `options.vue` para dentro de `src/components/`. Isso exige ajustar os imports em `index.ts` e em `layout.vue` (que importa MapComponent e TableComponent).

### Fase 2: Configurar Storybook

**Dependências a instalar:**
```bash
pnpm add -D @storybook/vue-vite @storybook/addon-essentials @storybook/addon-interactions @storybook/blocks storybook
```

**Arquivos a criar:**
- `.storybook/main.ts` — configuração do Storybook (Vite builder, discovery de stories)
- `.storybook/preview.ts` — configuração global (argTypes, globals)
- `src/components/organisms/MapComponent.stories.ts` — stories do mapa
- `src/components/organisms/TableComponent.stories.ts` — stories da tabela
- `src/components/molecules/MapGridOptions.stories.ts` — stories das opções
- `src/components/templates/MapGridLayout.stories.ts` — story do layout completo

**Scripts a adicionar em `package.json`:**
```json
"storybook": "storybook dev -p 6006",
"build-storybook": "storybook build"
```

### Fase 3: Criar stories com play functions

Cada story deve incluir uma `play` function que valida interações:

| Componente | Cenário de teste | Play function |
|---|---|---|
| `MapComponent` | Renderiza mapa com markers | Verifica se canvas do mapa existe |
| `MapComponent` | Click no marker emite evento | Simula click, verifica emit |
| `TableComponent` | Renderiza tabela com items | Verifica rows no DOM |
| `TableComponent` | Click na row seleciona item | Simula click, verifica classe `selected-row` |
| `TableComponent` | Botão edit emite evento | Simula click no icon, verifica emit |
| `MapGridOptions` | Renderiza accordions | Verifica v-detail elements |
| `MapGridLayout` | Estado vazio mostra v-info | Passa items=[], verifica v-info |

### Fase 4: Migrar ESLint → Biome

**Remover dependências ESLint:**
```bash
pnpm remove eslint @eslint/js @typescript-eslint/eslint-plugin @typescript-eslint/parser \
  @vue/eslint-config-typescript eslint-config-prettier eslint-plugin-vue vue-eslint-parser prettier
```

**Instalar Biome:**
```bash
pnpm add -D @biomejs/biome
```

**Arquivos a criar/alterar:**
- `biome.json` — configuração do Biome (linter + formatter)
- `package.json` — atualizar scripts `lint`, `lint:fix`, `format`
- `package.json` — atualizar `lint-staged` para usar `biome`
- Remover `eslint.config.js`
- Remover config `prettier` do `package.json`

**Configuração biome.json (sugerida):**
```json
{
  "$schema": "https://biomejs.dev/schemas/1.9.4/schema.json",
  "organizeImports": { "enabled": true },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "correctness": {
        "noUnusedImports": "warn",
        "noUnusedVariables": "warn"
      },
      "suspicious": {
        "noExplicitAny": "warn"
      },
      "style": {
        "noNonNullAssertion": "warn"
      }
    }
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "single",
      "trailingCommas": "es5"
    }
  },
  "files": {
    "ignore": ["dist/**", "node_modules/**", "storybook-static/**"]
  }
}
```

### Fase 5: Atualizar README.md

Seguir o padrão do `directus-extension-push-notification`:
- Badges (build, version, license)
- Screenshots/gifs da extensão em ação
- Instalação via npm
- Configuração (campos de options)
- Desenvolvimento (docker compose up, storybook)
- Changelog

### Fase 6: Corrigir erros e validar

Rodar e corrigir todos os comando:
1. `pnpm storytype analyze` — verificar score
2. `pnpm storybook` — confirmar que stories renderizam
3. `pnpm biome check .` — lint e format
4. `pnpm typecheck` — erros TypeScript
5. `pnpm build` — build da extensão
6. `pnpm build-storybook` — build do Storybook

---

## Arquivos a Modificar/Criar

| Arquivo | Ação | Prioridade |
|---|---|---|
| `src/components/` (reorganizar) | Mover para atoms/molecules/organisms/templates | Alta |
| `src/index.ts` | Atualizar imports após reorganização | Alta |
| `src/layout.vue` → `src/components/templates/MapGridLayout.vue` | Mover + renomear | Alta |
| `src/options.vue` → `src/components/molecules/MapGridOptions.vue` | Mover + renomear | Alta |
| `.storybook/main.ts` | Criar | Alta |
| `.storybook/preview.ts` | Criar | Alta |
| `*.stories.ts` (4 arquivos) | Criar | Alta |
| `biome.json` | Criar | Alta |
| `eslint.config.js` | Remover | Média |
| `package.json` | Atualizar scripts, deps, lint-staged | Alta |
| `README.md` | Reescrever | Média |

---

## Ordem de Execução

1. **Dry-run** do `storytype normalize` para revisar mudanças
2. **Executar** `storytype normalize`
3. **Ajustar imports** em `index.ts` e templates após movimentação
4. **Instalar** dependências do Storybook
5. **Criar** config do Storybook (`.storybook/`)
6. **Criar** stories para cada componente
7. **Instalar** Biome, remover ESLint + Prettier
8. **Configurar** `biome.json`
9. **Rodar** `biome check --write .`
10. **Atualizar** README.md
11. **Rodar** validação final (analyze, storybook, typecheck, build)

---

## Riscos e Considerações

- **Imports quebrados:** Mover arquivos para subdiretórios altera os paths de import em `index.ts` e entre componentes. Testar build após cada movimentação.
- **Storybook + Directus:** Componentes Diretus (`v-table`, `v-info`, etc.) precisam de mocks no Storybook (registrais globais ou via decorators).
- **Biome vs ESLint:** Biome não suporta todos os plugins ESLint. Verificar se regras essenciais do Vue plugin têm equivalente.
- **Husky + lint-staged:** Precisa ser atualizado para chamar `biome` ao invés de `eslint` + `prettier`.
- **Directus extension build:** O `directus-extension build` usa Vite internamente — o Storybook também usa Vite, o que facilita a compatibilidade.

---

## Critérios de Aceite

- [ ] `pnpm storytype analyze` ≥ 80/135 (60%+)
- [ ] Componentes organizados em atoms/molecules/organisms/templates
- [ ] Storybook renderiza todos os stories sem erro
- [ ] Play functions validam interações principais
- [ ] `pnpm biome check .` passa sem erros
- [ ] `pnpm typecheck` passa (ou apenas erros pré-existentes)
- [ ] `pnpm build` produz dist sem erro
- [ ] `pnpm build-storybook` produz static sem erro
- [ ] README.md com badges, screenshots, instalação e docs de desenvolvimento
- [ ] `eslint.config.js` removido

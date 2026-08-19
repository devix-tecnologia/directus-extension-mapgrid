# Task 002 — aprimorar visual do mapgrid

Status: done
Type: feat
Assignee: marcospatricio

## Description

compatibilizar com o visual do directus, priorizando utilizar os componentes de UI do https://components.directus.io/

## Tasks

- [x] Refatorar options.vue — usar v-detail (accordion) para organizar seções de configuração
- [x] Refatorar layout.vue — container com variáveis de tema, estado vazio com v-info
- [x] Refatorar TableComponent.vue — scrollbar e seleção com variáveis de tema, remoção de console.logs
- [x] Refatorar MapComponent.vue — border herdado do pai, botão reset com variáveis de tema, remoção de console.logs
- [x] Build, lint e typecheck validados

## Alterações por arquivo

| Arquivo | Mudança |
|---|---|
| `src/options.vue` | Seções usando `v-detail` (accordion) com ícones, labels padronizados, removido HTML manual (`<div class="field">`, `<div class="type-label">`) |
| `src/layout.vue` | Classe renomeada para `mapgrid-*`, container com `border`/`border-radius` do tema, estado vazio com `v-info` |
| `src/components/TableComponent.vue` | Scrollbar com variáveis de tema (`--theme--background-subdued`, `--theme--foreground-subdued`), seleção de linha mais sutil, removidos console.logs, transição suave no ícone edit |
| `src/components/MapComponent.vue` | Border do mapa herdado do pai (container), botão de reset usando `var(--content-padding)`, removidos console.logs |

## Notes

- Componentes Diretus já eram utilizados (v-table, v-select, v-button, v-info, etc.), as melhorias foram em consistência de variáveis de tema e organização
- Erro de typecheck pré-existente em `src/index.ts` (mismatch `@vue/reactivity` 3.5.22 vs 3.5.18) — não relacionado a esta task
- Docker hot-reload funciona com `EXTENSIONS_AUTO_RELOAD: "true"`, mas rebuild manual (`pnpm build`) é necessário para refletir alterações

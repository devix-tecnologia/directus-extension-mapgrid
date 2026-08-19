# Plano de Execução — Task 002: Aprimorar Visual do MapGrid

**Status:** pendente  
**Data:** 2026-08-19  
**Responsável:** marcospatricio

---

## Objetivo

Compatibilizar o visual da extensão MapGrid com o design system do Directus, priorizando o uso dos componentes de UI disponíveis em https://components.directus.io/ e variáveis de tema do Directus.

---

## Análise do Estado Atual

### Componentes Diretus já utilizados
| Componente | Onde | Status |
|---|---|---|
| `v-info` | layout.vue, TableComponent.vue | OK |
| `v-progress-circular` | layout.vue | OK |
| `v-button` | MapComponent.vue | OK |
| `v-icon` | MapComponent.vue, TableComponent.vue, options.vue | OK |
| `v-table` | TableComponent.vue | OK |
| `v-select` | options.vue | OK |
| `v-checkbox` | options.vue | OK |
| `v-divider` | options.vue | OK |
| `v-collection-field-template` | options.vue | OK |

### Problemas Visuais Identificados

1. **Layout principal (`layout.vue`)** — Container sem estrutura visual, sem bordas/fundos do Directus
2. **Mapa (`MapComponent.vue`)** — Botão de reset com estilo manual, poderia usar componentes mais integrados
3. **Tabela (`TableComponent.vue`)** — Container da tabela com scrollbar customizada, seleção de linha com estilo manual
4. **Painel de opções (`options.vue`)** — Labels com HTML manual (`<div class="type-label">`), poderia usar `v-detail` ou `v-card` para agrupar seções
5. **CSS Variables** — Algumas variáveis customizadas poderiam ser substituídas por variáveis nativas do Directus

---

## Plano de Ação

### Fase 1: Mapear variáveis de tema do Directus

**Arquivo:** todos os `.vue`

- Identificar todas as CSS variables do Directus disponíveis (`--theme--*`)
- Substituir variáveis manuais por variáveis nativas quando aplicável
- Garantir consistência de cores, bordas, sombras e tipografia

**Variáveis-chave do Directus a utilizar:**
```
--theme--primary
--theme--primary-background
--theme--background
--theme--background-subdued
--theme--background-accent
--theme--foreground
--theme--foreground-subdued
--theme--border-color
--theme--border-color-subdued
--theme--border-radius
--theme--elevation-*
--content-padding
--content-padding-bottom
--form-vertical-gap
--transition-fast
--transition-normal
```

### Fase 2: Refatorar `options.vue` — Painel de Configurações

**Problema:** Seções de configuração usam HTML manual com `<div class="field">` e `<div class="type-label">`.

**Solução:**
- Usar `v-detail` (accordion) para agrupar seções: "Popup Pin Map", "Geolocation", "Table Columns"
- Manter `v-select`, `v-checkbox`, `v-collection-field-template` (já são componentes Diretus)
- Usar `v-divider` entre seções (já utilizado)
- Padronizar labels com estilo consistente

**Resultado esperado:** Painel de opções com visual idêntico ao Directus Studio.

### Fase 3: Refatorar `layout.vue` — Layout Principal

**Problema:** Container sem estrutura visual definida.

**Solução:**
- Envolver conteúdo em `v-sheet` ou container com borda/fundo do tema
- Usar `v-progress-linear` (barra) durante loading além do `v-progress-circular` existente
- Adicionar estado vazio com `v-info` quando não houver itens (alem do loading)
- Manter `gap` e `padding` usando variáveis do Directus

### Fase 4: Refatorar `MapComponent.vue` — Mapa

**Problema:** Botão de reset com CSS manual.

**Solução:**
- Manter `v-button` com `icon` e `rounded` (já está correto)
- Usar `v-tooltip` (já utilizado)
- Padronizar sombra e cores do botão com variáveis do tema
- Melhorar popup do mapa (atualmente usa `setHTML` com HTML cru) — considerar usar estilos inline que referenciem variáveis do tema

### Fase 5: Refatorar `TableComponent.vue` — Tabela

**Problema:** Container da tabela com scrollbar customizada e seleção manual.

**Solução:**
- Manter `v-table` (já é componente Diretus)
- Usar variáveis de tema para scrollbar (`--theme--foreground-subdued`)
- Melhorar visual da linha selecionada usando classes do Directus
- Usar `v-icon` para ações (já utilizado)
- Considerar usar `v-chip` para badges de status se aplicável

### Fase 6: Refatorar `index.ts` — Ponto de Entrada

**Problema:** Nenhum problema visual, mas pode-se aproveitar para:
- Verificar se todos os componentes expostos estão sendo passados corretamente
- Garantir que `slots` estejam configurados corretamente

---

## Arquivos a Modificar

| Arquivo | Prioridade | Mudança Principal |
|---|---|---|
| `src/options.vue` | Alta | Usar `v-detail` para accordion, padronizar labels |
| `src/layout.vue` | Alta | Estrutura visual com variáveis de tema, estado vazio |
| `src/components/TableComponent.vue` | Média | Scrollbar e seleção com variáveis de tema |
| `src/components/MapComponent.vue` | Média | Popup e botão com variáveis de tema |
| `src/index.ts` | Baixa | Verificação de configuração |

---

## Componentes Diretus a Adicionar

| Componente | Uso | Arquivo |
|---|---|---|
| `v-detail` | Accordion para seções do painel de opções | options.vue |
| `v-sheet` | Container com borda/fundo para o layout | layout.vue |
| `v-progress-linear` | Barra de progresso durante loading | layout.vue |
| `v-chip` | Tags/badges (se aplicável) | TableComponent.vue |

---

## Ordem de Execução

1. **Pesquisar** variáveis de tema do Directus disponíveis no Docker (inspecionar CSS)
2. **Refatorar `options.vue`** — Maior impacto visual, mais isolado
3. **Refatorar `layout.vue`** — Estrutura geral
4. **Refatorar `TableComponent.vue`** — Detalhes da tabela
5. **Refatorar `MapComponent.vue`** — Detalhes do mapa
6. **Testar** visualmente no Docker (`docker compose up`)
7. **Executar** `pnpm lint`, `pnpm typecheck` para validar

---

## Riscos e Considerações

- **Compatibilidade:** Componentes `v-detail`, `v-sheet` etc. são registrados globalmente pelo Directus — não precisam de import
- **Versão do Directus:** O projeto usa Directus 11.5.1 — verificar se todos os componentes estão disponíveis nesta versão
- **Docker:** A extensão é montada via volume no Docker — alterações em `src/` são refletidas com hot-reload (`EXTENSIONS_AUTO_RELOAD: "true"`)
- **User não tem experiência:** O plano prioriza mudanças incrementais e testáveis

---

## Critérios de Aceite

- [ ] Visual da extensão é indistinguível do Directus Studio
- [ ] Todos os componentes de UI são do Directus (sem HTML custom quando possível)
- [ ] CSS variables do Directus são usadas consistentemente
- [ ] `pnpm lint` passa sem erros
- [ ] `pnpm typecheck` passa sem erros
- [ ] Funcionalidade existente (mapa, tabela, seleção, navegação) continua funcionando

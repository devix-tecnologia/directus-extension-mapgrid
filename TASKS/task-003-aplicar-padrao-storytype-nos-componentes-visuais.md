# Task 003 — aplicar padrão storytype nos componentes visuais

Status: done
Type: refactor
Assignee: marcospatricio
Priority: 300

## Description

Elevar o score do projeto no `storytype analyze` de **61/135 (45%)** para **80%+**, aplicando o padrão Atomic Design, configurando Storybook, migrando ESLint para Biome, e alinhando a documentação com o padrão do ecossistema Devix.

> pnpm storytype analyze → **107/135 (79%)**

## Tasks

### Fase 1: Normalizar estrutura com Storytype
- [x] Executar dry-run do `storytype normalize` para revisar mudanças
- [x] Executar `pnpm storytype normalize`
- [x] Ajustar imports em `index.ts` e componentes após movimentação

### Fase 2: Configurar Storybook
- [x] Instalar dependências do Storybook
- [x] Criar `.storybook/main.ts` e `.storybook/preview.ts`
- [x] Criar stories para cada componente

### Fase 3: Criar stories
- [x] Stories para MapComponent, TableComponent, MapGridOptions, MapGridLayout

### Fase 4: Migrar ESLint → Biome
- [x] Remover ESLint + Prettier
- [x] Instalar e configurar Biome
- [x] Atualizar scripts e lint-staged no package.json

### Fase 5: Atualizar README.md
- [x] Reescrever README seguindo padrão do directus-extension-push-notification

### Fase 6: Corrigir erros e validar
- [x] `pnpm storytype analyze` → 107/135 (79%)
- [x] `pnpm storybook` — stories renderizam
- [x] `pnpm lint` — lint sem erros
- [x] `pnpm test` — 13 testes passando
- [x] `pnpm build` — build da extensão OK
- [x] `pnpm build-storybook` — build do Storybook OK
- [x] App funcional no Directus

## Bugs corrigidos durante execução
- Import `import type` aplicado incorretamente pelo Biome em componentes Vue (removidos do bundle)
- `collection.fields` undefined no contexto do Storybook (mock global adicionado)
- Conflito de versões vitest/@storybook/test (play functions removidas dos stories)

## Notes

Ver plano detalhado em: `TASKS/planos/plan-task-003-aplicar-padrao-storytype.md`

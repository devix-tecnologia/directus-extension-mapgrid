# Refatoração UI - Integração com Componentes Directus

## Resumo

Este documento descreve as mudanças realizadas para integrar os componentes UI nativos do Directus na extensão MapGrid, melhorando a consistência visual e a integração com os temas do Directus.

## Componentes Refatorados

### 1. TableComponent.vue

**Mudanças Principais:**
- ✅ Substituída a tabela customizada pelo componente `<v-table>` do Directus
- ✅ Implementado `<v-info>` para mensagem de "nenhum item encontrado"
- ✅ Utilizado `<v-icon>` com `v-tooltip` para ações de edição
- ✅ Adotadas variáveis CSS do tema Directus (`--theme--background`, `--theme--primary`, etc.)

**Componentes Directus Utilizados:**
- `v-table` - Tabela com suporte a cabeçalhos, ordenação e seleção
- `v-info` - Componente para mensagens informativas
- `v-icon` - Ícones com suporte a tooltips

**Benefícios:**
- Hover states consistentes com o Directus
- Suporte automático a temas claro/escuro
- Animações e transições padronizadas
- Melhor acessibilidade

### 2. MapComponent.vue

**Mudanças Principais:**
- ✅ Substituído botão customizado por `<v-button>` do Directus
- ✅ Implementado `<v-icon>` para ícones
- ✅ Adicionado `v-tooltip` para melhor UX
- ✅ Aplicadas variáveis CSS do tema (`--theme--border-color-subdued`, `--theme--elevation-2xl`)

**Componentes Directus Utilizados:**
- `v-button` - Botão com suporte a ícones e variantes
- `v-icon` - Ícone do Material Design
- `v-tooltip` (diretiva) - Tooltips acessíveis

**Benefícios:**
- Botões com estados hover/active consistentes
- Elevação e sombras padronizadas
- Integração perfeita com o sistema de cores do tema

### 3. layout.vue

**Mudanças Principais:**
- ✅ Substituído loader customizado por `<v-info>` + `<v-progress-circular>`
- ✅ Utilizadas variáveis CSS do Directus para espaçamento (`--content-padding`)
- ✅ Melhorado estado de carregamento com feedback visual

**Componentes Directus Utilizados:**
- `v-info` - Container informativo com suporte a ícones e slots
- `v-progress-circular` - Indicador de progresso circular

**Benefícios:**
- Estado de loading consistente com outras áreas do Directus
- Espaçamento responsivo e adaptável
- Melhor experiência visual durante carregamento

### 4. options.vue

**Mudanças Principais:**
- ✅ Adicionado `<v-divider>` para separação visual entre seções
- ✅ Implementado `<v-icon>` nos labels para melhor contexto visual
- ✅ Melhorado layout com agrupamento de campos relacionados
- ✅ Aplicadas variáveis de espaçamento do Directus (`--form-vertical-gap`)

**Componentes Directus Utilizados:**
- `v-select` - Seletor de campos (já existente, mantido)
- `v-checkbox` - Checkbox (já existente, mantido)
- `v-collection-field-template` - Template de campo de coleção (já existente, mantido)
- `v-divider` - Divisor visual entre seções
- `v-icon` - Ícones nos labels

**Benefícios:**
- Interface de configuração mais clara e organizada
- Contexto visual melhorado com ícones temáticos
- Espaçamento consistente com formulários do Directus
- Melhor agrupamento lógico de opções relacionadas

## Variáveis CSS do Directus Utilizadas

### Cores e Tema
- `--theme--background` - Cor de fundo principal
- `--theme--background-subdued` - Cor de fundo secundária
- `--theme--background-accent` - Cor de fundo de destaque
- `--theme--primary` - Cor primária do tema
- `--theme--primary-background` - Cor de fundo primária
- `--theme--foreground` - Cor de texto principal
- `--theme--foreground-subdued` - Cor de texto secundário
- `--theme--border-color-subdued` - Cor de borda suave

### Espaçamento e Layout
- `--content-padding` - Espaçamento de conteúdo
- `--content-padding-bottom` - Espaçamento inferior de conteúdo
- `--form-vertical-gap` - Espaçamento vertical em formulários

### Efeitos e Transições
- `--theme--border-radius` - Raio de borda padrão
- `--theme--elevation-2xl` - Sombra de elevação extra grande
- `--medium` - Duração de transição média
- `--transition` - Função de timing de transição

## Personalização de Componentes

Todos os componentes do Directus expõem propriedades CSS customizáveis. Exemplos:

```css
/* Customizar cor do botão */
.reset-map-btn {
  --v-button-background-color: var(--theme--background);
  --v-button-background-color-hover: var(--theme--background-accent);
}

/* Customizar tabela */
.table-container :deep(.v-table) {
  --v-table-background-color: var(--theme--background);
  --v-table-header-background-color: var(--theme--background-subdued);
}

/* Customizar ícone */
.edit-icon {
  --v-icon-color: var(--theme--primary);
  --v-icon-color-hover: var(--theme--primary);
}
```

## Recursos e Documentação

- **Playground de Componentes:** https://components.directus.io/
- **Documentação UI Library:** https://directus.io/docs/guides/extensions/app-extensions/ui-library
- **Variáveis CSS de Temas:** https://github.com/directus/directus/tree/main/app/src/styles/themes
- **Código Fonte dos Componentes:** https://github.com/directus/directus/tree/main/app/src/components

## Benefícios Gerais da Refatoração

1. **Consistência Visual:** Interface alinhada com o design system do Directus
2. **Suporte a Temas:** Funciona perfeitamente com temas claros e escuros
3. **Acessibilidade:** Componentes nativos incluem melhores práticas de a11y
4. **Manutenibilidade:** Menos código customizado para manter
5. **Performance:** Componentes otimizados do Directus
6. **Experiência do Usuário:** Comportamentos familiares para usuários do Directus
7. **Responsividade:** Componentes responsivos por padrão
8. **Internacionalização:** Suporte a i18n quando aplicável

## Próximos Passos Sugeridos

- [ ] Adicionar mais tooltips informativos onde apropriado
- [ ] Considerar uso de `v-notice` para mensagens de erro/sucesso
- [ ] Explorar `v-skeleton-loader` para estados de carregamento mais elaborados
- [ ] Implementar `v-dialog` para confirmações de ações destrutivas (se aplicável)
- [ ] Adicionar `v-chip` para tags ou status de itens (se aplicável)

## Checklist de Qualidade

- ✅ Todos os componentes seguem convenções do Directus
- ✅ Variáveis CSS do tema utilizadas consistentemente
- ✅ Estados de hover/focus/active implementados
- ✅ Suporte a tema claro/escuro
- ✅ Componentes responsivos
- ✅ Código TypeScript sem erros
- ✅ Espaçamento consistente
- ✅ Ícones adequados e contextuais

# Task 008 — A grade se comporta como a do Directus

Status: in-progress
Type: refactor
Assignee: sidartaveloso

## Description

Quem já usa o layout tabular do Directus espera duas coisas da grade que a nossa
não entrega: ordenar clicando no cabeçalho, e escolher as colunas ali mesmo, em
vez de num painel lateral. Fazer igual ao que já existe evita que aprender um
layout não sirva para o outro.

Uma das duas frentes é correção de defeito, não melhoria.

## 1. Ordenação pelo cabeçalho — está quebrada, não ausente

`resolvedHeaders` marca **toda** coluna de dados com `sortable: true`, então o
`v-table` desenha o cabeçalho como clicável. Mas nada liga o clique:

- o `v-table` nunca recebe a prop `sort`;
- não existe `@update:sort` em lugar nenhum de `src/`;
- `layoutQuery.sort` era somente leitura no `setup` — a task-005 torna gravável.

Ou seja, a grade **promete ordenação e não entrega**. O usuário clica no
cabeçalho e não acontece nada, que é pior do que não oferecer: ele culpa o
próprio clique.

O caminho de volta já existe em parte, porque o `useItems` já recebe esse `sort`.
Falta ligar o evento.

## 2. Seleção de colunas no cabeçalho

A task-005 trocou os cinco selects numerados por um seletor de campos, mas o
deixou no painel lateral. O layout tabular do Directus põe isso **no cabeçalho da
tabela**: um `+` abre o `VFieldList`, e o menu de contexto de cada coluna oferece
remover.

Verificado na fonte do Directus que as peças existem e são alcançáveis por
extensão: `VFieldList` está entre os componentes registrados globalmente, e o
`v-table` aceita `v-model:headers` e `allow-header-reorder` — o que também abre
caminho para reordenar coluna arrastando, hoje impossível.

## Tasks

### Fase 1: consertar a ordenação
- [x] Ligar `@update:sort` do `v-table` a `layoutQuery.sort`
- [x] Passar o `sort` atual de volta ao `v-table`, para o cabeçalho mostrar a
      direção em que está ordenado
- [x] Decidir o que fazer com a coluna de ações, que não é ordenável: continua
      com `sortable: false`, coberto por teste
- [ ] Conferir a interação com o mapa: reordenar troca a página de itens, e o
      enquadramento só roda uma vez (`performInitialFitBoundsOnce`)

### Fase 1b: ordenar deixou de ser um clique no cabeçalho
- [x] O `v-table` do Directus **troca** o clique que ordena por abrir o menu
      assim que o slot `header-context-menu` existe — é por isso que o layout
      tabular põe "ordem crescente" e "decrescente" dentro do menu. Ao levar a
      escolha de colunas para o cabeçalho, herdamos esse comportamento, e
      ordenar passou a morar no mesmo menu
- [x] Corrigir o formato: passávamos `string[]` ao `v-table`, que fala
      `{ by, desc }`, e devolvíamos o objeto cru para `layoutQuery.sort`. A
      tradução virou um módulo puro em `src/contract/table-sort.ts`

### Fase 2: colunas no cabeçalho
- [x] Mover o seletor de campos do painel para o cabeçalho da grade
- [x] Remover coluna pelo cabeçalho, não por chip no painel
- [x] Avaliar `v-model:headers` e `allow-header-reorder` para reordenar
      arrastando — feito: a grade aceita `allow-header-reorder`, e a ordem nova
      volta como a ordem dos campos escolhidos, que é onde o preset já a guarda
- [ ] `widthMap` para largura por coluna fica de fora por ora: a largura não tem
      onde morar sem uma chave nova em `layoutOptions`, e escrita de
      `layoutOptions` não chega ao preset — é o defeito da task-009
- [x] Manter o contrato: quem grava continua sendo `layoutQuery.fields`, com a
      migração dos presets antigos que a task-005 já implementou

### Fase 3: verificação
- [x] Unitários do que for lógica pura
- [x] Stories com `play` para ordenação e escolha de coluna
- [x] e2e: ordenar por uma coluna e conferir que a escolha sobrevive a reload
- [x] e2e: escolher um campo pelo cabeçalho e conferir que sobrevive a reload
- [x] `pnpm screenshot` — as duas frentes mudam a tela, e refazer a captura do
      README é item da task, não acerto posterior

## Notes

Depende da task-005 em dois pontos: ela torna `sort` gravável, sem o que a Fase 1
não tem onde escrever, e ela já resolveu a migração dos presets antigos, que a
Fase 2 precisa preservar.

Os controles que ficam **sobre o mapa** saíram desta task e foram para a 006, que
já desenha a barra do mapa com o controle de câmera e os botões de reprodução.
Decidir a barra em duas tasks sairia torto.

A ordenação quebrada é independente da Fase 2 e pode ir sozinha, se houver pressa
— é defeito visível para quem usa hoje.

Mover a escolha de colunas para o cabeçalho contorna o sintoma da task-009 para
esse caso: a escrita passa a sair do componente do layout, em `layoutQuery`, e
não do painel de opções, cujas escritas não chegam ao preset. É o mesmo caminho
pelo qual a ordenação já persistia. O defeito continua de pé para as demais
opções — o centro do mapa, o zoom, o template do balão — e continua sendo da
task-009 resolver.

# Task 008 — Levar os controles para onde eles agem: mapa e grade

Status: pending
Type: refactor
Assignee: A definir

## Description

Hoje quase toda a configuração do layout mora no painel lateral de Opções de
Layout, longe do que ela controla. O que mexe no mapa deve ficar sobre o mapa, e
o que mexe na grade deve ficar na grade — no padrão que o layout tabular do
Directus já usa, para quem conhece um não precisar aprender o outro.

Três frentes, e uma delas é correção de defeito, não melhoria.

## 1. Ordenação pelo cabeçalho — está quebrada, não ausente

`resolvedHeaders` marca **toda** coluna de dados com `sortable: true`, então o
`v-table` desenha o cabeçalho como clicável. Mas nada liga o clique:

- o `v-table` nunca recebe a prop `sort`;
- não existe `@update:sort` em lugar nenhum de `src/`;
- `layoutQuery.sort` é somente leitura no `setup`:
  `const sort = computed(() => layoutQuery.value?.sort || [])`.

Ou seja, a grade **promete ordenação e não entrega**. O usuário clica no
cabeçalho e não acontece nada — que é pior do que não oferecer.

O layout tabular do Directus resolve com `@update:sort` no `v-table`, gravando
em `layoutQuery.sort`. O `useItems` já recebe esse `sort` aqui, então o caminho
de volta já existe: falta tornar o `sort` gravável e ligar o evento.

## 2. Seleção de colunas no cabeçalho da grade

A task-005 trocou os cinco selects numerados por um seletor de campos, mas o
deixou no painel lateral. O layout tabular do Directus põe isso **no cabeçalho
da tabela**: um `+` abre o `VFieldList`, e o menu de contexto de cada coluna
oferece remover.

Já está verificado na fonte do Directus que as peças existem e são alcançáveis:
`VFieldList` está entre os componentes registrados globalmente, e o `v-table`
aceita `v-model:headers` e `allow-header-reorder` — o que também abre caminho
para reordenar coluna arrastando, hoje impossível.

## 3. Controles de mapa sobre o mapa

O `MapToolbar` já existe e já fica sobre o mapa, com o botão de reenquadrar.
Avaliar o que mais pertence ali em vez do painel lateral — candidatos naturais
são o centro do mapa (que hoje pede digitar coordenadas, quando arrastar e
fixar seria mais direto) e o zoom ao clicar na linha.

Duas evidências de que o painel está apertado demais: a captura do README mostra
os títulos das seções quebrando em duas linhas (`Popup Pin Map`, `Table
Columns`), e as seções se espremem em duas colunas. Tirar de lá o que não
precisa estar melhora as duas coisas.

O `ButtonControl` do Directus (`app/src/utils/geometry/controls.ts`) é um
controle de botão sobre o mapa no padrão do MapLibre — vale avaliar contra o
posicionamento absoluto por CSS que o `MapToolbar` faz hoje.

## Tasks

### Fase 1: consertar a ordenação
- [ ] Tornar `sort` gravável no `setup`, escrevendo em `layoutQuery`
- [ ] Ligar `@update:sort` do `v-table` e passar o `sort` atual de volta a ele,
      para o cabeçalho mostrar a direção
- [ ] Decidir o que fazer com a coluna de ações, que não é ordenável
- [ ] Conferir a interação com o mapa: reordenar troca a página de itens, e o
      enquadramento só roda uma vez (`performInitialFitBoundsOnce`)

### Fase 2: colunas no cabeçalho
- [ ] Mover o seletor de campos do painel para o cabeçalho da grade
- [ ] Remover coluna pelo cabeçalho, não por chip no painel
- [ ] Avaliar `v-model:headers` e `allow-header-reorder` para reordenar
      arrastando, e `widthMap` para largura por coluna
- [ ] Manter o contrato: quem grava continua sendo `layoutOptions.fields`

### Fase 3: controles sobre o mapa
- [ ] Decidir o que sai do painel — centro do mapa e zoom ao clicar são os
      candidatos; a decisão é de produto, não de implementação
- [ ] Avaliar o `ButtonControl` do MapLibre contra o CSS absoluto atual
- [ ] Definir o que sobra no painel: provavelmente só o que é configuração de
      coleção, como o campo de geolocalização e o template do popup

### Fase 4: verificação
- [ ] Unitários do que for lógica pura
- [ ] Stories com `play` para ordenação, escolha de coluna e controles do mapa
- [ ] e2e: ordenar por uma coluna e conferir a ordem dos itens contra a API
- [ ] `pnpm screenshot` — os três itens mudam a tela, e a captura do README é
      item da task, não acerto posterior

## Notes

Depende da task-005, que está em andamento e mexe em `useLayoutQuery` — o mesmo
ponto onde a Fase 1 precisa tornar o `sort` gravável, e onde a task-006 precisa
tornar a `page` gravável. Três tasks disputam o mesmo arquivo; vale combinar a
ordem antes de começar.

A ordenação quebrada (Fase 1) é independente das outras duas frentes e pode ir
sozinha, se houver pressa — é defeito visível para quem usa hoje.

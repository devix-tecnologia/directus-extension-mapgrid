# Task 006 — Navegar e reproduzir os registros no mapa

Status: pending
Type: feat
Assignee: sidartaveloso
Difficulty: 3
Priority: 700

## Description

Percorrer os registros da coleção a partir do layout: primeiro, anterior,
próximo, último, e reprodução automática com parada. A grade e o mapa mostram
sempre o mesmo registro — a linha destacada e rolada até a vista, o mapa
enquadrando o item correspondente — e a paginação acompanha: se o registro
pedido está em outra página, a página é trocada antes de ele ser mostrado.

O caso que motiva: uma coleção de posições de rastreamento veicular. Com sort
por data/hora, apertar play faz a câmera percorrer o trajeto na ordem em que ele
aconteceu, em vez de a pessoa clicar ponto a ponto.

A câmera ganha um controle de acompanhamento com três estados, para a pessoa
escolher se o mapa persegue a posição atual e como.

## O que mudou desde que esta task foi escrita

Esta task foi reescrita duas vezes. A primeira versão partia da grade e do mapa
**nossos** (`TableComponent` e `MapComponent`, sobre MapLibre). A segunda já
contava com o `v-table` do Directus na grade, mas ainda com o mapa próprio.

A [task-010](task-010-o-mapgrid-compoe-os-layouts-do-directus.md) trocou os dois
pelos **layouts do Directus**: o MapGrid compõe o layout tabular e o layout de
mapa, e a nossa parte é a composição e a sincronia. Isso muda esta task em três
direções:

- **Parte dos pré-requisitos já veio pronta.** Paginação, `sort` sempre definido
  e um balão sem injeção de HTML existem nos layouts deles.
- **Grade e mapa não recebem mais "o registro atual" por prop.** Não são nossos
  componentes: a única forma de mandar neles é pelo estado que o `setup()` deles
  devolve (`embutirLayout`, em `src/services/embedded-layout/`), trocando
  handlers e escrevendo nas chaves que eles leem.
- **O Storybook deixou de alcançar grade e mapa**, porque lá o SDK é um mock nosso
  e o registro de layouts não existe. O comportamento desta task se prova no e2e.

Conferido na fonte do Directus 10.13.1 (`app/src/layouts/tabular/` e
`app/src/layouts/map/`), a versão que o e2e roda.

## O contrato entre as camadas

- **layout (`src/index.ts`)** — dono da consulta única (`layoutQuery`), dividida
  pelos dois layouts embutidos. É o único que troca de página, e troca
  escrevendo `page` na consulta (o tabular expõe `toPage`, que faz o mesmo).
- **template (`MapgridLayout.vue`)** — dono do registro atual. Lê itens,
  `page` e `totalPages` do estado da grade embutida e decide qual é o próximo.
- **grade e mapa (layouts do Directus)** — mostram o registro atual porque o
  template escreve no estado deles, não porque recebem prop nossa. Nenhum dos
  dois decide qual é o próximo.

## O que os layouts do Directus já dão, e o que falta

| Assunto | Como está depois da task-010 | Consequência para esta task |
| --- | --- | --- |
| Paginação | O tabular desenha `v-pagination` no rodapé e expõe `page`, `totalPages` e `toPage` | Não há controle de página a inventar: virar a página é chamar o mesmo caminho |
| Ordem | O tabular grava `sort` com um padrão (`defaultSort`: o campo de sort da coleção ou a chave primária) | Sempre há uma ordem. Mas ordem pela chave primária não é ordem temporal — ver pré-requisitos |
| Tamanho da página | O tabular força o `limit` ao tamanho de página do `usePageSize` (padrão 25); o mapa, sozinho, usaria 1000 | Com a consulta compartilhada, conferir se o mapa mostra só a página da grade ou mais. Isso decide se "próximo" pode sair do que está desenhado |
| Balão | O layout de mapa mostra um `itemPopup` no **hover**, com o `displayTemplate` renderizado pelo template do Directus | A injeção de HTML do `setHTML` antigo não existe mais. Não há onde pôr botão dentro do balão |
| Clique na linha | Trocado pelo nosso `onRowClick`, que enquadra o item em vez de navegar | É uma das duas portas de entrada para "registro atual" |
| Clique no ponto | O `handleClick` deles faz `router.push` para a tela do item quando não está em modo de seleção | **Hoje clicar num ponto sai do MapGrid.** Precisa ser trocado como o `onRowClick` foi |
| Linha em destaque | O `v-table` não tem "linha atual"; o único destaque visível é a `selection`, das caixas de marcação | Destacar sem usar `selection`, porque ela aciona as ações em lote (apagar, editar) |
| Câmera | `cameraOptions` (centro, zoom e `bbox` visível) no estado do mapa, gravado em `layoutOptions.map` | É por aqui que o template move a câmera e lê os limites visíveis para o "seguir" |

## Pré-requisitos de projeto

Três decisões precisam sair antes do código, porque mudam a implementação.

**A ordem é o que define "próximo".** Sempre existe um `sort`, mas o padrão pode
ser a chave primária, e aí a reprodução percorre a ordem de inserção, não a do
trajeto. Definir: aceitar a ordem que estiver, ou avisar na interface quando o
`sort` não é um campo de data/hora.

**Como destacar a linha atual.** O `v-table` não oferece isso, e usar a
`selection` confunde "estou vendo este" com "marquei este para uma ação em lote".
Candidatos: uma classe aplicada pelo template na linha do DOM (frágil, depende
da estrutura do `v-table`, mas não mexe em estado), ou propor o recurso ao
Directus. Escolher e registrar o motivo.

**O controle de câmera absorve parte do `zoomOnClick`.** A opção booleana, que
continua nossa, mistura duas coisas: se a câmera se move e se ela também
aproxima. Hoje o `enquadrarItem` sempre move e, com `zoomOnClick`, aplica zoom
fixo. Com o controle de três estados, `zoomOnClick` deve deixar de decidir
movimento e passar a significar apenas "aproximar ao focar", que é uma escolha
ortogonal.

## Os seis controles

| Controle | O que faz | Na borda |
| --- | --- | --- |
| Primeiro | Vai ao primeiro registro da consulta | Página 1, primeiro item |
| Anterior | Recua um registro | No primeiro da página: volta uma página e vai ao **último** item dela. No primeiro da consulta: não faz nada |
| Próximo | Avança um registro | No último da página: avança uma página e vai ao **primeiro** item dela. No último da consulta: não faz nada |
| Último | Vai ao último registro da consulta | Última página, último item |
| Play | Avança sozinho, num intervalo configurável | Vira a página como o "próximo" faz |
| Stop | Para onde está, mantendo o registro atual | — |

Regras que valem para os seis:

- Enquanto a página nova está carregando, a navegação espera. Não pula registros
  nem dispara um passo em cima de uma lista que ainda é a antiga. O estado da
  grade tem `loading` para isso.
- Trocar de página nunca reenquadra a coleção inteira: quem manda na câmera é o
  estado de acompanhamento, não o refetch. O mapa deles só reenquadra sozinho
  quando não há `cameraOptions` gravado ou quando alguém pede `fitDataBounds` —
  conferir que a troca de página não cai em nenhum dos dois.
- Filtro, busca, sort ou limite mudaram: a sequência é outra. Definir o que
  acontece com o registro atual — provavelmente parar a reprodução e recomeçar do
  primeiro.

## Controle de câmera: nomes propostos

O pedido chamou de "autofoco". Proponho não usar esse nome: em fotografia
autofoco é nitidez de lente, e o que se descreve aqui é enquadramento.
Aplicativos de navegação chamam isso de *follow mode*. Sugestão, aberta a
discussão:

**Controle:** `cameraTracking` — "Acompanhamento da câmera" / "Camera tracking".

| Estado | pt-BR | en-US | Comportamento | Ícone |
| --- | --- | --- | --- | --- |
| `off` | Livre | Free | O mapa fica onde a pessoa deixou | `gps_off` |
| `follow` | Seguir | Follow | Move só quando o item sai da área visível | `gps_not_fixed` |
| `center` | Centralizar | Keep centred | Mantém o item sempre no centro | `gps_fixed` |

Os três ícones são o idioma consagrado dos aplicativos de navegação e já vêm no
Material Symbols que o projeto carrega, então o controle único pode ser um botão
que cicla entre os três estados, na `MapToolbar`.

## Tasks

### Fase 1: a sequência
- [ ] Módulo puro em `src/services/` que, dada a lista da página, o id atual e a
      posição da página no total, responde o que é primeiro, anterior, próximo e
      último — e quando a resposta exige trocar de página, diz qual página e se o
      alvo é o primeiro ou o último item dela
- [ ] Decidir e documentar o que fazer quando o `sort` não é temporal
- [ ] Testes cobrindo: primeiro e último da página, primeiro e último da consulta
      inteira, item ausente da lista, lista vazia, e uma página só

### Fase 2: o registro atual sobe para o template
- [ ] Um lugar só para "qual é o registro atual", no template
- [ ] Trocar o `handleClick` do mapa como o `onRowClick` foi trocado: clicar no
      ponto define o registro atual, em vez de navegar para a tela do item
- [ ] Clicar na linha e clicar no ponto passam a ser duas formas de definir o
      mesmo estado, e não dois caminhos separados
- [ ] A grade destaca e rola até a linha do registro atual, pela forma decidida
      nos pré-requisitos, sem usar `selection`
- [ ] O mapa enquadra o registro atual pelo `cameraOptions`, respeitando o
      acompanhamento de câmera da Fase 6

### Fase 3: navegação manual
- [ ] Os quatro controles de passo na `MapToolbar`, com a borda de cada um
      conforme a tabela
- [ ] Desabilitar primeiro/anterior na primeira posição e próximo/último na
      última, em vez de deixá-los clicáveis sem efeito
- [ ] Atalhos de teclado, ativos só quando o layout tem foco, conferindo que não
      colidem com os atalhos do próprio Directus

### Fase 4: reprodução automática
- [ ] Play e stop, e intervalo entre passos configurável nas opções do layout
      (na nossa seção do painel, junto do `zoomOnClick`, e não dentro das seções
      deles)
- [ ] A câmera acompanha o item em reprodução sem reenquadrar a coleção inteira
- [ ] Parar sozinho no último registro da última página
- [ ] Avaliar o agrupamento durante a reprodução: um ponto dentro de um cluster
      não aparece sozinho, e a reprodução ficaria invisível. O `clusterData` é
      opção do mapa deles, gravada no preset — desligá-lo só durante a
      reprodução não pode gravar a mudança

### Fase 5: virar a página
- [ ] Virar a página pelo mesmo caminho do rodapé do tabular (`page` na consulta
      ou `toPage`), sem controle de paginação novo
- [ ] Próximo no fim da página avança e cai no primeiro item da próxima;
      anterior no começo recua e cai no **último** item da anterior
- [ ] Cobrir a espera pela busca: a navegação pausa enquanto a página carrega, em
      vez de pular registros
- [ ] Medir com uma coleção de rastreamento de verdade. Com 25 por página, um
      trajeto de mil pontos são quarenta requisições durante a reprodução — e,
      com a consulta compartilhada, possivelmente o dobro (a task-010 registrou
      uma busca por layout). Avaliar um tamanho de página maior durante a
      reprodução, ou buscar a próxima página antes de precisar dela

### Fase 6: acompanhamento da câmera
- [ ] Módulo puro que, dado o estado, o item e os limites visíveis
      (`cameraOptions.bbox`), decide se a câmera se move e para onde — `off` não
      move, `follow` move só fora dos limites (o `isOutsideBounds` de
      `src/services/geo/map-camera.ts` continua valendo), `center` move sempre
- [ ] Para item que não é ponto, "onde está o item" é o bbox da geometria, e não o
      primeiro vértice — mesmo cálculo da Fase 2 da task-007, que deve vir antes
- [ ] Controle único ciclando entre os três estados, com ícone e rótulo por estado
- [ ] Persistir o estado nas opções do layout, com `follow` como padrão
- [ ] Reduzir `zoomOnClick` a "aproximar ao focar", sem decidir movimento
- [ ] Textos em en-US e pt-BR

### Fase 6b: onde ficam os controles

Veio da task-008, que propunha levar controles do painel lateral para o mapa.
Depois da task-010 o painel lateral é outro: tem as seções dos dois layouts do
Directus e uma nossa, só com o `zoomOnClick`. O aperto que motivava esta fase —
títulos quebrando em `Popup Pin Map` e `Table Columns` — não existe mais, e o
centro do mapa deixou de ser opção digitada: o mapa deles grava a câmera sozinho.

- [ ] Decidir onde mora cada grupo: passo e reprodução, acompanhamento de câmera.
      A paginação já mora no rodapé da grade
- [ ] A `MapToolbar` fica sobre o componente deles, por posicionamento absoluto.
      O `ButtonControl` do Directus (`app/src/utils/geometry/controls.ts`) exigiria
      acesso à instância do MapLibre dentro do layout deles, que não é exposta —
      confirmar antes de descartar

### Fase 7: verificação

O Storybook não alcança os layouts do Directus, então o `play` fica para o que é
nosso: a `MapToolbar` com os controles novos e os módulos puros. Grade, mapa e a
sincronia entre eles se provam no e2e.

Os ganchos `data-center` e `data-zoom` e o `getCameraState()` eram do
`MapComponent` e saíram com ele. A câmera se lê agora pelo `cameraOptions` do
estado do mapa, ou pelo que ele grava em `layoutOptions.map` do preset.

- [ ] Unitários dos módulos puros (sequência e acompanhamento de câmera)
- [ ] Stories com `play` da `MapToolbar`: cada controle emite o que deve, e os de
      borda aparecem desabilitados
- [ ] `pnpm check:stories` limpo
- [ ] e2e de navegação: próximo avança um registro, a linha destacada acompanha e
      a câmera vai ao item; anterior desfaz o passo
- [ ] e2e de primeiro e último, caindo nas pontas da consulta e não da página
- [ ] e2e de clique no ponto: define o registro atual e **não** sai do MapGrid
- [ ] e2e de reprodução: dar play, aguardar alguns passos, dar stop, e conferir
      que parou onde deveria
- [ ] e2e de virada de página nos dois sentidos, com uma coleção maior que uma
      página
- [ ] e2e por estado da câmera: em `off` o `cameraOptions` não muda; em `follow`
      só muda quando o item sai do `bbox`; em `center` muda a cada passo
- [ ] Refazer a captura do README com os controles novos visíveis
- [ ] Descrever os controles novos nas duas versões do README, que são dois
      documentos completos e não um com trechos traduzidos

## Notes

Depende da task-010 estar integrada: tudo aqui é feito sobre a composição. E a
Fase 6 depende da Fase 2 da task-007 (enquadrar por bbox para geometria que não é
ponto), que é o caso do trajeto como `LineString`.

Todos os e2e dividem o mesmo preset do admin, e por isso a suíte roda com um
worker só (`playwright.config.ts`). Um e2e desta task que grave `page`, `sort`
ou câmera não pode supor que outro teste não mexeu no preset antes dele: cada um
parte do `ensureMapGridPreset`.

Um passo por registro tem limite prático: em reprodução rápida, cada passo pede
uma animação de câmera ao mapa deles. Ou o intervalo respeita a animação, ou a
reprodução pede a câmera sem animação.

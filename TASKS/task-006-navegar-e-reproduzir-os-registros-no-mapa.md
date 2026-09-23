# Task 006 — Navegar e reproduzir os registros no mapa

Status: pending
Type: feat
Assignee: sidartaveloso
Difficulty: 3
Priority: 40

## Description

Percorrer os registros da coleção a partir do layout: primeiro, anterior,
próximo, último, e reprodução automática com parada. A grade e o mapa mostram
sempre o mesmo registro — a linha destacada e rolada até a vista, o balão aberto
no ponto correspondente — e a paginação acompanha: se o registro pedido está em
outra página, a página é trocada antes de ele ser mostrado.

O caso que motiva: uma coleção de posições de rastreamento veicular. Com sort
por data/hora, apertar play faz a câmera percorrer o trajeto na ordem em que ele
aconteceu, em vez de a pessoa clicar ponto a ponto.

A câmera ganha um controle de acompanhamento com três estados, para a pessoa
escolher se o mapa persegue a posição atual e como.

## O que mudou desde que esta task foi escrita

A grade agora é o `v-table` do Directus, o mesmo componente do layout tabular, e
o mapa deve convergir para a configuração de mapa do projeto (task-007, que
concluiu não existir um componente de mapa registrado para importar: o caminho é
ler a mesma configuração, não reusar o componente).

**Consequência para esta task: não escrever nada que dependa de nome de função
interna, de evento ou de controle existente hoje.** O que está descrito abaixo é
comportamento; os nomes citados são referência de onde procurar, e podem já ter
mudado quando alguém pegar a task. O que precisa continuar valendo é o contrato
entre as três camadas:

- **layout (`src/index.ts`)** — dono da consulta: `items`, `page`, `limit`,
  `sort`, `totalPages`. É o único que pode trocar de página.
- **template (`MapgridLayout.vue`)** — dono do registro atual. Recebe os itens e
  a paginação por prop, manda a grade destacar e o mapa focar, e pede a troca de
  página por emit.
- **grade e mapa** — recebem qual é o registro atual e o mostram. Nenhum dos
  dois decide qual é o próximo, nem mexe na página.

Hoje o registro atual está espalhado: a grade guarda um `selectedItemId` seu, o
mapa abre o balão por conta própria e os dois se falam por `ref` do template
(`focusOnItem` / `selectItem`). Com navegação, isso não se sustenta — o estado
precisa subir para o template, em uma peça só.

## Pré-requisitos de projeto

Três decisões precisam sair antes do código, porque mudam a implementação.

**A ordem é o que define "próximo".** A sequência sai do `sort` da consulta. Sem
sort definido, a ordem é a que o banco devolver, e a reprodução pula de um lado
para o outro do mapa sem sentido. Definir o comportamento: exigir sort, assumir
um padrão, ou avisar na interface que a reprodução precisa de um campo de
ordenação.

**A paginação não existe na interface do layout.** `page`, `totalPages` e
`itemCount` saem do `setup` mas não chegam ao template: `MapgridLayoutProps` não
os declara, e não há controle de página desenhado em lugar nenhum. Esta task
precisa deles de qualquer forma para virar a página, então é aqui que a
paginação aparece — e vale conferir como o layout tabular do Directus desenha a
dele antes de inventar uma.

**O balão hoje não comporta botão.** O popup é montado com `setHTML` e uma
string crua, onde não há como ligar evento de Vue. Se os botões de navegação
forem morar no balão, é preciso conteúdo montado (`setDOMContent` com um
componente, ou delegação de evento no container). A troca também é a hora de
corrigir uma falha que existe hoje: o rótulo vem do dado do item e entra sem
escape no HTML, então um registro com `<img onerror=...>` no campo do título
executa script. **Essa correção vale mesmo que os botões fiquem só na barra do
mapa** — não é opcional.

**O controle de câmera absorve parte do `zoomOnClick`.** A opção booleana que
existe hoje mistura duas coisas: se a câmera se move e se ela também aproxima.
Ligada, focar um item dá um `flyTo` com zoom fixo; desligada, só move quando o
ponto está fora da área visível — ou seja, o estado "seguir" descrito abaixo já
está implementado, escondido atrás de um booleano. Com o controle de três
estados, `zoomOnClick` deve deixar de decidir movimento e passar a significar
apenas "aproximar ao focar", que é uma escolha ortogonal.

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
  nem dispara um passo em cima de uma lista que ainda é a antiga.
- Trocar de página nunca reenquadra a coleção inteira: quem manda na câmera é o
  estado de acompanhamento, não o refetch.
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
| `follow` | Seguir | Follow | Move só quando o ponto sai da área visível | `gps_not_fixed` |
| `center` | Centralizar | Keep centred | Mantém o ponto sempre no centro | `gps_fixed` |

Os três ícones são o idioma consagrado dos aplicativos de navegação e já vêm no
Material Symbols que o projeto carrega, então o controle único pode ser um botão
que cicla entre os três estados, junto dos demais controles sobre o mapa.

## Tasks

### Fase 1: a sequência
- [ ] Módulo puro em `src/services/` que, dada a lista da página, o id atual e a
      posição da página no total, responde o que é primeiro, anterior, próximo e
      último — e quando a resposta exige trocar de página, diz qual página e se o
      alvo é o primeiro ou o último item dela
- [ ] Decidir e documentar o comportamento sem sort definido
- [ ] Testes cobrindo: primeiro e último da página, primeiro e último da consulta
      inteira, item ausente da lista, lista vazia, e uma página só

### Fase 2: o registro atual sobe para o template
- [ ] Um lugar só para "qual é o registro atual", no template, alimentando grade
      e mapa por prop em vez de cada um guardar o seu
- [ ] Clicar na linha e clicar no ponto passam a ser duas formas de definir o
      mesmo estado, e não dois caminhos separados
- [ ] A grade destaca e rola até a linha do registro atual, como já faz hoje
- [ ] O mapa foca e abre o balão do registro atual, respeitando o acompanhamento
      de câmera da Fase 4

### Fase 3: navegação manual
- [ ] Os quatro controles de passo, com a borda de cada um conforme a tabela
- [ ] Desabilitar primeiro/anterior na primeira posição e próximo/último na
      última, em vez de deixá-los clicáveis sem efeito
- [ ] Trocar o balão para conteúdo montado, se os botões forem morar nele
- [ ] Escapar o rótulo, fechando a injeção de HTML que existe hoje
- [ ] Atalhos de teclado, ativos só quando o layout tem foco, conferindo que não
      colidem com os atalhos do próprio Directus

### Fase 4: reprodução automática
- [ ] Play e stop, e intervalo entre passos configurável nas opções do layout
- [ ] A câmera acompanha o item em reprodução sem reenquadrar a coleção inteira:
      cuidado com o enquadramento inicial de uma vez só e com o refetch
      cancelando a animação, que foi exatamente o defeito corrigido em `9861ffa`
- [ ] Parar sozinho no último registro da última página
- [ ] Avaliar desligar o agrupamento durante a reprodução: um ponto dentro de um
      cluster não aparece sozinho, e a reprodução ficaria invisível

### Fase 5: virar a página
- [ ] `page` e `totalPages` chegam ao template; trocar de página é um emit que o
      `setup` grava na consulta (o `page` gravável já existe em
      `useWritableLayoutQuery`)
- [ ] Controle de paginação na interface, olhando antes como o layout tabular do
      Directus desenha o dele
- [ ] Próximo no fim da página avança e cai no primeiro item da próxima;
      anterior no começo recua e cai no **último** item da anterior
- [ ] Cobrir a espera pela busca: a navegação pausa enquanto a página carrega, em
      vez de pular registros
- [ ] Medir com uma coleção de rastreamento de verdade. Com o limite padrão de 25
      por página, um trajeto de mil pontos são quarenta requisições durante a
      reprodução — avaliar aumentar o limite ou buscar a próxima página antes de
      precisar dela

### Fase 6: acompanhamento da câmera
- [ ] Módulo puro que, dado o estado, o ponto e os limites visíveis, decide se a
      câmera se move e para onde — `off` não move, `follow` move só fora dos
      limites (é o `isOutsideBounds` que já existe), `center` move sempre
- [ ] Controle único ciclando entre os três estados, com ícone e rótulo por estado
- [ ] Persistir o estado nas opções do layout, com `follow` como padrão, que é o
      comportamento de hoje
- [ ] Reduzir `zoomOnClick` a "aproximar ao focar", sem decidir movimento
- [ ] Textos em en-US e pt-BR

### Fase 6b: onde ficam os controles

Veio da task-008, que propunha levar controles do painel lateral para o mapa.
Ficou aqui porque é a mesma decisão: quem desenha a barra do mapa desenha ela
inteira. Esta task acrescenta seis controles de navegação, o de acompanhamento
de câmera e a paginação — decidir isoladamente onde cada um fica, e depois mover
outros para o mesmo lugar, sai torto.

Duas evidências de que o painel lateral está apertado: na captura do README os
títulos das seções quebram em duas linhas (`Popup Pin Map`, `Table Columns`) e as
seções se espremem em duas colunas.

- [ ] Decidir onde mora cada grupo: passo e reprodução, acompanhamento de câmera,
      paginação. Sobre o mapa, entre o mapa e a grade, ou no rodapé do layout
- [ ] Decidir o que sai do painel para o mapa. Candidatos: o centro do mapa, que
      hoje pede digitar coordenadas quando arrastar e fixar seria mais direto, e
      o zoom ao clicar na linha
- [ ] Avaliar o `ButtonControl` do Directus
      (`app/src/utils/geometry/controls.ts`), que é um botão sobre o mapa no
      padrão do MapLibre, contra o posicionamento absoluto por CSS usado hoje
- [ ] Definir o que sobra no painel: provavelmente só configuração de coleção,
      como o campo de geolocalização e o template do popup

### Fase 7: verificação

Toda função desta task tem de ter story com `play`, e não só teste unitário. O
mapa é WebGL: no happy-dom ele nem inicializa, então é no navegador do Storybook
que o comportamento de câmera pode ser exercitado de verdade.

O componente já entrega os dois ganchos de que o `play` precisa, sem depender de
detalhe interno do maplibre: `data-center` e `data-zoom` no container, e
`getCameraState()` no `defineExpose`. É por eles que a asserção deve passar.

- [ ] `play` de navegação: próximo avança um registro, o balão troca e a linha
      destacada na grade acompanha; anterior desfaz o passo
- [ ] `play` de primeiro e último, conferindo que caem nas pontas da consulta e
      não nas pontas da página
- [ ] `play` de atalho de teclado, disparando a tecla e conferindo o mesmo efeito
- [ ] `play` de reprodução: dar play, aguardar alguns passos, dar stop, e conferir
      que parou onde deveria
- [ ] `play` de virada de página nos dois sentidos, com uma coleção do catálogo
      maior que uma página: próximo no fim de uma página cai no primeiro item da
      seguinte, anterior no começo cai no último item da anterior
- [ ] `play` por estado da câmera: em `off` o centro não muda; em `follow` só muda
      quando o ponto sai dos limites; em `center` muda a cada passo
- [ ] Unitários dos módulos puros
- [ ] `pnpm check:stories` limpo — ele já abre cada story e falha a qualquer
      mensagem de console, então o `play` roda nele sem configuração nova
- [ ] e2e percorrendo uma coleção com mais registros que uma página, indo e
      voltando pela virada
- [ ] Refazer `docs/tela.jpg` com os controles de navegação e o de acompanhamento
      de câmera visíveis
- [ ] Descrever os controles novos nas duas versões do README, que são dois
      documentos completos e não um com trechos traduzidos

## Notes

A task-005 fechou: as colunas saem de `layoutQuery.fields` e `page`, `limit` e
`sort` já são graváveis em `useWritableLayoutQuery` — justamente o que a Fase 5
precisa para virar a página.

A task-008 fechou levando escolha de colunas e ordenação para o cabeçalho do
`v-table`. A Fase 6b herda dela a pergunta que sobrou: o que mais sai do painel
lateral.

A task-007 pode trocar a origem do estilo do mapa e ampliar as geometrias
aceitas. Ela não muda o que esta task faz, mas muda o arquivo — por isso os
critérios acima falam de comportamento, e não dos nomes de hoje.

Um atalho de teclado por registro tem limite prático: em reprodução rápida, cada
passo dispara uma animação de câmera de um segundo (`GEO_ANIMATION_DURATION`).
Ou o intervalo respeita a animação, ou a animação encurta durante a reprodução.

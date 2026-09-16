# Task 006 — Navegar e reproduzir os registros no mapa

Status: pending
Type: feat
Assignee: harrison.sanches

## Description

Percorrer os registros da grade a partir do mapa: avançar e voltar pelo balão do
marcador, pelos mesmos atalhos de teclado, e em reprodução automática com
parada. Ao chegar no último registro da página atual, avançar a paginação
sozinho e continuar. A câmera ganha um controle de acompanhamento com três
estados, para a pessoa escolher se o mapa persegue a posição atual e como.

O caso que motiva: uma coleção de posições de rastreamento veicular. Com sort por
data/hora, apertar play faz a câmera percorrer o trajeto na ordem em que ele
aconteceu, em vez de a pessoa clicar ponto a ponto.

## Pré-requisitos de projeto

Três decisões precisam sair antes do código, porque mudam a implementação.

**A ordem é o que define "próximo".** A sequência sai do `sort` do `layoutQuery`.
Sem sort definido, a ordem é a que o banco devolver, e a reprodução pula de um
lado para o outro do mapa sem sentido. Definir o comportamento: exigir sort,
assumir um padrão, ou avisar na interface que a reprodução precisa de um campo de
ordenação.

**O balão hoje não comporta botão.** `openPopupAt` usa
`popup.setHTML(\`<strong>${label}</strong>\`)`, que é string crua — não há como
ligar evento de Vue ali. Para ter botões funcionando é preciso trocar por
`setDOMContent` com um componente montado, ou delegar eventos no container. A
troca também é a hora de corrigir uma falha que existe hoje: o rótulo vem do dado
do item e entra sem escape no HTML, então um registro com `<img onerror=...>` no
campo do título executa script.

**O controle de câmera absorve parte do `zoomOnClick`.** A opção booleana que
existe hoje mistura duas coisas: se a câmera se move e se ela também aproxima.
Com `zoomOnClick` ligado, focar um item faz `flyTo` com zoom fixo 15; desligado,
faz `panToVisibleArea`, que só move quando o ponto está fora da área visível —
ou seja, o estado "seguir" descrito abaixo **já está implementado**, escondido
atrás de um booleano. Ao introduzir o controle de três estados, `zoomOnClick`
deve deixar de decidir movimento e passar a significar apenas "aproximar ao
focar", que é uma escolha ortogonal.

**A página é somente leitura no layout.** Em `src/index.ts`, `page` é
`computed(() => layoutQuery.value?.page || 1)`. Para a reprodução virar a página
sozinha, ela precisa ser gravável, escrevendo em `layoutQuery`. `totalPages` já
está disponível para saber onde parar.

## Controle de câmera: nomes propostos

O pedido chamou de "autofoco". Proponho não usar esse nome: em fotografia
autofoco é nitidez de lente, e o que se descreve aqui é enquadramento. Aplicativos
de navegação chamam isso de *follow mode*. Sugestão, aberta a discussão:

**Controle:** `cameraTracking` — "Acompanhamento da câmera" / "Camera tracking".

| Estado | pt-BR | en-US | Comportamento | Ícone |
| --- | --- | --- | --- | --- |
| `off` | Livre | Free | O mapa fica onde a pessoa deixou | `gps_off` |
| `follow` | Seguir | Follow | Move só quando o ponto sai da área visível | `gps_not_fixed` |
| `center` | Centralizar | Keep centred | Mantém o ponto sempre no centro | `gps_fixed` |

Os três ícones são o idioma consagrado dos aplicativos de navegação e já vêm no
Material Symbols que o projeto carrega, então o controle único pode ser um botão
que cicla entre os três estados, no `MapToolbar` — que já é a superfície de
controles do mapa.

## Tasks

### Fase 1: a sequência
- [ ] Módulo puro em `src/services/` que, dada a lista de itens e o id atual,
      devolve o próximo e o anterior, e diz quando acabou a página
- [ ] Decidir e documentar o comportamento sem sort definido
- [ ] Testes cobrindo primeiro item, último item, item ausente e lista vazia

### Fase 2: navegação manual
- [ ] Trocar o balão para conteúdo montado, com botões de anterior e próximo
- [ ] Escapar o rótulo, fechando a injeção de HTML que existe hoje
- [ ] Sincronizar com a grade: avançar no mapa destaca e rola até a linha, como
      `selectItem` já faz
- [ ] Atalhos de teclado, ativos só quando o layout tem foco, conferindo que não
      colidem com os atalhos do próprio Directus

### Fase 3: reprodução automática
- [ ] Botões de play e stop, e intervalo entre passos configurável nas opções do
      layout
- [ ] A câmera acompanha o item em reprodução sem reenquadrar a coleção inteira:
      cuidado com `performInitialFitBoundsOnce` e com o refetch cancelando o
      `flyTo`, que foi exatamente o defeito corrigido em `9861ffa`
- [ ] Parar sozinho no último registro da última página
- [ ] Avaliar desligar o agrupamento durante a reprodução: um ponto dentro de um
      cluster não aparece sozinho, e a reprodução ficaria invisível

### Fase 4: acompanhamento da câmera
- [ ] Módulo puro que, dado o estado, o ponto e os limites visíveis, decide se a
      câmera se move e para onde — `off` não move, `follow` move só fora dos
      limites (é o `isOutsideBounds` que já existe), `center` move sempre
- [ ] Controle único no `MapToolbar` ciclando entre os três estados, com ícone e
      rótulo por estado
- [ ] Persistir o estado nas opções do layout, com `follow` como padrão, que é o
      comportamento de hoje
- [ ] Reduzir `zoomOnClick` a "aproximar ao focar", sem decidir movimento
- [ ] Textos em en-US e pt-BR

### Fase 4b: a barra do mapa como um todo

Veio da task-008, que propunha levar controles do painel lateral para o mapa.
Ficou aqui porque é a mesma decisão: quem desenha a barra do mapa desenha ela
inteira. Esta task já acrescenta o controle de acompanhamento de câmera e os
botões de reprodução — decidir isoladamente onde eles ficam, e depois mover
outros controles para o mesmo lugar, sai torto.

Duas evidências de que o painel lateral está apertado: na captura do README os
títulos das seções quebram em duas linhas (`Popup Pin Map`, `Table Columns`) e as
seções se espremem em duas colunas.

- [ ] Decidir o que sai do painel para o mapa. Candidatos: o centro do mapa, que
      hoje pede digitar coordenadas quando arrastar e fixar seria mais direto, e
      o zoom ao clicar na linha
- [ ] Avaliar o `ButtonControl` do Directus
      (`app/src/utils/geometry/controls.ts`), que é um botão sobre o mapa no
      padrão do MapLibre, contra o posicionamento absoluto por CSS que o
      `MapToolbar` usa hoje
- [ ] Definir o que sobra no painel: provavelmente só configuração de coleção,
      como o campo de geolocalização e o template do popup

### Fase 5: virar a página
- [ ] Tornar `page` gravável no `setup` do layout
- [ ] Ao chegar no fim da página, avançar e seguir do primeiro item da próxima
- [ ] Cobrir a espera pela busca: a reprodução pausa enquanto a página carrega,
      em vez de pular registros
- [ ] Medir com uma coleção de rastreamento de verdade. Com o limite padrão de 25
      por página, um trajeto de mil pontos são quarenta requisições durante a
      reprodução — avaliar aumentar o limite ou buscar a próxima página antes de
      precisar dela

### Fase 6: verificação

Toda função desta task tem de ter story com `play`, e não só teste unitário. O
mapa é WebGL: no happy-dom ele nem inicializa, então é no navegador do Storybook
que o comportamento de câmera pode ser exercitado de verdade.

O componente já entrega os dois ganchos de que o `play` precisa, sem depender de
detalhe interno do maplibre: `data-center` e `data-zoom` no container, e
`getCameraState()` no `defineExpose`. É por eles que a asserção deve passar.

- [ ] `play` de navegação: clicar em próximo avança um registro, o balão troca e
      a linha destacada na grade acompanha
- [ ] `play` de atalho de teclado, disparando a tecla e conferindo o mesmo efeito
- [ ] `play` de reprodução: dar play, aguardar alguns passos, dar stop, e conferir
      que parou onde deveria
- [ ] `play` de virada de página, com uma coleção do catálogo maior que uma página
- [ ] `play` por estado da câmera: em `off` o centro não muda; em `follow` só muda
      quando o ponto sai dos limites; em `center` muda a cada passo
- [ ] Unitários dos módulos puros
- [ ] `pnpm check:stories` limpo — ele já abre cada story e falha a qualquer
      mensagem de console, então o `play` roda nele sem configuração nova
- [ ] e2e percorrendo uma coleção com mais registros que uma página
- [ ] Refazer `docs/tela.jpg` com o balão mostrando os botões de navegação e a
      barra do mapa com o controle de acompanhamento e os de reprodução
- [ ] Descrever os controles novos nas duas versões do README, que são dois
      documentos completos e não um com trechos traduzidos

## Notes

Depende da task-005, que além de trocar as colunas fixas por `layoutQuery.fields`
passou a tornar `page`, `limit` e `sort` graváveis — justamente o que a Fase 5
precisa para virar a página. Começar depois que ela fechar evita conflito no
mesmo arquivo.

Um atalho de teclado por registro tem limite prático: em reprodução rápida, cada
passo dispara um `flyTo` com animação de um segundo (`GEO_ANIMATION_DURATION`).
Ou o intervalo respeita a animação, ou a animação encurta durante a reprodução.

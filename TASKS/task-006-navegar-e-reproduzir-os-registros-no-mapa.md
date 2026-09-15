# Task 006 — Navegar e reproduzir os registros no mapa

Status: pending
Type: feat
Assignee: harrison.sanches

## Description

Percorrer os registros da grade a partir do mapa: avançar e voltar pelo balão do
marcador, pelos mesmos atalhos de teclado, e em reprodução automática com
parada. Ao chegar no último registro da página atual, avançar a paginação
sozinho e continuar.

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

**A página é somente leitura no layout.** Em `src/index.ts`, `page` é
`computed(() => layoutQuery.value?.page || 1)`. Para a reprodução virar a página
sozinha, ela precisa ser gravável, escrevendo em `layoutQuery`. `totalPages` já
está disponível para saber onde parar.

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

### Fase 4: virar a página
- [ ] Tornar `page` gravável no `setup` do layout
- [ ] Ao chegar no fim da página, avançar e seguir do primeiro item da próxima
- [ ] Cobrir a espera pela busca: a reprodução pausa enquanto a página carrega,
      em vez de pular registros
- [ ] Medir com uma coleção de rastreamento de verdade. Com o limite padrão de 25
      por página, um trajeto de mil pontos são quarenta requisições durante a
      reprodução — avaliar aumentar o limite ou buscar a próxima página antes de
      precisar dela

### Fase 5: verificação
- [ ] Unitários dos módulos puros e dos componentes
- [ ] Stories cobrindo navegação, reprodução e virada de página, usando o
      catálogo de `mappable-mocks`
- [ ] `pnpm check:stories` limpo
- [ ] e2e percorrendo uma coleção com mais registros que uma página

## Notes

Depende da task-005, que troca as colunas fixas por `layoutQuery.fields` e mexe
em `useLayoutQuery`, o mesmo ponto onde a Fase 4 precisa tornar `page` gravável.
Vale começar depois que ela fechar, ou combinar antes quem mexe ali.

Um atalho de teclado por registro tem limite prático: em reprodução rápida, cada
passo dispara um `flyTo` com animação de um segundo (`GEO_ANIMATION_DURATION`).
Ou o intervalo respeita a animação, ou a animação encurta durante a reprodução.

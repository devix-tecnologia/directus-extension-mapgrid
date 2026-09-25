# 🧩 Task 015 — O registro atual aparece no mapa mesmo agrupado, com atalhos de teclado e a virada de pagina medida

- Status: pending
- Type: feat
- Assignee: sidartaveloso
- Priority: 750

## Description
O que sobrou da task-006, que entregou passo, reprodução, virada de página e
acompanhamento de câmera.

**O registro atual aparece no mapa mesmo dentro de um cluster.** Com o
agrupamento ligado, o ponto do registro atual some no cluster, e a reprodução
fica invisível no mapa. A direção (Sidarta): a reprodução continua andando na
grade, e o mapa plota à parte o ponto do registro atual. O `clusterData` segue
como está no preset: não se desliga o agrupamento, nem de forma temporária.
Restrições que já valem:
- o registro atual **não** passa pelo `selection`, que arma as ações em lote
  (decisão da task-006);
- a instância do MapLibre do layout do Directus não é exposta. O contorno fica
  atrás de um método próprio, documentado como limitação e provisório até haver
  suporte nativo, e cabe no contrato de mapa da task-011.

**Atalhos de teclado.** Primeiro, anterior, próximo, último e play/stop, ativos
só com o layout em foco. Conferir contra a lista de atalhos do Directus antes de
escolher as teclas.

**Virada de página durante a reprodução, medida.** O mapa e o cluster têm só os
registros da página corrente, não os da consulta inteira. O custo a medir é a
busca a cada virada: com 25 por página, um trajeto de mil pontos são quarenta
requisições, possivelmente o dobro com a consulta compartilhada. O seed do e2e
tem oito registros, que provam o comportamento mas não medem nada.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [ ] Teste vermelho: com agrupamento ligado, o registro atual aparece no mapa
      como ponto próprio, fora do cluster, e acompanha cada passo
- [ ] O ponto do registro atual, atrás de um método próprio documentado como
      limitação; o `clusterData` do preset não muda
- [ ] Atalhos de teclado com o layout em foco, sem colidir com os do Directus,
      e textos de ajuda em en-US e pt-BR
- [ ] Contar as requisições de uma reprodução sobre um trajeto sintético de mil
      pontos no ambiente do e2e, com a consulta compartilhada
- [ ] Decidir, com o número na mão, entre tamanho de página maior durante a
      reprodução, buscar a próxima página antes de precisar dela, ou manter
- [ ] Evidência de tela: a reprodução visível no mapa com o agrupamento ligado

## Notes
Veio dos critérios não feitos da task-006 (Fases 3, 4 e 5).

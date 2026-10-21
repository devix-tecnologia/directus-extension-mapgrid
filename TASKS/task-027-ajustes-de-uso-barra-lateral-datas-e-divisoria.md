# 🧩 Task 027 — Ajustes de uso: barra lateral, datas e divisoria

- Status: done
- Type: feat
- Assignee: sidartaveloso
- Priority: 910

## Description
Três pedidos do Sidarta depois de usar a vitrine: a barra lateral direita do
Directus recolhida por padrão, as datas no formato `27/03/2026 10:30:47` e a
possibilidade de redistribuir a área entre mapa e grade.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [x] A barra lateral recolhe na primeira visita do navegador à coleção
      (`appStore.sidebarOpen`, por `useStores().useAppStore`); reaberta, fica
      como a pessoa deixou — `src/services/browser-memory/` lembra, e é o mesmo
      serviço que lembra a apresentação
- [x] `src/services/instant-format/` — `27/03/2026 10:30:47`: dia e mês com dois
      dígitos, ano inteiro, relógio de 24 h com segundos, espaço e nunca vírgula;
      a ordem de dia e mês segue o idioma. Usado no card e na linha do tempo
- [x] Coluna Data/Hora da coleção LPR com `display_options.format`
      `dd/MM/yyyy HH:mm:ss` e 200 px de largura no preset
- [x] `src/services/pane-split/` e `src/components/molecules/pane-splitter/` —
      a divisória entre mapa e grade: arrastar mostra na hora e grava ao soltar
      (`mapShare` no preset), ↑ ↓ andam de 5 em 5 pontos, duplo clique volta a
      60%; entre 25% e 85%, para nenhum dos lados sumir
- [x] A linha do tempo reserva o espaço dela assim que existe campo de tempo,
      antes de o intervalo chegar: aparecer depois encolhia o mapa sob o que se
      apontava — era a causa do e2e instável da medição
- [x] O e2e do relógio dos dados conta a partir de um registro conhecido pelo
      nome: o primeiro passo às vezes vinha antes de a observação começar, e as
      esperas saíam deslocadas em uma
- [x] e2e `tests/e2e/mapgrid-split.spec.ts`; README

## Notes

### Um clique na divisória não grava nada
Primeira versão: soltar sempre gravava a posição do ponteiro, e os dois cliques
de um duplo clique gravavam a posição da própria barra por cima do "voltar ao
padrão". Agora só grava o que andou mais de 3 px.

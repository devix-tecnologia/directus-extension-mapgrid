# 🧩 Task 012 — A entrega ao mapa depois da busca funciona com o Vue do Directus

- Status: pending
- Type: fix
- Assignee: sidartaveloso
- Priority: 650

## Description

Com geometria nativa, depois de o `CentralizadorDoMapaDirectus` mover o mapa uma
vez, o pedido seguinte que depende de buscar a geometria na API
(`centralizarItem` de um item fora da tela, `enquadrarTudo`) grava o
`geojsonBounds` novo no estado do layout embutido, mas o layout de mapa do
Directus continua recebendo o valor anterior: o `MapgridLayout` não volta a
renderizar.

Só acontece com o **Vue 3.4.27**, o do Directus 10.13.1 — a extensão roda com o
Vue do app. Com o 3.5 do projeto não acontece.

O defeito está reproduzido em
`src/components/templates/mapgrid-layout/MapgridLayout.vue-do-directus.test.ts`,
em `it.fails`, rodado por `pnpm test:vue-do-directus` (e dentro do `pnpm test`).

Diagnóstico completo e o que já foi descartado: task-007, seção "Geometria
nativa".

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [ ] Achar o mecanismo no Vue 3.4 que impede o novo render, usando o teste
      reprodutor, e registrar aqui em uma frase
- [ ] Corrigir no MapGrid, sem depender da versão do Vue: o `it.fails` vira `it`
      e passa nas duas configurações (`pnpm test`)
- [ ] Tirar de `test.fixme` os dois e2e de `tests/e2e/mapgrid-trajetos.spec.ts`
      e ver `pnpm test:e2e` verde
- [ ] Na task-007, trocar o item adiado pela referência a esta task

## Notes

# 🧩 Task 012 — A entrega ao mapa depois da busca funciona com o Vue do Directus

- Status: in-progress
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
- [x] Achar o mecanismo no Vue 3.4 que impede o novo render, usando o teste
      reprodutor, e registrar aqui em uma frase. **Não existe mecanismo no Vue
      3.4**: o reprodutor era artefato do arranjo de teste — ver "O que o
      reprodutor media", abaixo
- [x] Corrigir no MapGrid, sem depender da versão do Vue: o `it.fails` vira `it`
      e passa nas duas configurações (`pnpm test`). Sem tocar no MapGrid: com o
      arranjo consertado o teste já passa com o 3.4.27
- [ ] Tirar de `test.fixme` os dois e2e de `tests/e2e/mapgrid-trajetos.spec.ts`
      e ver `pnpm test:e2e` verde
- [ ] Na task-007, trocar o item adiado pela referência a esta task

## O que o reprodutor media — medido em 2026-09-24

O `vitest.vue-do-directus.config.ts` apontava `vue` para o `vue-do-directus`
(3.4.27), e a guarda `expect(version).toBe('3.4.27')` passava — mas só para o
arquivo de teste. O `@vue/test-utils` tem condição `node` no `exports`, e o
vitest roda em node: o `mount` vinha do pacote CommonJS, cujo `require('vue')`
o alias não alcança. Ele montava com o **Vue 3.5.22 do projeto**.

Com duas cópias do Vue, o estado do teste é de uma reatividade e o efeito de
render é de outra: ler um `ref` de 3.4 dentro de um render de 3.5 não registra
dependência nenhuma. **Nenhum componente montado por aquele arquivo re-renderizava
jamais** — provado com um `ref(0)` criado dentro do próprio `setup()`, que
também não repintava. O `it.fails` reprovava por isso, não por defeito no
MapGrid nem por versão do Vue.

Com o alias apontando o `@vue/test-utils` para o `dist/vue-test-utils.esm-bundler.mjs`,
as duas metades passam a usar o 3.4.27 — e o teste de "entregar ao mapa depois
da busca" **passa sem um caractere de mudança no MapGrid**. A guarda nova
(`monta com esse mesmo Vue: uma reatividade só, não duas`) impede o arranjo de
voltar a mentir.

Duas consequências para quem retomar:

- a conclusão da task-007 ("é o Vue do app", "passa no 3.5 e falha no 3.4") está
  **errada**, e foi errada pelo mesmo motivo;
- o defeito do e2e — se ainda existe — continua sem reprodução em teste de
  componente. Não há evidência de que seja de render.

## Notes

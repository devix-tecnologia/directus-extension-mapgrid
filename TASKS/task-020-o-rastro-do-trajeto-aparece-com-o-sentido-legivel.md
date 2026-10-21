# 🧩 Task 020 — O rastro do trajeto aparece, com o sentido legivel

- Status: pending
- Type: feat
- Assignee: A definir
- Priority: 840
- Group: g-yezqk9i5
- GroupName: Movimento no mapa
- Difficulty: 3

## Description
Durante a reprodução, desenhar o caminho já percorrido atrás do registro atual —
o rastro que faz a reprodução **parecer movimento** em vez de um ponto que
pisca de lugar em lugar.

E o rastro carrega o sentido: setas repetidas ao longo da linha, não uma seta só
na ponta. A ideia vem do `ceturb/mobi-gv` e é melhor que desenhar a direção
apenas no registro atual — ver "Setas ao longo da linha".

Como a instância do MapLibre é privada, o desenho é um `<svg>` absoluto sobre o
painel do mapa, projetando os pontos com a mesma matemática do registro atual
(task-018). Rastro como camada de verdade depende da task-011.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [ ] `trailLength` em `src/contract/layout-options.contract.ts` (0 = desligado,
      padrão 20, teto 200) com policy `from(value: unknown)` — ver "Uma opção só"
- [ ] `src/services/trail-path/` — segmentos com opacidade por idade, ponto não
      projetável quebra a linha, descarte do que está fora do painel
- [ ] `src/components/molecules/map-trail/` — três camadas e `marker-mid`,
      `pointer-events: none` no `<svg>` raiz
- [ ] Ligar no `MapgridLayout.vue` lendo o `VisitedPath` da task-018; esconder
      junto com a marca enquanto a câmera não pousa; limpar no `watch(queryKey)`
- [ ] Seção no painel de opções e rótulos en-US/pt-BR em `src/shared/messages.ts`
- [ ] e2e `tests/e2e/mapgrid-trail.spec.ts`: quatro passos **atravessando a
      virada de página** com `limit: 3` e quatro segmentos desenhados; clique no
      marcador continua selecionando; reordenar pelo cabeçalho zera o rastro
- [ ] Evidência de tela, antes e depois (`EVIDENCE_TASK=020 pnpm screenshot`)
- [ ] `pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm build`, `pnpm test:e2e`
- [ ] ... — adiado, se não couber: setas marchando (ver "Setas marchando")

## Notes

### Uma opção só
`trailLength` com 0 = desligado, em vez de um par ligado/tamanho. Duas chaves
podem se contradizer no preset; uma não.

### Os pontos vêm do que foi visitado, não da página
Gravados no `focus()` pelo `VisitedPath` da task-018. É o que faz o rastro
sobreviver à virada de página sem depender de item nenhum continuar carregado —
e o e2e que atravessa a virada é exatamente o que prova essa decisão.

O rastro liga pontos visitados, não o caminho realmente percorrido entre eles:
se alguém clicar numa linha distante, aparece uma reta longa. É fiel ao que a
extensão sabe, e precisa estar dito no TSDoc.

### Setas ao longo da linha
Do `mobi-gv` (`MapaLeaflet.vue:450-472`): as setas se repetem a cada 20 px, e
por isso o sentido é legível em qualquer trecho visível, mesmo com as pontas do
trajeto fora da tela. Em SVG isso é `marker-mid` num `<path>` — mais barato que
a solução deles, que instancia um decorator.

Espaçamento em **pixels**, não em metros: a densidade na tela não muda com o
zoom.

### As três camadas
Copiadas de `MapaLeaflet.vue:434-448`, que é a receita que faz a linha ler sobre
qualquer basemap: halo branco por baixo (`stroke-width: 9`, `opacity .6`,
`linecap round`), traço da cor do tema por cima (`5`), setas com contorno branco.

### Setas marchando
O `mobi-gv` tentou (`decoratorOffset` + `setInterval` de 300 ms redesenhando as
três polylines) e **comentou o código** — `MapaLeaflet.vue:679-686`, com o
`clearInterval` órfão logo abaixo. Em SVG sai de graça com `stroke-dasharray` +
`stroke-dashoffset` animado por CSS, sem recálculo nenhum. Fica como opcional
desta task, e é a primeira coisa a cortar se o escopo apertar.

### O defeito conhecido
Entre pedir o movimento e o `moveend`, o rastro some junto com a marca (até 2 s,
`CAMERA_LANDING_DEADLINE_MS`). Com `cameraTracking: 'center'` e intervalo de 1 s,
isso pisca a cada passo. **Não tem conserto sem os eventos do mapa** — task-011.

# 🧩 Task 019 — O registro atual mostra para onde vai

- Status: pending
- Type: feat
- Assignee: A definir
- Priority: 830
- Group: g-yezqk9i5
- GroupName: Movimento no mapa
- Difficulty: 3

## Description
Ideia do Sidarta: o ícone no mapa indica a **direção** (curso, azimute) do
registro. Numa coleção de rastreamento, é a diferença entre um ponto parado e um
veículo com o nariz apontando para onde vai.

Hoje não existe nada disso — nem em `TASKS/`, nem no `README.md`, nem no código.

**O que não dá para fazer, e por quê**: os marcadores do mapa são desenhados
pelo layout do Directus, dentro do MapLibre dele, e **a instância é privada**
(está documentado em `map-centerer.ts` e em `current-point.ts`). Não há como
rotacionar os marcadores deles. O que é nosso é o overlay HTML sobre o painel —
o círculo de 22px do registro atual — e é nele que a seta cabe. Seta em **todos**
os marcadores depende da task-011.

Duas origens de rumo, as duas nesta task (decisão do Sidarta):

1. **campo** — graus, norte = 0, sentido horário. É o que rastreadores GPS
   emitem como `course`/`heading`;
2. **calculado** — entre o registro anterior e o atual, sem exigir campo nenhum
   no schema.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [ ] `headingSource: 'off' | 'field' | 'computed'` e `headingField` em
      `src/contract/layout-options.contract.ts`, com policy
      `from(value: unknown)` no molde de `src/services/camera-tracking/`
- [ ] `src/services/record-heading/` — azimute geodésico (aritmética pura) e
      `fromField`, **normalizando negativos** com `((a % 360) + 360) % 360`
- [ ] `src/services/field-values/` — carrega o campo de rumo por
      `fetchItems(ids, [pk, field])`, com cache por página; **sem** tocar em
      `layoutQuery.fields`
- [ ] Rotação da seta pelo **ângulo de tela** entre os dois pontos projetados —
      ver "O ângulo certo é o de tela"
- [ ] `src/components/molecules/current-mark/` — círculo de hoje + cone em SVG
      rotacionado, preservando `data-current-point` e expondo
      `data-heading-degrees`
- [ ] Seção no painel de opções (`MapgridOptions.vue`) com o seletor de origem e,
      só em `field`, o seletor de campo numérico; rótulos en-US/pt-BR em
      `src/shared/messages.ts`
- [ ] Semente do e2e ganha campo numérico de curso, **com pelo menos um valor
      negativo** (`tests/helper-collection.ts`)
- [ ] e2e `tests/e2e/mapgrid-heading.spec.ts`: `field` com o grau semeado,
      `computed` entre duas cidades (±1°), e o negativo normalizado
- [ ] Evidência de tela, antes e depois (`EVIDENCE_TASK=019 pnpm screenshot`)
- [ ] `pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm build`, `pnpm test:e2e`

## Notes

### O ângulo certo é o de tela, não o azimute
Vem do estudo do `ceturb/mobi-gv`, feito a pedido do Sidarta. Lá as setas de
sentido saem do `leaflet-polylinedecorator` (`MapaLeaflet.vue:450-472`), que
calcula o ângulo entre dois vértices **já projetados** — e o plugin não serve
aqui, porque depende da instância do Leaflet.

A lição serve: para **desenhar**, o certo é `atan2` sobre a saída do
`screenPointOf` (task-018), que já traz a rotação da câmera e a distorção de
Mercator embutidas — sem desconto manual de `bearing`. O azimute geodésico fica
para **exibir o número** ("rumo 137°") e para interpretar o campo do dado.

Com origem `field`, o valor é geográfico e aí sim precisa descontar
`cameraOptions.bearing`.

### O campo pode vir negativo
Medido no `mobi-gv`: o tipo declara 0-360 horário a partir do Norte
(`Mapa.types.ts:59-74`, que é a melhor especificação escrita de rumo que achei),
e a API real entrega `direcao: -137`. Normalizar é obrigatório, e por isso a
semente do e2e leva um negativo.

### Sem rumo, sem seta
Primeiro registro da sequência, campo nulo ou ilegível, dois pontos coincidentes.
**Não** repetir o último rumo conhecido: uma seta errada é pior que seta nenhuma.

### Legibilidade
Receita copiada do `mobi-gv` (`MapaLeaflet.vue:461-462`): contorno branco e
preenchimento na cor do tema, com `paint-order: stroke fill`. É o que faz a seta
ler sobre basemap claro e escuro.

### O que fica para a task-011
Seta como `symbol` real com `icon-rotate` e `icon-rotation-alignment: 'map'`
(acompanha rotação e inclinação de graça), atualização a cada quadro em vez de
só no `moveend`, e o fim do sumiço da marca durante o voo da câmera.

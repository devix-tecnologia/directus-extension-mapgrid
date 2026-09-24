# 🧩 Task 011 — O MapGrid aceita qualquer mapa atrás de um contrato próprio

- Status: pending
- Type: feat
- Assignee: sidartaveloso

## Description

O MapGrid hoje compõe o layout de mapa do Directus. A direção (Sidarta,
2026-09-24) é poder usar **qualquer mapa**: o do Directus, o 3dmap do geohub
(`packages/directus-extension-3dmap`) e outros. O MapGrid é o dono da experiência —
grade e mapa sincronizados, navegação, reprodução, a `MapToolbar` — e o mapa
vira peça trocável atrás de um contrato do MapGrid, com uma implementação por
mapa.

**Não é para agora.** Esta task registra a direção e a análise, para que o que
for feito antes (task-006, task-007, Fase 3 da task-010) não feche a porta.

## O que já existe no MapGrid

A semente do contrato: `ICentralizadorDeMapa`
(`src/services/centralizador-de-mapa/`), com uma operação (`centralizar`) e uma
implementação (`CentralizadorDoMapaDirectus`, o contorno da limitação do mapa do
Directus). A decisão da `MapToolbar` na task-010 acrescenta a segunda operação
prevista, `enquadrarTudo`, e a primeira capacidade ("este mapa já tem o controle
nativo?").

## O que o geohub tem — analisado em 2026-09-24

**Não há abstração neutra de mapa no geohub.** Nenhum contrato põe MapLibre,
motor 3D, Google e os óculos Rokid atrás de uma API. O mais próximo:

- **O padrão `MapProvider` / `BaseMapWrapper`**, em duas cópias quase idênticas:
  `packages/geohub-directus-panels/src/panels/core/` e
  `packages/directus-extension-3dmap/src/shared/` (a do 3dmap é a mais completa;
  os `types/map.ts` diferem só por um `declare global` do Google).
  - `MapProvider = 'leaflet' | 'google' | 'maplibre'`, `MapInstance` como união
    das instâncias nativas, com type guards (`isMapLibreMap` etc.), e
    `MapConfig { provider, center, zoom, minZoom, maxZoom }`.
  - O contrato é um **componente Vue**, não uma interface: `BaseMapWrapper.vue`
    recebe `provider` e `config`, emite `*-ready(instância nativa)` e
    `viewport-changed({ bounds, zoom })`, e entrega a **instância nativa** por
    slot às camadas.
  - Implementações: `LeafletMap.vue`, `MapLibreMap.vue` (o "3D", com pitch) e
    `GoogleMap.vue` (depreciado).
  - Camadas por provider (`HeatmapLayer`, `DeckGL*Layer`) desenhando direto na
    instância nativa.
  - **Não há API de câmera**: o único controle é observar `config.center`, que
    vira `jumpTo` no MapLibre (`MapLibreMap.vue:153`). Sem `flyTo`, `fitBounds`,
    evento de clique ou seleção, nem declaração de capacidade.
  - `center` é `[lat, lng]`, enquanto os dados chegam como GeoJSON `[lng, lat]`
    — duas ordens no mesmo pacote.
  - Documento de desenho: `packages/geohub-directus-panels/map-implemetnation.md`
    (nome como está), já desatualizado em relação ao código.
- **`packages/drf-app/src/components/map/dispatch-map.types.ts`**: o modelo mais
  rico de camadas e de clique (`LayerConfigItem` discriminado, `LayerClickData`
  como union discriminada), mas específico daquele app.
- `packages/ui` tem um `LeafletMap` e um `hexagon-map` avulsos, sem contrato
  comum. Nenhum RDT do geohub trata de mapas.

**O que aproveitar:** a ideia de provider como união discriminada, o evento de
viewport com `bounds` e `zoom`, e o modelo de clique do `dispatch-map`.
**O que não repetir:** entregar a instância nativa a quem consome (isso prende o
consumidor à biblioteca, que é justamente o que o contrato existe para evitar),
contrato como componente em vez de interface, e duas ordens de coordenada.

## Direção proposta

- O contrato é uma **interface TypeScript**, sem Vue e sem Directus, com dados em
  GeoJSON (`[lng, lat]`, uma ordem só).
- Operações que o MapGrid já precisa ou vai precisar: `centralizar`,
  `enquadrarTudo`, evento de clique num item, evento de câmera (o `moveend`);
  depois, o que a task-006 pedir (acompanhamento da câmera).
- **Capacidades declaradas** pela implementação, para o MapGrid decidir o que
  mostrar — a primeira é "já tem controle nativo de reenquadrar".
- Uma implementação por mapa: Directus (hoje, `CentralizadorDoMapaDirectus` e
  vizinhos), 3dmap, os que vierem. Nomes de coisa do MapGrid não levam
  "Directus"; só a implementação leva.

## Decisões em aberto

- **Onde o contrato mora.** No MapGrid, ou num pacote do geohub que o 3dmap e os
  painéis também implementem? O geohub está sendo remodelado com contrato por
  plugin e implementação por host; um contrato de mapa compartilhado seguiria
  esse padrão, mas o MapGrid é repositório separado e hoje não depende do
  geohub.
- **Unificar as duas cópias do `BaseMapWrapper`** no geohub, que é defeito à
  parte e pode vir antes.
- Se as camadas (heatmap, hexágonos) entram no contrato ou ficam por
  implementação.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [x] Analisar a abstração de mapa do geohub (acima)
- [ ] Decidir onde o contrato mora (MapGrid ou pacote do geohub)
- [ ] Desenhar a interface a partir do `ICentralizadorDeMapa`, com as operações e
      capacidades que o MapGrid usa hoje
- [ ] Mover o "reenquadrar" e o clique no ponto do MapGrid para trás do contrato,
      mantendo o Directus como única implementação
- [ ] Segunda implementação (3dmap), que é a prova de que o contrato serve

## Notes
- A decisão da `MapToolbar` que originou esta task está na task-010, seção
  "A `MapToolbar` é do MapGrid".
- O `taskin new` que criou esta task rebaseou a branch corrente sobre o
  `origin/develop` antes de comitar, achatando os merge commits; o histórico foi
  restaurado à mão.

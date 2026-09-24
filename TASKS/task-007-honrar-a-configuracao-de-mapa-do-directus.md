# Task 007 — Honrar a configuração de mapa do Directus

Status: done
Type: feat
Assignee: sidartaveloso
Difficulty: 2
Priority: 40

## Description

O MapGrid precisa mostrar o mapa que o administrador configurou em Project
Settings → Map, com os basemaps do projeto e a chave do Mapbox, como faz todo
mapa nativo do app. Uma instalação com imagem de satélite ou tiles corporativos
não pode ver o mapa de rua padrão só no MapGrid.

## O que mudou desde que esta task foi escrita

A versão original partia de um mapa **nosso**: um `MapComponent` sobre MapLibre,
com tiles do OpenStreetMap escritos no código. O plano era ler o settings store
por `useStores()`, portar a conversão de basemap em estilo do MapLibre
(`getBasemapSources` e `getStyleFromBasemapSource`, internos do app) e estender
`parsePointCoordinates` para outras geometrias.

A [task-010](task-010-o-mapgrid-compoe-os-layouts-do-directus.md) trocou esse
mapa pelo **layout de mapa do próprio Directus**, composto dentro do MapGrid. O
`MapComponent`, o `parsePointCoordinates` e a fonte de tiles fixa saíram. Com
isso, quase tudo o que esta task pretendia construir vem pronto do layout deles.
O que sobra é **provar** que vem, e fechar os furos que a composição abriu.

## O que o layout de mapa do Directus já faz

Conferido na fonte do Directus 10.13.1 (`app/src/layouts/map/`), a versão que o
e2e roda:

| Assunto | Onde mora | Consequência para o MapGrid |
| --- | --- | --- |
| Basemap escolhido | `useAppStore().basemap` — por usuário, no app, **não no preset** | É a mesma escolha de todos os mapas do app. Não há o que gravar no nosso preset |
| Lista de basemaps | `getBasemapSources()` — Project Settings + `mapbox_key` | Vem pronta. A "Fase 2" original (escolher entre basemaps) já está no painel deles |
| Campo de geometria, template, câmera, agrupamento | `layoutOptions` do layout: `geometryField`, `displayTemplate`, `cameraOptions`, `clusterData` | No MapGrid ficam em `layoutOptions.map`, separados da grade |
| Tipos de geometria | Todo o GeoJSON, inclusive `Multi*` e `GeometryCollection` | A "Fase 3" original (geometrias além do ponto) já está resolvida no desenho |
| Agrupamento | Desabilitado quando `geometryType !== 'Point'` | Comportamento deles, não precisamos decidir |
| `fitDataBounds` | Com geometria `native`, só marca `shouldUpdateCamera` e o enquadramento acontece na **próxima busca**; nos outros formatos, usa o bbox do GeoJSON na hora | O reenquadrar da nossa `MapToolbar` (`enquadrarTudo` do centralizador, que chama o `fitDataBounds`) pode não fazer nada visível até a lista recarregar |

## O que ainda é nosso, e está incompleto

**O clique na linha já entende qualquer geometria.** Resolvido na task-010 pelo
`CentralizadorDoMapaDirectus`: ponto é centralizado, `LineString`, `Polygon` e
`Multi*` são enquadrados pelo bbox, e geometria que não se lê não mexe na
câmera. Revisado em 2026-09-24.

**O clique na linha só entende formato nativo.** Ele lê
`item[geometryField].coordinates`, que é a forma do GeoJSON nativo. O layout
deles aceita também campo `json`, `csv` e `lnglat`, e para esses a leitura
direta não serve.

## Tasks

### Fase 1: provar que a configuração do projeto chega
- [x] e2e contra um Directus com um basemap configurado em Project Settings
      (além do padrão), conferindo que o mapa do MapGrid oferece e usa esse
      basemap — `tests/e2e/mapgrid-basemap.spec.ts`, com os tiles servidos por
      um host que o teste intercepta
- [x] e2e trocando o basemap pelo painel do MapGrid e conferindo que outro mapa
      do app (o layout de mapa puro da mesma coleção) passa a usar o mesmo, o
      que prova que a escolha é a do app e não uma cópia nossa. Provado pela
      atribuição, e não pela contagem de tiles: o segundo mapa os tira do cache
- [x] Conferir se a atribuição do basemap aparece no canto do mapa, que é
      exigência de licença da maioria dos provedores. Aparece
- [ ] Reenquadrar e clique numa linha fora da tela com geometria nativa — adiado: a entrega depois da busca não chega ao mapa do Directus, ver "Geometria nativa", abaixo
      Medido: não enquadra. A busca da geometria pela chave já existe e está
      testada; os dois e2e estão em `test.fixme` em `mapgrid-trajetos.spec.ts`

### Fase 2: o clique na linha para qualquer geometria
- [x] Extrair o cálculo de "para onde a câmera vai" do `enquadrarItem` para um
      módulo puro em `src/services/`, testado antes da implementação — é o
      `CentralizadorDoMapaDirectus` (task-010)
- [x] `Point` enquadra no ponto, como hoje; `LineString`, `Polygon` e `Multi*`
      enquadram no **bbox** da geometria, e não no primeiro vértice (task-010)
- [x] Item sem geometria, ou com geometria que não se lê, não mexe na câmera,
      em vez de mandar `NaN` para o mapa deles (task-010)
- [x] Decidir o que fazer com campo `json`, `csv` e `lnglat`: reaproveitar a
      conversão para GeoJSON que o layout deles faz, ou restringir o clique ao
      formato nativo e dizer isso no README. Decidido: reaproveitar. O
      `centralizarItem` acha a feature do item no `geojson` do layout pela
      `featureId` e enquadra pela geometria já convertida

### Fase 3: verificação e documentação
- [x] e2e com uma coleção de `LineString`: o trajeto aparece no mapa e o clique
      na linha enquadra o trajeto inteiro — com geometria nativa do PostGIS
- [x] Refazer a captura do README se o basemap do ambiente de teste mudar. Não
      mudou: o basemap de teste é configurado e removido pelo próprio e2e
- [x] Documentar nos dois idiomas que o basemap vem do Project Settings e é
      escolhido por usuário, para quem vir uma tela diferente da do README
      entender por quê. O README diz "escolha do app", que é o que o e2e prova

## Geometria nativa — medido em 2026-09-24

Com campo de geometria nativa (PostGIS), o layout de mapa do Directus filtra a
busca pela área visível (`_intersects_bbox` sobre `cameraOptions.bbox`). O
`geojson` dele só tem o que está na tela, e a grade só traz as colunas à vista
— sem a coluna da geometria, os itens da grade chegam sem ela. Por isso o
centralizador busca a geometria na API pela chave primária quando falta
(`FonteDaColecao.buscarItens`), com a resposta de um pedido antigo descartada.
Isso está testado e a busca responde certo no e2e.

O que não funciona: **depois de o centralizador mover o mapa uma vez**, a
entrega da busca chega ao estado do layout embutido (`geojsonBounds` com o
retângulo novo), mas o componente de mapa do Directus continua recebendo o
`bounds` anterior — o `MapgridLayout` não volta a renderizar. Descartado, cada
um por medição: página travada, reatividade síncrona e agendador do Vue (duas
sondas), duas instâncias do layout, estado diferente do desenhado, insistência
presa, momento da entrega (esperar 5 s não muda). Num caso o mesmo caminho
**funcionou**: afastando o mapa pelo botão "−" do Directus antes do clique.

Achados do caminho, que valem para quem retomar:

- o Directus lê `cameraOptions.bbox` sem conferir; um preset com câmera sem
  `bbox` derruba o layout quando a geometria é nativa;
- há um `SyntaxError` do `vue-i18n` a cada busca filtrada; não vem das nossas
  mensagens.

## Notes

A task-010 está integrada, e o que a task-006 esperava da Fase 2 daqui (bbox
para trajeto em `LineString`) veio com ela. O que sobra da Fase 2 é o formato do
campo (`json`, `csv`, `lnglat`), que não bloqueia a task-006 quando o campo é
nativo.

As opções antigas (`mapCenterLng`, `mapCenterLat`, `mapZoom`, `title`,
`geolocation`) saíram do `LayoutOptions` na Fase 3 da task-010.

O basemap é da implementação de mapa, não do MapGrid: na direção da
[task-011](task-011-o-mapgrid-aceita-qualquer-mapa-atras-de-um-contrato-proprio.md),
cada mapa honra a configuração do seu jeito, e esta task prova o do Directus.

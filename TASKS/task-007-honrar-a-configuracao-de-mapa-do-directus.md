# Task 007 — Honrar a configuração de mapa do Directus

Status: pending
Type: feat
Assignee: A definir
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
| `fitDataBounds` | Com geometria `native`, só marca `shouldUpdateCamera` e o enquadramento acontece na **próxima busca**; nos outros formatos, usa o bbox do GeoJSON na hora | O botão de reenquadrar da nossa `MapToolbar` pode não fazer nada visível até a lista recarregar |

## O que ainda é nosso, e está incompleto

**O clique na linha só entende ponto.** O `enquadrarItem` de
`MapgridLayout.vue` lê `geometria.coordinates[0]` e `[1]` como longitude e
latitude. Isso vale para um `Point`. Num `LineString` ou `Polygon`, o primeiro
elemento já é um par ou uma lista de pares, e o `Number()` devolve `NaN`: o
clique na linha empurra uma câmera inválida para o mapa deles. O caso é
justamente o do rastreamento veicular da task-006, em que um trajeto é
naturalmente um `LineString`.

**O clique na linha também só entende formato nativo.** Ele lê
`item[geometryField].coordinates`, que é a forma do GeoJSON nativo. O layout
deles aceita também campo `json`, `csv` e `lnglat`, e para esses a leitura
direta não serve.

## Tasks

### Fase 1: provar que a configuração do projeto chega
- [ ] e2e contra um Directus com um basemap configurado em Project Settings
      (além do padrão), conferindo que o mapa do MapGrid oferece e usa esse
      basemap
- [ ] e2e trocando o basemap pelo painel do MapGrid e conferindo que outro mapa
      do app (o layout de mapa puro da mesma coleção) passa a usar o mesmo, o
      que prova que a escolha é a do app e não uma cópia nossa
- [ ] Conferir se a atribuição do basemap aparece no canto do mapa, que é
      exigência de licença da maioria dos provedores
- [ ] Conferir se o botão de reenquadrar da `MapToolbar` enquadra na hora com
      geometria nativa, já que o `fitDataBounds` deles só marca o pedido para a
      próxima busca; se não enquadrar, disparar a busca ou calcular o bbox aqui

### Fase 2: o clique na linha para qualquer geometria
- [ ] Extrair o cálculo de "para onde a câmera vai" do `enquadrarItem` para um
      módulo puro em `src/services/`, testado antes da implementação
- [ ] `Point` enquadra no ponto, como hoje; `LineString`, `Polygon` e `Multi*`
      enquadram no **bbox** da geometria, e não no primeiro vértice
- [ ] Item sem geometria, ou com geometria que não se lê, não mexe na câmera,
      em vez de mandar `NaN` para o mapa deles
- [ ] Decidir o que fazer com campo `json`, `csv` e `lnglat`: reaproveitar a
      conversão para GeoJSON que o layout deles faz, ou restringir o clique ao
      formato nativo e dizer isso no README

### Fase 3: verificação e documentação
- [ ] e2e com uma coleção de `LineString`: o trajeto aparece no mapa e o clique
      na linha enquadra o trajeto inteiro
- [ ] Refazer a captura do README se o basemap do ambiente de teste mudar
- [ ] Documentar nos dois idiomas que o basemap vem do Project Settings e é
      escolhido por usuário, para quem vir uma tela diferente da do README
      entender por quê

## Notes

Esta task depende do que a task-010 entregar: ela é feita sobre a composição,
não sobre o mapa antigo. A Fase 2 é pré-requisito da task-006 se o rastreamento
for representado por `LineString`.

As opções `mapCenterLng`, `mapCenterLat`, `mapZoom`, `title` e `geolocation`
ainda estão declaradas em `src/contract/layout-options.contract.ts`, mas o mapa
deles usa `cameraOptions`, `displayTemplate` e `geometryField`. Decidir o que
fazer com as nossas é da Fase 3 da task-010 ("o que sai"), não desta.

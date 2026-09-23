# Task 007 — Honrar a configuração de mapa do Directus

Status: pending
Type: feat
Assignee: A definir
Difficulty: 4
Priority: 10

## Description

O mapa da extensão desenha em cima de tiles do OpenStreetMap escritos no código.
O Directus deixa o administrador configurar os basemaps do projeto em Project
Settings → Map, e todo mapa nativo do app respeita essa escolha. O nosso não.

Na prática: uma instalação que configurou imagem de satélite, tiles corporativos
ou uma chave do Mapbox vê essa configuração em toda parte, menos no MapGrid —
que continua mostrando o mapa de rua padrão. Esta task fecha essa diferença.

## O que dá para reaproveitar, e o que não dá

Levantado na fonte aberta antes de escrever a task.

**Não existe componente de mapa registrado globalmente.** A lista de
`app/src/components/register.ts` traz `VTable`, `VFieldList`, `DrawerCollection`
e dezenas de outros, mas nenhum mapa. O mapa do Directus vive dentro do layout e
da interface de mapa, não como componente compartilhado. Então "usar o
componente nativo" não pode ser literal: não há o que importar.

**A configuração, essa sim, é alcançável.** `app/src/utils/geometry/basemap.ts`
tem `getBasemapSources()`, que lê `useSettingsStore()` — `settings.mapbox_key` e
`settings.basemaps` — e `getStyleFromBasemapSource()`, que converte um basemap em
`StyleSpecification` do MapLibre. Esse arquivo é interno do app e não é exportado
para extensões, mas a fonte do dado é pública: `useStores()` do
`@directus/extensions-sdk` entrega o settings store, e a conversão em si é
pequena (fonte raster, camada, e a expansão de `{a-c}` na URL do tile).

Ou seja, o caminho é ler a mesma configuração e portar a conversão, não importar
o componente.

**Segunda diferença: geometria.** `parsePointCoordinates` aceita só `Point` e
descarta o resto. O mapa nativo trabalha com o conjunto do GeoJSON. Para o caso
de rastreamento da task-006, um trajeto é naturalmente um `LineString` — hoje
uma coleção assim aparece vazia no mapa, sem explicação. Confirmar contra a fonte
quais tipos a interface de mapa oferece antes de decidir o escopo.

## Tasks

### Fase 1: basemap vindo das configurações
- [ ] Ler `mapbox_key` e `basemaps` pelo settings store, via `useStores()`
- [ ] Portar a conversão de basemap em estilo do MapLibre, incluindo a expansão
      de `{a-c}` e `{0-2}` nas URLs de tile
- [ ] Manter o OpenStreetMap como queda, para instalação sem nada configurado
- [ ] Preservar a atribuição do basemap escolhido, que é exigência de licença da
      maioria dos provedores
- [ ] Módulo puro e testado: configuração entra, `StyleSpecification` sai

### Fase 2: escolher entre os basemaps disponíveis
- [ ] Quando o projeto tiver mais de um basemap, deixar escolher nas opções do
      layout, guardando a escolha no preset
- [ ] Cair no primeiro disponível quando o basemap gravado não existir mais,
      em vez de abrir um mapa em branco

### Fase 3: geometrias além do ponto
- [ ] Confirmar na fonte quais tipos o mapa nativo aceita
- [ ] Estender `parsePointCoordinates` para o que for decidido, sem afrouxar o
      parse: hoje ele recusa geometria que não é ponto de propósito
- [ ] Definir o que a grade e o balão mostram para uma geometria que não é ponto
- [ ] Definir o comportamento do agrupamento, que só faz sentido para pontos

### Fase 4: verificação
- [ ] Stories com `play` cobrindo: sem configuração, um basemap, vários basemaps,
      e basemap gravado que sumiu
- [ ] Mock do settings store no `directus-mocks`, junto dos outros
- [ ] `pnpm check:stories` limpo
- [ ] e2e contra um Directus com basemap configurado em Project Settings
- [ ] Refazer `docs/tela.jpg`: o basemap é o fundo da tela inteira, então
      qualquer mudança aqui invalida a captura por completo
- [ ] Documentar nos dois idiomas que o basemap vem do Project Settings, para
      quem vir uma tela diferente da do README entender por quê

## Notes

Vale fazer antes da task-006: se o rastreamento veicular for representado por
`LineString`, a Fase 3 é pré-requisito, e não melhoria posterior.

O mapa hoje monta o estilo uma vez em `initializeMap`. Trocar de basemap sem
recriar o mapa é `map.setStyle()`, que descarta fontes e camadas próprias — a
fonte de pontos e as duas camadas precisam ser registradas de novo depois, ou os
marcadores somem ao trocar.

# 🧩 Task 023 — Spike: o bbox do layout de mapa zera a pagina compartilhada?

- Status: pending
- Type: fix
- Assignee: A definir
- Priority: 870
- Group: g-yezqk9i5
- GroupName: Movimento no mapa
- Difficulty: 1

## Description
Achado do planejamento da task-024, lendo o bundle do Directus 10.13.1 que o e2e
roda: **o layout de mapa do Directus já monta um `_intersects_bbox` da vista**
quando a geometria é nativa, e o `useItems` dele **zera `page = 1` sempre que o
filtro muda**.

```js
// app/dist/assets/index.*.entry.js — setup() do layout `map`
const bboxFilter = computed(() => {
  if (!isGeometryFieldNative.value || !cameraOptions.value || !geometryField.value) return null;
  const b = cameraOptions.value.bbox;
  ...
});
// e, no watcher de useItems:
if ((filter changed || sort changed || limit changed || search changed) && hadCollection) page.value = 1;
```

Se esse `page` for o **compartilhado** da composição, então **hoje já existe
defeito**: numa coleção com geometria nativa, arrastar o mapa joga a grade para
a página 1 no meio de uma navegação ou de uma reprodução.

Nunca tropeçamos nisso porque **todas as sementes do e2e usam `json` de
propósito** — está escrito em `tests/helpers/track-collection.ts`: "o mapa
adiciona um filtro pela área visível, e a contagem seria outra".

Meia hora de medição decide se a task-024 é "compor um filtro" ou "compor um
filtro e domar um reset de página".

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [ ] Semente com campo `geometry.Point` de verdade (o stack do e2e já é PostGIS)
- [ ] Medir: ir para a página 3, arrastar o mapa, ver se a paginação volta para 1
- [ ] Medir também durante a reprodução: o `queryKey` muda? a reprodução para?
- [ ] Registrar o resultado aqui, com o passo a passo para repetir
- [ ] Se houver defeito: decidir entre consertar nesta task ou abrir uma própria,
      e dizer por quê
- [ ] e2e de regressão, se o defeito existir

## Notes

### Por que isso é spike e não conserto
Porque o conserto plausível é feio — guardar a página pretendida e restaurá-la
quando o reset vier de um movimento de câmera nosso — e não vale escrever antes
de saber se o problema existe. Medir primeiro é o que este repositório já faz
(ver task-009, que fechou como erro de medição, e task-016, que mediu antes e
depois).

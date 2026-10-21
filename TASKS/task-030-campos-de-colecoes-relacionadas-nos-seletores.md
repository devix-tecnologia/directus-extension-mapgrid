# 🧩 Task 030 — Campos de coleções relacionadas em todos os seletores

- Status: in-progress
- Type: feat
- Assignee: sidartaveloso
- Priority: 940

## Description
Pedido do Sidarta: todo seletor de campo das opções do MapGrid (imagem do card,
campos do card, data, rumo, rótulo etc.) oferece também campos alcançáveis por
relação muitos-para-um, não só os da própria coleção — por exemplo, a foto do
card vinda de `smartphone.icon`.

Hoje o seletor da imagem só lista arquivos da própria coleção, e o card lê o
valor direto no registro (`item[campo]`), sem seguir o caminho com ponto.

Para provar, coleções de teste no molde do geohub, com campos em inglês:
`test_mapgrid_smartphones` (`brand`, `model`, `icon`) e
`test_mapgrid_smartphone_tracking` (`smartphone` → smartphones, `location`
`geometry.Point`, `tracked_at`, `battery_percent`, `speed_kmh`, `accuracy_m`).

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [x] Coleções de teste de smartphone (`tests/helpers/smartphone-collection.ts`),
      com ícones em SVG e um percurso por aparelho, em `geometry.Point`
- [x] `src/services/field-catalog/`: os campos da coleção e, uma relação
      muitos-para-um adiante, os da relacionada, por caminho e com o rótulo
      `Smartphone → Icon`; vem dos stores de campos e relações do app
- [x] `src/services/field-path/`: valor num caminho com ponto e filtro aninhado
- [x] Os quatro seletores (data da reprodução, rumo, imagem e campos do card)
      usam o catálogo
- [x] Card, imagem, data e rumo leem pelo caminho; o início e o fim da linha do
      tempo, por um campo relacionado, vêm de consultas ordenadas (o Directus
      não agrega através de relação) e os filtros vão aninhados
- [x] e2e `tests/e2e/mapgrid-related-fields.spec.ts` no Directus 11: grade com a
      marca e o modelo, card com o ícone, seletor com `Smartphone → Icon`
- [ ] A coleção entra na demonstração

### Evidência
`EVIDENCE_TASK=030`, `tests/screenshot/evidence-related.spec.ts`, no Directus
11.17.4. O "antes" é o mesmo spec contra o build do `develop` em `f8ea0b5`.

| Antes | Depois |
|---|---|
| ![card antes](assets/task-030-icone-do-aparelho-no-card-antes.jpg) | ![card depois](assets/task-030-icone-do-aparelho-no-card-depois.jpg) |
| ![seletor antes](assets/task-030-seletor-com-campo-relacionado-antes.jpg) | ![seletor depois](assets/task-030-seletor-com-campo-relacionado-depois.jpg) |

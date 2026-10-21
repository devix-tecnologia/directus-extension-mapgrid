# 🧩 Task 030 — Campos de coleções relacionadas em todos os seletores

- Status: pending
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
- [ ] Coleções de teste de smartphone, com ícones e um percurso por aparelho
- [ ] Os seletores listam campos relacionados (`smartphone → icon`)
- [ ] O MapGrid lê e pede ao Directus os caminhos com ponto (card, data, rumo…)
- [ ] e2e: o card mostra o ícone do aparelho
- [ ] A coleção entra na demonstração

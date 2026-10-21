# 🧩 Task 018 — A projecao do ponto atual vira servico, e o caminho visitado e lembrado

- Status: pending
- Type: refactor
- Assignee: A definir
- Priority: 820
- Group: g-yezqk9i5
- GroupName: Movimento no mapa
- Difficulty: 2

## Description
Fundação das tasks 019 (direção) e 020 (rastro). **Refator puro: nada muda na
tela**, e é isso que torna esta task barata de revisar.

Duas coisas que hoje estão privadas dentro do `DirectusCurrentPoint` viram
públicas, porque as duas próximas precisam delas: ler a geometria de um item e
projetar uma coordenada em pixels do painel. E o caminho já percorrido passa a
ser lembrado, porque nem a seta nem o rastro conseguem se virar só com a página
carregada.

A cópia que motiva a extração já existe: `pointsOf` está escrito duas vezes, em
`src/services/current-point/current-point.ts` e em
`src/services/map-centerer/map-centerer.ts`. A terceira chegaria com a 020.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [ ] Extrair `src/services/item-geometry/` (`IItemGeometry` com `centreOf` e
      `pointsOf`), movendo de `current-point.ts` sem mudança de comportamento —
      os testes atuais de `current-point.test.ts` são a rede
- [ ] Apontar `map-centerer.ts` para o serviço novo, apagando a cópia de lá
- [ ] `ICurrentPoint` ganha `screenPointOfCoordinate(coordinate)` — a mesma
      projeção para uma coordenada solta; `screenPointOf(item)` passa a ser
      `screenPointOfCoordinate(itemGeometry.centreOf(item))`
- [ ] Desembrulhar a longitude em relação ao centro da câmera (somar/subtrair
      360 até ficar a menos de 180° do centro) — ver "O antimeridiano"
- [ ] `src/services/visited-path/` — `VisitedPath` com `visit`, `points(limit)`,
      `last()`, `clear()`, capacidade e dedupe de id consecutivo
- [ ] Gravar em `VisitedPath` dentro do `focus()` de `MapgridLayout.vue`, e
      limpar no `watch(queryKey)` que já zera o registro atual
- [ ] `pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm build` verdes

## Notes

### O antimeridiano
Hoje um ponto do outro lado do antimeridiano projeta no mundo errado. Com um
ponto só isso é um marcador fora de lugar, que quase ninguém vê; num rastro
vira um traço atravessando a tela inteira, que todo mundo vê. Consertar aqui é
mais barato que consertar na 020.

### VisitedPath é alimentado sempre
Mesmo com o rastro desligado. Ele é também a origem do "registro anterior" da
task-019 quando o atual é o primeiro da página — e, durante a reprodução, é o
predecessor real, inclusive atravessando a virada de página.

### Evidência
Não há. Nada do que é desenhado muda; a prova desta task são os testes que já
existem continuarem verdes depois da mudança.

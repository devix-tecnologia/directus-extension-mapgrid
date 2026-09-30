# 🧩 Task 024 — Buscar nesta area

- Status: pending
- Type: feat
- Assignee: A definir
- Priority: 880
- Group: g-yezqk9i5
- GroupName: Movimento no mapa
- Difficulty: 3

## Description
O gesto que todo aplicativo de mapa tem: mover o mapa e pedir **"buscar nesta
área"**, restringindo a consulta ao que está na vista. Para quem usa o Directus
com dados geográficos, é a diferença entre um mapa que mostra e um mapa que
serve para procurar.

O Directus tem o operador `_intersects_bbox`, e o próprio layout de mapa já o usa
internamente para si — o que dá o formato pronto para copiar e a garantia de que
o servidor entende. Ver a task-023, que mede o efeito colateral disso na
paginação **antes** desta task começar.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [ ] `areaSearch: 'off' | 'manual' | 'automatic'` (padrão `manual`) no contrato,
      com policy `from(value: unknown)`
- [ ] `src/services/viewport-filter/` — o polígono do bbox e a composição
      `{_and: [filtroDoUsuário, área]}`, com teste de que o filtro do usuário
      **nunca** se perde
- [ ] `src/services/area-search/` — limiar do "a vista mudou o bastante" (nada de
      `!==`, senão o botão pisca a cada 2 px de pan) e leitura do bbox da câmera
- [ ] `src/services/camera-move-origin/` — movimento nosso não arma o botão nem
      dispara o automático; ver "Como o laço é quebrado"
- [ ] O filtro entra em `propsFor()` de `src/index.ts`, e o `queryKey` passa a
      incluir a área aplicada — **na mesma alteração**, senão o registro atual
      sobrevive a uma consulta que não o contém mais
- [ ] Botão-pílula no topo do painel do mapa, e um chip de "área aplicada" com
      como limpar — ver "O beco sem saída"
- [ ] Geometria não nativa: funcionalidade **indisponível**, com a explicação no
      painel — ver "Indisponível, não degradada"
- [ ] Semente com `geometry.Point` (a mesma da task-023) e e2e: contagem cai,
      a requisição leva `_intersects_bbox`, o filtro do usuário sobrevive, e na
      coleção `json` o botão não existe
- [ ] `pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm build`, `pnpm test:e2e`

## Notes

### Manual, e o automático desligado por padrão
Quatro razões, todas medidas:

1. mudar o filtro **zera a página** (`useItems` do Directus);
2. mudar o filtro muda o `queryKey`, que hoje **para a reprodução** e limpa o
   registro atual (`MapgridLayout.vue`);
3. a câmera **se move sozinha** durante a reprodução, por causa do
   `cameraTracking` — automático realimentaria a própria navegação;
4. o Directus já faz **debounce de 500 ms**; automático não fica barato, fica
   atrasado *e* caro.

### Como o laço é quebrado
Filtrar pela vista muda os dados, que poderiam mudar o enquadramento, que mudaria
a vista. Três travas: (a) movimento nosso é conhecido — `centerer` devolve
`true` e `awaitCamera()` já marca `cameraSettled`; (b) depois do primeiro
`moveend`, dados novos não movem a câmera do layout de mapa (verificado no
bundle); (c) a área aplicada só muda por ato explícito, nunca por chegada de
dados.

### Indisponível, não degradada
`_intersects_bbox` é SQL espacial e exige coluna `geometry` de verdade. Com
geometria em `json`, filtrar no cliente **seria mentira**: `itemCount`,
`totalPages` e a paginação vêm do servidor sem o filtro. Então o botão não é
renderizado e o painel explica por quê.

### O beco sem saída
Aplicar área sobre o oceano devolve zero itens, e um preset com área velha vira
"a coleção está vazia" sem causa visível. O chip de "área aplicada", com o
limpar ao lado, é o que evita isso — e é por isso que, na v1, **a área fica só
em memória**: a câmera já é persistida pelo próprio layout de mapa, então voltar
à vista e clicar uma vez reconstrói.

### Desempenho
`_intersects_bbox` sem índice GiST na coluna é varredura completa. Vale um aviso
no README.

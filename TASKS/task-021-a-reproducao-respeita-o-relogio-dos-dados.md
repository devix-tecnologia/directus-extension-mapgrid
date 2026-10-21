# 🧩 Task 021 — A reproducao respeita o relogio dos dados

- Status: pending
- Type: feat
- Assignee: A definir
- Priority: 850
- Group: g-yezqk9i5
- GroupName: Movimento no mapa
- Difficulty: 3

## Description
Hoje a reprodução é um beat fixo em segundos: todo registro espera o mesmo
tanto. Para dados de rastreamento isso desmente o dado — dois pontos separados
por 15 s e dois separados por 10 minutos aparecem no mesmo ritmo.

A reprodução passa a poder respeitar o **tempo real entre os registros**, com um
multiplicador de velocidade (1×, 2×, 10×, 60×…). Um trajeto de uma hora cabe num
minuto, e a irregularidade do trajeto — o ônibus parado no ponto — aparece.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [ ] `playbackTiming: 'fixed' | 'realtime'` (padrão `fixed`), `playbackSpeed` e
      `playbackTimeField` no contrato, com policy `from(value: unknown)`
- [ ] Trocar o `setInterval` da reprodução por **cadeia de `setTimeout`** — ver
      "A mudança estrutural"
- [ ] `src/services/playback-tempo/` — `waitMs(from, to, options)` como função
      pura de dois instantes, com piso, teto e multiplicador
- [ ] `src/services/record-instants/` — lê o instante dos itens da página e
      busca por `fetchItems` o que faltar, **sem** tocar em `layoutQuery.fields`
- [ ] Painel: modo, multiplicador e campo de tempo, com a **sugestão** do campo
      vindo do `sort` sem ser gravada — ver "O campo é escolhido"
- [ ] A batida que cruza a borda da página usa a mediana dos deltas da página; o
      `PageTurnAnticipation` não muda, muda quem calcula o parâmetro dele
- [ ] Unitários com `vi.useFakeTimers()`, como os de reprodução já fazem
- [ ] e2e com semente de intervalos desiguais, afirmando a **razão** entre as
      esperas, não o valor absoluto
- [ ] `pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm build`, `pnpm test:e2e`

## Notes

### A mudança estrutural
Um `setInterval` não muda de período — e é isso que o tempo real exige. Vira uma
cadeia de `setTimeout` que se reagenda, com `beatMs()` virando `nextWaitMs()`.
Toda a mecânica existente (`pendingEdge`, `turnAnticipated`, o watch que
reinicia a batida quando a página aterrissa) continua valendo; troca só a fonte
do número. Esta troca **não pode ser fatiada** do modo `realtime`.

### O campo é escolhido, a sugestão só aparece
Inferir do `sort` sozinho é frágil de um jeito silencioso: a pessoa clica no
cabeçalho "Nome" para procurar alguém e o relógio da reprodução muda de
significado sem avisar. Pedir explicitamente é correto, mas cobra configuração
no caso mais comum, em que a pessoa já ordenou por data.

Então: a opção é a verdade; vazia, o painel **sugere** o primeiro campo de data
do `sort` e mostra qual está em uso. Nada é gravado sem escolha — pelo mesmo
motivo que `src/index.ts` já documenta para a geometria detectada.

### Piso, teto e o que é constante
Piso de 1 s como hoje, **mas 200 ms quando `cameraTracking: 'off'`**: o piso
existe por causa da animação de câmera, e sem câmera para animar ele não tem
razão. Teto de 10 s, senão um registro por dia vira 24 h de espera. Delta zero
cai no piso; delta negativo (ordenação decrescente) usa o módulo.

São constantes exportadas e testadas, não opções: cada opção nova é uma pergunta
a mais para o usuário, e essas duas não têm resposta interessante.

### A borda da página é estimativa
A espera da batida que cruza a página depende do primeiro registro da página
seguinte, que ainda não chegou. Usar a **mediana dos deltas** da página custa
zero requisição e erra uma batida por página. Sondar a próxima página daria o
número exato e acrescentaria uma requisição exatamente no ponto que a task-016
mediu como o mais sensível a latência — descartado para a v1.

### O que fica para a task-011
Movimento **contínuo** entre registros — interpolar a posição é o que faria
"tempo real" parecer tempo real. Hoje o ponto só recalcula quando a câmera
publica `cameraOptions`, então a reprodução em tempo real é **discreta**. Vale
dizer isso no README, porque é a expectativa que o nome cria. E `easeTo` com
duração casada à espera, que hoje não existe.

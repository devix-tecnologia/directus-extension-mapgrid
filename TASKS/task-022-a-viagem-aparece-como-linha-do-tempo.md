# 🧩 Task 022 — A viagem aparece como linha do tempo

- Status: pending
- Type: feat
- Assignee: A definir
- Priority: 860
- Group: g-yezqk9i5
- GroupName: Movimento no mapa
- Difficulty: 3

## Description
Com a reprodução respeitando o relógio dos dados (task-021), falta o painel que
mostra **onde no tempo** a reprodução está: uma barra sob o mapa com início,
fim e a posição do registro atual, onde dá para arrastar e pular para qualquer
momento do trajeto.

A referência é o `ItinerarioCard` do `ceturb/mobi-gv`
(`src/components/moleculas/ItinerarioCard/`), que o Sidarta mandou conhecer: ele
achata o itinerário numa linha do tempo horizontal com marcador móvel. O eixo
dele é **tempo**, não distância — e é o que faz sentido aqui também.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [ ] Decidir onde a barra mora (sob o painel do mapa, sobre a grade?) e se é
      opção do preset ou aparece sempre que houver campo de tempo
- [ ] `src/services/trip-timeline/` — posição percentual de cada registro no
      intervalo, com guarda de amplitude zero e `Number.isFinite`
- [ ] Marcador **monotônico** — ver "O marcador nunca anda para trás"
- [ ] Duração mínima, para um trajeto de dois minutos não virar barra sem
      resolução
- [ ] Arrastar navega (chama o mesmo `focus()` do resto); o play caminha por ela
- [ ] Rótulos en-US/pt-BR em `src/shared/messages.ts`; nada de literal
- [ ] Unitários do serviço e do componente; e2e arrastando e conferindo o
      registro atual
- [ ] Evidência de tela (`EVIDENCE_TASK=022 pnpm screenshot`)
- [ ] `pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm build`, `pnpm test:e2e`

## Notes

### O que vale copiar do ItinerarioCard, e por quê
Duas decisões deles vêm de defeito corrigido, e estão anotadas no próprio código:

- **O marcador nunca anda para trás.** `useViagemSlider.ts` guarda
  `Math.max(posicaoMaxima, nova)`. Lá é porque a previsão de chegada piora e o
  ônibus "voltaria" na tela. Aqui o análogo é dado chegando fora de ordem — e a
  regra é a mesma: a barra de progresso de uma viagem que anda para trás parece
  defeito, mesmo quando o dado está certo.
- **Duração mínima** (`MIN_DURATION_MINUTES = 5`), senão viagens curtíssimas
  viram uma barra sem resolução.
- A normalização `(v - min) / (max - min) * 100` com guarda de amplitude zero e
  `Number.isFinite` — o comentário deles registra o `left: NaN%` que a falta
  disso causou.

### O que não copiar
A estrutura de pastas e a nomenclatura em português do `mobi-gv`. Aqui é classe
+ interface `I<Nome>`, uma pasta por classe, tudo em inglês (`CLAUDE.md`).

E o `ItinerarioCard` **não conversa com o mapa** lá — são irmãos independentes, e
no `PrevisaoScreen.vue` o card está inteiramente comentado. Aqui a barra só tem
razão de existir ligada ao `focus()`; é justamente a integração que falta lá.

### Depende da 021
Sem campo de tempo, o eixo seria contagem de registros — que é a paginação de
novo, com outra roupa. Esta task só começa depois que o relógio dos dados
existir.

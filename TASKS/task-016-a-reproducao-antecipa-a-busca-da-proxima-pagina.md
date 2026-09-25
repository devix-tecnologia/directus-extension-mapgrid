# 🧩 Task 016 — A reproducao antecipa a busca da proxima pagina

- Status: done
- Type: feat
- Assignee: sidartaveloso
- Priority: 760

## Description
Recurso novo a explorar. Na reprodução, a virada de página espera a busca da
próxima página, e isso quebra o ritmo dos passos. A ideia (Sidarta): antecipar
a busca da próxima página para que ela chegue a tempo do passo, levando em conta
quanto falta para o último registro da página e quanto a busca anterior levou.

Esta task não parte de uma solução. Cabe a ela definir **como** antecipar e
**medir** quanto isso ganha num cenário descrito e reproduzível.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [x] Descrever o cenário da medição (tamanho do trajeto, tamanho da página,
      intervalo da reprodução, latência da busca) e torná-lo reproduzível —
      `tests/e2e/mapgrid-playback-anticipation.spec.ts`, ver "O cenário"
- [x] Medir a reprodução como está, nesse cenário — ver "A medição, antes"
- [x] Definir como antecipar a busca, registrando as alternativas avaliadas e
      por que uma foi escolhida — ver "As alternativas" e "O desenho escolhido"
- [x] Implementar em TDD — `PageTurnAnticipation`
      (`src/services/page-turn-anticipation/`) e a reprodução do `MapgridLayout`
- [x] Medir de novo no mesmo cenário e registrar o ganho — ver "A medição,
      depois"
- [ ] ... — adiado: evidência de tela. Nada do que é desenhado mudou; o que
      mudou é **quando** a página é pedida. Duas capturas, antes e depois,
      sairiam iguais — a evidência desta task é a medição do ritmo, que está
      abaixo

## O cenário

`tests/e2e/mapgrid-playback-anticipation.spec.ts`, no ambiente do e2e (Directus
10.13.1 em docker, banco na mesma rede, um worker). Roda sozinho:

```
RUNNER_ARGS=tests/e2e/mapgrid-playback-anticipation.spec.ts \
  .sandcastle/on-mirror.sh pnpm test:e2e
```

| Grandeza | Valor |
| --- | --- |
| Coleção | `test_mapgrid_track`, os mil pontos da task-015 |
| Página | 5 registros — curta de propósito: o que se mede são as viradas |
| Intervalo da reprodução | 1 s, o mínimo que o layout aceita |
| Latência injetada | 600 ms em toda requisição de `/items/test_mapgrid_track` |
| Percurso medido | do registro 1 ao 13, duas viradas de página |

**A latência é injetada de propósito.** Com o banco ao lado a busca custa menos
de um décimo de segundo (a task-015 mediu de 86 a 107 ms), que é menos do que o
ruído deste ambiente; uma instalação com rede no meio é onde a parada aparece, e
um atraso fixo nas requisições da coleção é essa instalação, reproduzível. A
`page.route` do Playwright é quem o injeta.

O que se mede é o intervalo entre um registro virar o atual e o seguinte:
dentro da página é o intervalo da reprodução; na virada é o intervalo mais o
que a busca levou.

## A medição, antes

Três execuções (uma e as duas repetições do Playwright), antes de qualquer
mudança no código:

```
inside a page: 996, 1000, 1000, 363, 1000, 1000, 1000, 359, 1001, 1001 ms — beat 1000 ms
page turns: into 6: 1636 ms (+636), into 11: 1641 ms (+641)

inside a page: 1000, 1000, 1000, 358, 1001, 1000, 1000, 367, 1000, 1001 ms — beat 1000 ms
page turns: into 6: 1641 ms (+641), into 11: 1632 ms (+632)

inside a page: 998, 1000, 1000, 355, 1000, 1001, 999, 364, 1001, 999 ms — beat 999,5 ms
page turns: into 6: 1644 ms (+644,5), into 11: 1637 ms (+637,5)
```

Três coisas que a medição diz:

- **A virada custa a latência de UMA busca, não das duas.** São duas
  requisições por virada (task-015), mas elas saem juntas: com 600 ms injetados
  em cada uma, a virada atrasa ~635 ms, e não ~1200. Isso resolve a alternativa
  que a task-015 deixou em aberto — **reduzir as duas buscas a uma não devolve
  ritmo nenhum**, porque a espera é a da mais lenta e não a soma. Continua
  valendo como economia de requisição; não como latência.
- **O registro seguinte à virada paga a conta.** O `setInterval` mantém o
  compasso dele, então o registro que a página trouxe ficou 363, 358, 355 ms na
  tela em vez de 1000 — o passo foi comido pelo atraso do anterior. O buraco é o
  dobro do que parece: um passo longo e um curto.
- **A virada é a única coisa que sai do compasso.** Todos os outros passos deram
  1000 ms.

## As alternativas

Três desenhos foram considerados. O que decide entre eles é uma restrição que só
apareceu ao ler `DirectusMapCenterer` e `DirectusCurrentPoint`: **o mapa embutido
só tem os registros da página que está mostrando.** Com geometria `json` — a do
cenário — a marca do registro atual e o movimento de câmera saem do
`geojson.features` que o layout do mapa publica; um registro que não está na
página carregada não tem ponto no mapa, mesmo que a composição tenha o item em
mãos.

1. **Buscar a próxima página por fora e guardar num buffer**, com um
   `fetchPage(page)` próprio, para que o passo da virada já mostre o registro
   vindo do buffer enquanto a página de verdade chega atrás.
   *Recusada.* Custa uma requisição a mais por virada (78 → 117 na reprodução
   inteira do trajeto de mil pontos) e **não resolve o que se quer resolver**:
   o registro do buffer não está no `geojson` do mapa, então ele apareceria na
   grade sem ponto no mapa e sem câmera até a busca do mapa chegar. A parada
   visual continuaria lá, com uma requisição a mais.

2. **Virar a página vários passos antes, andando numa cópia congelada da página
   que sai.** Antecipa tanto quanto se queira.
   *Recusada como desenho geral, aceita como limite.* Enquanto a antecipação
   dura, o mapa já está na página seguinte e os registros do fim da página que
   sai perdem a marca e a câmera — o mesmo defeito da alternativa 1, invertido.
   Trocar 90 ms de espera por um intervalo inteiro de marca apagada é pior do
   que o problema.

3. **Disparar a virada dentro do passo que a precede, sem congelar nada.** É a
   escolhida, abaixo.

## O desenho escolhido

A virada continua sendo pedida uma vez só, mas **antes da batida**: quando o
registro atual é o último da página, a reprodução arma um disparo para
`intervalo − estimativa` depois. A busca acontece dentro do passo que já estava
correndo, e a página chega junto com a batida seguinte.

O que isso **não** muda é o que o torna barato: a janela em que a grade mostra a
página nova enquanto a marca ainda está no último registro da anterior tem o
tamanho da busca — exatamente a mesma janela que hoje é de espera. Nada fica
apagado por mais tempo do que já ficava.

**O limite.** A antecipação nunca começa antes do passo que torna atual o último
registro da página: mais cedo que isso cairia na alternativa 2, com registros por
andar perdendo o ponto no mapa. Quando a busca demora mais que um intervalo, a
antecipação cobre um intervalo e o resto continua aparecendo como espera.

**A estimativa** é o mais lento dos três últimos fetches medidos — uma busca
lenta alarga a folga na virada seguinte, uma rápida não a encolhe de imediato.
Antes de haver medição, o palpite é de 250 ms: curto de propósito, porque
superestimar vira a página cedo demais e uma reprodução que cruza uma única
fronteira pagaria o palpite sem chance de corrigi-lo. A medição é o tempo entre
pedir a página e ela chegar, e zera quando a consulta muda (`queryKey`).

**A batida recomeça onde a página pousou.** Sem isso, o registro que a página
trouxe ficaria com o que sobrou do passo — foi o que a medição de antes mostrou
com os 363 ms. Como a página pousa por relógio próprio e não pelo do
`setInterval`, o `setInterval` é refeito no pouso.

Onde mora: `PageTurnAnticipation` (`src/services/page-turn-anticipation/`)
decide o quando; o `MapgridLayout` arma, dispara e mede.

## A medição, depois

Mesmo cenário, mesmo spec:

```
every step: 3 997, 4 1000, 5 1001, 6* 1389, 7 994, 8 1002, 9 999, 10 1000, 11* 1002, 12 997, 13 999 ms
inside a page: 997, 1000, 1001, 994, 1002, 999, 1000, 997, 999 ms — beat 999 ms
page turns: into 6: 1389 ms (+390), into 11: 1002 ms (+3)
```

| Virada | Antes | Depois |
| --- | --- | --- |
| 1ª (no palpite de 250 ms) | +636, +641, +644 ms | **+390 ms** |
| 2ª (na medição da 1ª) | +641, +632, +637 ms | **+3 ms** |
| Passo seguinte à virada | 363, 358, 355 ms | **994, 997 ms** |

Com 600 ms de rede no meio, a virada de página deixa de custar 635 ms a mais que
um passo e passa a custar **3 ms** — dentro do ruído do próprio compasso. A
primeira virada de uma reprodução ainda paga a diferença entre o palpite e a
rede real (390 ms dos 635); a partir da segunda, a antecipação está do tamanho
da rede.

E o passo seguinte à virada deixou de ser comido: 994 e 997 ms, em vez dos ~360.

Repetido na suíte inteira (34 specs, todas passando), para conferir que o número
não é de uma execução sozinha: `into 6: 1380 ms (+380), into 11: 1009 ms (+9)`.
A medição da task-015 rodou junto e não mudou — a virada continua custando duas
buscas, 82, 88 e 82 ms com o banco ao lado.

## Notes

A task-015 mediu o custo da virada de página durante a reprodução; a medição
está no documento dela.

Detalhe de leitura, para quem comparar os logs: na execução de antes, a linha
`walked` saiu com os números colados (`22, 33, …`) porque o texto da linha da
grade é a célula do nome seguida da do `sequence`, e o parse do spec só foi
apertado depois. Os intervalos medidos não dependem disso — o registro 6 é o
`66` daquele log.

Fora do escopo, medido de passagem e vale registrar: o `RUNNER_ARGS`, que a
captura de tela já usava, passou a valer também para o e2e — sem ele, medir um
spec obrigava a rodar a suíte inteira.

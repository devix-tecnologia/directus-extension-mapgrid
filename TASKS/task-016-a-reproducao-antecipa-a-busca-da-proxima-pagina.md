# 🧩 Task 016 — A reproducao antecipa a busca da proxima pagina

- Status: pending
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
- [ ] Descrever o cenário da medição (tamanho do trajeto, tamanho da página,
      intervalo da reprodução, latência da busca) e torná-lo reproduzível
- [ ] Medir a reprodução como está, nesse cenário
- [ ] Definir como antecipar a busca, registrando as alternativas avaliadas e
      por que uma foi escolhida
- [ ] Implementar em TDD
- [ ] Medir de novo no mesmo cenário e registrar o ganho

## A linha de base, medida na task-015

Medida em 2026-09-25 no ambiente do e2e (Directus 10.13.1 em docker, banco na
mesma rede), com o cenário já no repositório: `tests/helpers/track-collection.ts`
semeia mil pontos de um trajeto sintético em `test_mapgrid_track`, e
`tests/e2e/mapgrid-page-turn-cost.spec.ts` conta as requisições.

| Grandeza | Medido |
| --- | --- |
| Trajeto | 1000 pontos, 25 por página, 40 páginas |
| Passo dentro da página | 0 requisições |
| Virada de página | 2 buscas de registros, 0 contagens |
| Tempo da virada | 86, 92 e 107 ms entre o clique e o registro novo |
| Reprodução inteira | 2 × 39 viradas = 78 buscas |

São **duas** buscas por virada porque a consulta é compartilhada nos parâmetros,
não na requisição: cada layout embutido tem o seu `useItems` e os dois refazem a
busca quando a `page` muda. Reduzir isso a uma é uma alternativa a avaliar aqui,
ao lado de antecipar a busca — e as duas são independentes.

O tempo foi medido com o banco ao lado; com rede no meio ele cresce, e é
exatamente o que a antecipação esconde. Medir de novo no mesmo cenário é rodar o
mesmo spec.

A geometria do cenário é `json`. Com geometria nativa o mapa deles acrescenta o
filtro pela área visível, e a conta por virada passa a ser outra — não medida.

## Notes
A task-015 mediu o custo da virada de página durante a reprodução; a medição
está acima.

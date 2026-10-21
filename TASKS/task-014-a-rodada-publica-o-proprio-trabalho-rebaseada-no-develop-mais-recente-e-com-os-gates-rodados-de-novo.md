# 🧩 Task 014 — A rodada publica o proprio trabalho, rebaseada no develop mais recente e com os gates rodados de novo

- Status: done
- Type: feat
- Assignee: sidartaveloso

## Description
A rodada do Sandcastle integrava a branch no develop local do host sem push, e sobre a base em que o agente comecou. Na rodada da task-013 o processo do host morreu depois do ultimo commit do agente, e nada foi integrado nem publicado. Em autopilot, o fim da rodada e: fetch, fast-forward do develop, rebase da branch sobre ele, gates de novo sobre o resultado, merge --no-ff e push; se o origin andou durante os gates, repete; qualquer falha preserva a branch. Provisorio ate o taskin publicar sozinho (task-135 do taskin).

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [x] `RoundPublisher implements IRoundPublisher` (`.sandcastle/round-publisher/`), com
      testes contra repositórios git reais e descartáveis (remoto bare e dois clones)
- [x] Rebase sobre o que o origin publicou enquanto o agente trabalhava, e gates
      rodados sobre a branch rebaseada
- [x] Falha de gate, conflito de rebase, árvore suja ou alvo divergente preservam
      a branch e não publicam nada
- [x] O origin andou durante os gates: repete fetch, rebase e gates, até
      `maxAttempts`
- [x] `round.ts` sincroniza o alvo com o origin antes de o agente começar, e
      publica depois do `close()`, que libera a branch do worktree
- [x] Gates: `pnpm install --frozen-lockfile`, `typecheck`, `typecheck:sandcastle`,
      `lint`, `test`
- [x] O Biome passa a lintar `.sandcastle/` e `scripts/`, que o `files.includes`
      não casava; gate provado com um arquivo que viola a regra (saída 1) e com
      os worktrees da rodada fora da varredura
- [ ] Primeira rodada real publicando por este caminho — adiado: só a próxima rodada (task-006) exercita o caminho; se ela não publicar, a 014 se reabre

## Notes
O push no fim da rodada é provisório: quando o taskin publicar a mudança de status em autopilot (task-135 do taskin), a publicação volta a ser dele e o `RoundPublisher` fica só com rebase, gates e merge.

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

## Notes
A task-015 mede o custo da virada de página durante a reprodução; essa medição é a linha de base daqui.

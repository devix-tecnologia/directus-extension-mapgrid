# 🧩 Task 031 — Visão padrão do mapa no preset da coleção

- Status: pending
- Type: feat
- Assignee: sidartaveloso
- Priority: 930

## Description
Proposta combinada com o Sidarta (pela sessão do geohub): o admin grava o
enquadramento atual como visão padrão da coleção, e quem abre a coleção sem
ter mexido no mapa cai nela.

- Botão explícito "Usar esta visão como padrão" nas opções do layout. Grava no
  preset padrão da coleção (`directus_presets` com `role`, `user` e `bookmark`
  nulos). O movimento comum continua indo só para o preset pessoal, como o
  Directus já faz.
- A visão é guardada como **bbox**, para cada tamanho de tela enquadrar a mesma
  região, em `layout_options.mapgrid.defaultView.bbox`
  (`[oeste, sul, leste, norte]`). É uma chave própria, separada de
  `map.cameraOptions`, que o layout de mapa reescreve a cada movimento.
- Prioridade ao abrir: câmera do preset pessoal (o usuário já mexeu) → visão
  padrão da coleção → enquadramento automático dos dados.
- Só quem pode alterar o preset padrão vê o botão (ou ele fica desabilitado,
  com a explicação).

Resolve também o achado da task-029: com geometria nativa e sem câmera, a
coleção abre no mapa-múndi, porque o Directus só enquadra os dados sozinho
quando a geometria é `json`. O "enquadramento automático" tem de cobrir esse
caso.

O geohub (extensão furto-roubo-veiculo) reconcilia o `layout_options` do preset
padrão a cada boot e vai preservar `mapgrid.map.cameraOptions` e
`mapgrid.defaultView`.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [ ] Ler a visão padrão do preset da coleção e aplicá-la quando não há câmera pessoal
- [ ] Enquadramento automático dos dados numa geometria nativa
- [ ] Botão "Usar esta visão como padrão", gravando o bbox no preset padrão
- [ ] Botão só para quem pode alterar o preset padrão
- [ ] e2e e evidência

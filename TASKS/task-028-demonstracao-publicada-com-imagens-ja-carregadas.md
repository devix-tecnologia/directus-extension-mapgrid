# 🧩 Task 028 — Demonstração publicada, com imagens já carregadas

- Status: in-progress
- Type: chore
- Assignee: sidartaveloso
- Priority: 880

## Description
Pedido do Sidarta: publicar a demonstração somente leitura (task-026) como
imagem Docker e pô-la no ar no CapRover de pilotos
(https://mapgrid.geohub.tecnologia.vix.br), sem guardar nada entre reinícios e
subindo rápido.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [x] `docker/demo/Dockerfile` com dois alvos: `directus` (extensão do npm,
      fotos da carga, `ACCEPT_TERMS`) e `database` (PostGIS com o banco, PGDATA
      fora do VOLUME; só amd64, como o PostGIS)
- [x] `pnpm demo:bake`: pilha descartável, seed, banco e uploads em
      `docker/demo/build/`
- [x] Senhas do build descartáveis: o banco troca a do `directus` por
      `POSTGRES_PASSWORD` em modo single-user, antes de abrir a porta; o
      Directus troca a do admin por `ADMIN_PASSWORD` antes de atender
- [x] Nenhuma sessão na imagem: a carga apaga e o banco apaga a cada início (o
      token de uma sessão de admin numa imagem pública entrava sem senha)
- [x] O seed apaga comentários e favoritos do visitante, que o Directus 11
      concede a todo usuário do app
- [x] DemoAccess no Directus 11: política de leitura ligada ao papel
- [x] Publicado em `sidartaveloso/directus-mapgrid` e
      `sidartaveloso/directus-mapgrid-db` (2.0.0) e no ar no pilotos-1
- [ ] Migrar o deploy para o devix-stack (`devix.config.ts` + receita
      one-click); hoje é `~/.config/mapgrid-demo/deploy-caprover.mjs`, fora do
      repositório
- [ ] Apagar no Docker Hub o repositório errado `sidartaveloso/directus-mapgridatest`

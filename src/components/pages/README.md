# Pages

Nível Atomic Design de **pages** — componentes de página/contêiner com lógica de negócio (stores, router, dados).

Neste projeto (extensão de layout para Directus) as páginas ainda não são necessárias: os templates (`mapgrid-layout`, `mapgrid-options`) já compõem os organismos e recebem os dados via props. Quando houver necessidade de um container com lógica (ex.: tela cheia do mapa), os componentes devem morar aqui seguindo o padrão storytype:

```
nome-da-pagina/
  NomeDaPagina.vue
  NomeDaPagina.types.ts
  NomeDaPagina.mock.ts
  NomeDaPagina.stories.ts
  NomeDaPagina.test.ts
  index.ts
```

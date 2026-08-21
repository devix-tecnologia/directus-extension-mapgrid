# Task 004 — adicionar testes e2e/integracao

Status: done
Type: test
Assignee: marcospatricio

## Description

adicionar testes e2e/integração escritos em **TypeScript** que confirmem o funcionamento da extensão mapgrid, seguindo o padrão estabelecido para testes de extensões de directus utilizado nos projetos [directus-extension-inframe](https://github.com/devix-tecnologia/directus-extension-inframe) e [directus-extension-push-notification](https://github.com/devix-tecnologia/directus-extension-push-notification): **Playwright** para os testes e2e, **Vitest** para os testes de integração e **Docker** (`docker-compose.test.yml`) para subir uma instância de directus isolada para os testes.

o próprio teste deve ser responsável por preparar o ambiente de validação, sem configuração manual: criar a coleção de teste com um campo de localização (tipo "Map"), popular com itens, configurar o mapgrid como layout de visualização da coleção e, então, confirmar o funcionamento da extensão.

como o mapgrid é um layout que apresenta uma coleção simultaneamente em mapa e grade, os testes devem validar os principais fluxos de uso sobre esse ambiente preparado de forma programática.

escopo esperado:

- replicar o setup de testes dos projetos de referência (playwright.config, vitest.config, `docker-compose.test.yml`, pasta `tests/`);
- testes criando a coleção de teste (campo "Map" + itens) e configurando o mapgrid como layout de visualização via API/UI dentro do próprio teste;
- testes e2e cobrindo renderização do mapa e da grade, carregamento dos itens e interação com os controles, confirmando o funcionamento da extensão, incluindo a validação de que, ao clicar em um registro do grid, o mapa centraliza automaticamente no marker correspondente ao item clicado;
- testes de integração cobrindo a lógica da extensão (construção do GeoJSON, manipulação e transformação dos dados);
- scripts de teste no `package.json` e documentação de execução no README, no padrão dos projetos de referência.

## Tasks

- [x] replicar o setup de testes dos projetos de referência (playwright.config, vitest.config, docker-compose.test.yml, pasta tests/)
- [x] implementar no teste a criação da coleção de teste (campo de localização "Map" + itens) e a configuração do mapgrid como layout de visualização
- [x] escrever testes e2e (Playwright) em TypeScript para renderização do mapa/grade, interação com os controles e confirmação do funcionamento, incluindo a centralização do mapa no marker ao clicar em um registro do grid
- [x] escrever testes de integração (Vitest) em TypeScript para a lógica da extensão (GeoJSON e manipulação de dados)
- [x] adicionar scripts de teste ao package.json e documentar a execução no README
- [x] validar execução dos testes juntamente com lint e typecheck

## Notes

- Referências do padrão de testes: [directus-extension-inframe](https://github.com/devix-tecnologia/directus-extension-inframe) e [directus-extension-push-notification](https://github.com/devix-tecnologia/directus-extension-push-notification)
- Documentação de extensões do directus: https://docs.directus.io/extensions/

## Parecer da revisão (2026-08-21)

Revisão completa da branch `feat/task-004` com bateria final verde: **unit 13/13, integração 12/12, e2e 8/8, lint 0 erros, typecheck e build ok**, executados via runner oficial com containers Docker recém-criados. Escopo da task atendido.

### Problemas encontrados na revisão e corrigidos

1. **Testes de integração não testavam o código real** — reimplementavam localmente `buildGeoJson`, `resolveFieldTemplate` e resolução de coordenadas (cópia da lógica de produção). Extraídos os módulos compartilhados `src/geojson.ts` e `src/defaults.ts`, agora consumidos tanto pela extensão quanto pelos testes; um bug real foi descoberto no processo: a regex de template com flag `g` era stateful (`lastIndex`) e corrompia `matchAll`.
2. **Bug real de UX descoberto pelo e2e** — o `watchEffect` do `MapComponent.vue` chamava `fitBoundsToItems()` em toda atualização de `items`; um refetch do `useItems` durante o `flyTo` cancelava a animação e puxava a câmera de volta ao overview (~50% de falha sob 4 workers). Corrigido com guarda `hasPerformedInitialFitBounds` (fitBounds automático apenas uma vez por montagem; botão de reset continua funcional).
3. **Setup e2e com condição de corrida** — setup por worker (`beforeAll` com 4 workers) derrubava/recriava coleções concorrentemente (HTTP 500). Migrado para `global-setup`/`global-teardown` do Playwright com preset global criado via API (elimina também o clique frágil no seletor de layout).
4. **Duplicação massiva na infra de teste** — runners `run-e2e.js`/`run-integration.js` (~150 linhas repetidas), helpers duplicados e credenciais espalhadas consolidados em `tests/run-docker-tests.js` + `tests/helpers/` (`directus-api`, `wait`, `mapgrid-preset`); porta dinâmica no `docker-compose.test.yml` evita conflito com stacks locais.
5. **Código com comentários/refs frágeis** — removidos `@ts-expect-error`, `biome-ignore` e catches vazios comentados; câmera do mapa exposta via `data-center`/`data-zoom` para asserção determinística; cliques em marker via projeção Web Mercator própria (`map-projection.ts`) em vez de coordenadas fixas.
6. **Asserções fracas substituídas** — padrão "settle-then-assert" trocado por `expect.poll` nos testes de câmera; teste tautológico de defaults removido; empty-state deixou de usar `test.skip()`.

### Observações restantes (fora do escopo)

- Warnings pré-existentes de `noExplicitAny` nos mocks de `.storybook/` (não relacionados à task).
- O teste de empty-state valida apenas o `v-info` padrão do Directus; um estado vazio customizado do mapgrid exigiria mudança de comportamento no componente.

## Segunda rodada de revisão — princípios Total TypeScript (2026-08-21)

Revisão independente focada em tipos honestos, nomes autoexplicativos e ausência de comentários. Onze pontos identificados (P1–P11), todos corrigidos e validados com bateria completa verde: **unit 13/13, integração 12/12, e2e 8/8, lint 0 erros, typecheck (main + testes) ok, build ok**.

### Correções aplicadas

1. **Testes TypeScript não eram verificados pelo compilador** — `tsconfig.json` limitava `include` a `src/` com `rootDir`; ~800 linhas em `tests/` só eram checadas sintaticamente pelo Biome. Criado `tsconfig.tests.json` (inclui `src/**/*.ts`, `tests/**/*.ts` e configs de teste) e script `typecheck` encadeia ambos.
2. **Divergências de dependência expostas pelo novo typecheck** — duas cópias de vue (3.5.18 via extensions-sdk vs 3.5.22 raiz) deduplicadas via override pnpm; `@vitejs/plugin-vue` 6→5.2.4 e `vite` ^5 fixado na raiz para coincidir com o vite do vitest (o SDK preserva seu vite aninhado); `@types/node` adicionado.
3. **Erros reais revelados nos testes** — `maxThreads`/`minThreads` fora do lugar em `vitest.integration.config.ts` (movidos para `poolOptions.threads`), diretiva `tooltipDirective` sem tipo (`Directive` do vue), `TestItem` sem index signature (incompatível com `RowItem`).
4. **Assinaturas que mentiam** — `serializeItemRow` declarava `item: RowItem` mas tratava null/undefined no corpo, forçando casts `as unknown as` no teste; assinatura alargada e casts removidos.
5. **Duplo cast eliminado** — type guard `hasPointCoordinates` substitui `'coordinates' in (value as Record<...>)` + recast em `serializeFieldValue`.
6. **Guard caseiro substituído por API idiomática** — duck-typing `'value' in candidate` trocado por `toValue()` + `MaybeRefOrGetter` em `src/index.ts`.
7. **Detecção de placeholder stateless** — comparação de strings (`resolvedTemplate !== template`) substituída por regex não-global com `.test()`; imune ao bug histórico de `lastIndex`.
8. **Fonte única de verdade** — `EMPTY_COLLECTION_NAME` centralizada em `tests/helper-collection.ts` (antes duplicada em global-setup e spec); teardown explícito com `COLLECTION_NAME`.
9. **Código morto removido** — re-export `sleep` sem consumidores; `setCurrentTest`, `dockerProgress` e propriedade `currentTest` nunca chamados; props `deleteItems`/`deleteSelectedItems` não usadas em `MapGridLayout.vue`.
10. **Guarda duplicada extraída** — `performInitialFitBoundsOnce()` unifica lógica repetida no handler `load` e no `watchEffect` do `MapComponent.vue`.
11. **Robustez e reuso** — `waitForCameraToSettle` ganhou deadline de 30s (antes pendurava até o timeout global de 180s); `resourceExists` reimplementado sobre `apiRequest` (elimina duplicação de axios config).

Resultado líquido: -111 linhas. Nenhum comentário adicionado; nenhum commit realizado (alterações na árvore de trabalho, aguardando decisão de commit).

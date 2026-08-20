# Task 004 — adicionar testes e2e/integracao

Status: pending
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

- [ ] replicar o setup de testes dos projetos de referência (playwright.config, vitest.config, docker-compose.test.yml, pasta tests/)
- [ ] implementar no teste a criação da coleção de teste (campo de localização "Map" + itens) e a configuração do mapgrid como layout de visualização
- [ ] escrever testes e2e (Playwright) em TypeScript para renderização do mapa/grade, interação com os controles e confirmação do funcionamento, incluindo a centralização do mapa no marker ao clicar em um registro do grid
- [ ] escrever testes de integração (Vitest) em TypeScript para a lógica da extensão (GeoJSON e manipulação de dados)
- [ ] adicionar scripts de teste ao package.json e documentar a execução no README
- [ ] validar execução dos testes juntamente com lint e typecheck

## Notes

- Referências do padrão de testes: [directus-extension-inframe](https://github.com/devix-tecnologia/directus-extension-inframe) e [directus-extension-push-notification](https://github.com/devix-tecnologia/directus-extension-push-notification)
- Documentação de extensões do directus: https://docs.directus.io/extensions/

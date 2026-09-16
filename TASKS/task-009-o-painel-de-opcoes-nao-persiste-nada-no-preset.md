# Task 009 — O painel de opções não persiste nada no preset

Status: pending
Type: fix
Assignee: A definir

## Description

Toda alteração feita no painel de **Opções de Layout** aparece na tela na hora e
**nunca é gravada**. Ao recarregar, tudo volta ao que estava. Vale para as opções
que existem desde o começo da extensão, e não só para as recentes.

Medido contra um Directus real, num único teste e2e:

| Ação no painel | Efeito na tela | Gravado no preset |
| --- | --- | --- |
| escolher o campo `status` como coluna | aparece na grade | não |
| alternar `Zoom on Table Click` | alterna | não |

Depois das duas ações, `layout_query` continuava `{page, limit, sort}` e
`layout_options` continuava exatamente com o que a semente do teste havia
escrito.

**Ordenar pelo cabeçalho da grade persiste normalmente.** Esse caminho escreve
pelo componente do layout, e não pelo painel — o que localiza o defeito no painel
e não na escrita do preset.

## Por que isso passou despercebido

Os testes unitários montam o `MapgridOptions` isolado e conferem o evento
emitido, que é emitido corretamente. O Storybook mostra o componente funcionando.
Nenhum dos dois passa pelo `useLayout` do Directus, que é quem liga o evento do
painel de volta ao estado do layout. Só o e2e contra um Directus real revela.

## Onde investigar

O `useLayout` do Directus (`packages/composables/src/use-layout.ts`) monta o
estado assim:

```ts
const state = reactive({ ...layout.setup(props, { emit }), ...toRefs(props) });

for (const key in state) {
  state[`onUpdate:${key}`] = (value) => {
    if (isWritableProp(key)) emit(`update:${key}`, value);
    else if (!Object.keys(props).includes(key)) state[key] = value;
  };
}
```

Duas hipóteses a testar, nessa ordem:

1. **O painel é renderizado a partir de outra instância do wrapper.** Se a barra
   lateral monta seu próprio `layout-<id>`, o estado dela é separado: a tela
   atualiza e o layout de verdade nunca sabe. Explicaria exatamente o que foi
   medido.
2. **O `for...in` não alcança as chaves certas.** O laço acrescenta chaves ao
   objeto que está percorrendo, o que em JavaScript não garante visitar o que foi
   acrescentado — e `onUpdate:<chave>` pode não existir para parte do estado.

## Tasks

- [ ] Confirmar qual das duas hipóteses é a verdadeira, medindo e não supondo
- [ ] Comparar com um layout nativo: o tabular grava `tableSpacing` pelo painel,
      então ou ele faz algo diferente, ou o defeito também o atinge
- [ ] Corrigir, ou contornar se a causa estiver no app e não aqui
- [ ] Reativar o `test.fixme` em `tests/e2e/mapgrid-columns.spec.ts`
- [ ] Cobrir com e2e pelo menos duas opções de naturezas diferentes, para a
      correção não valer só para um caso

## Notes

Não é regressão da task-005: ela mudou onde as colunas são guardadas, e o defeito
atinge igualmente opções que ela não tocou.

A task-008 tira o seletor de colunas do painel e o leva para o cabeçalho da
grade, onde o caminho de escrita já é comprovadamente bom. Isso **contorna** o
sintoma para as colunas, e não corrige o defeito: o resto do painel — campo de
geolocalização, template do popup, centro do mapa — continua sem gravar.

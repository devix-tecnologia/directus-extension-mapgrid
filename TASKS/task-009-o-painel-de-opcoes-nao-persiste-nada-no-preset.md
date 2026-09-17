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

## Diagnóstico feito (2026-09-17)

Rodada de investigação com tempo limitado, medindo contra um Directus real. As
duas hipóteses levantadas na abertura desta task **foram descartadas**, e o
caminho ficou bem mais estreito.

**Hipótese 1 — o painel viria de outra instância do wrapper: falsa.** Em
`app/src/modules/content/routes/collection.vue`, os três slots são renderizados
dentro do mesmo `v-slot="{ layoutState }"`:

```
<component :is="`layout-actions-${layout}`" v-bind="layoutState" />
<component :is="`layout-${layout}`"          v-bind="layoutState">
<component :is="`layout-options-${layout}`"  v-bind="layoutState" />
```

O estado é um só. O painel enxerga exatamente o mesmo `layoutState` que o layout.

**Hipótese 2 — `fields` seria sombreado por uma prop do wrapper: falsa.** As props
são `collection`, `selection`, `layoutOptions`, `layoutQuery`, `layoutProps`,
`filter`, `filterUser`, `filterSystem`, `search`, `showSelect`, `selectMode`,
`readonly`, `resetPreset` e `clearFilters`. `fields` não está entre elas, então o
handler do `useLayout` entra no ramo que escreve (`state[key] = value`).

**O que de fato acontece**, instrumentando o nosso próprio caminho de escrita e
lendo o console do navegador durante o e2e:

```
[DIAG] setter fields chamado com ["name","status"]
[DIAG] write fields ["name","status"]
[DIAG] apos write, layoutQuery = {"page":1,"limit":25,"sort":["name"]}
```

Ou seja: o evento chega, o nosso setter roda, e a atribuição é feita. A terceira
linha não é o defeito — ler `layoutQuery.value` logo após atribuir devolve o
valor antigo porque ele é uma prop, e o valor novo só volta pelo pai no tique
seguinte. E volta mesmo: os chips na tela passam a mostrar o campo escolhido, o
que só acontece se a memória recebeu.

**Sobra uma pergunta só, e é a boa:** por que o mesmo caminho persiste para
`sort` e não para `fields`. Ordenar pelo cabeçalho escreve pelo mesmo
`useWritableLayoutQuery`, pelo mesmo `useSync(props, 'layoutQuery', emit)`, e
sobrevive a um reload — provado por e2e. A escolha de coluna não.

## Onde investigar em seguida

O `usePreset` (`app/src/composables/use-preset.ts`) grava assim:

```ts
const layoutQuery = computed({
  get: () => localPreset.value.layout_query?.[layout.value] || null,
  set: (query) => updatePreset({ layout_query: assign({}, layout_query, { [layout.value]: query }) }),
});
```

e o `updatePreset` chama um `autoSave` com `debounce`. A suspeita mais provável,
dado tudo acima, é **escrita posterior com cópia velha**: se algum outro computed
nosso gravar `layoutQuery` logo depois, a partir de um valor capturado antes,
ele apaga o `fields` recém-escrito antes de o `autoSave` disparar. Explicaria a
diferença entre `sort` e `fields` sem contradizer nenhuma medição.

Próximo passo sugerido: registrar toda escrita em `layoutQuery` com carimbo de
tempo, e ver se há uma segunda escrita entre a nossa e o salvamento.

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

## Achado de 2026-09-17, vindo da task-008

A medição que sustenta o diagnóstico acima pode estar errada, e por um motivo
simples: **o preset lido não é o preset gravado**.

A semente dos testes grava um preset global — sem `user` e sem `role`. Quando
alguém muda uma opção pela interface, o Directus não edita esse global: ele cria
um preset novo, específico daquela pessoa. O ajudante de teste lia
`/presets?filter[collection][_eq]=...&limit=1`, ou seja, a primeira linha, que é
a global — parada no que a semente escreveu. Daí a conclusão "nenhuma escrita do
painel é gravada".

O ajudante foi corrigido em `tests/helpers/mapgrid-preset.ts`: agora ele lê todas
as linhas da coleção e aplica a mesma precedência do Directus — o preset da
pessoa vence o do papel, que vence o global. Com essa correção, a escolha de
coluna feita no cabeçalho aparece no preset em menos de vinte segundos, e a
ordenação também.

Próximo passo desta task, portanto, é **refazer a medição** antes de qualquer
conserto: alternar `zoomOnClick` pelo painel e ler o preset efetivo. Se o valor
estiver lá, não há defeito nenhum, e esta task fecha como erro de medição.

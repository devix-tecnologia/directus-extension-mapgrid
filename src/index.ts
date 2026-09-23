import {
  defineLayout,
  useApi,
  useCollection,
  useExtensions,
  useSync,
} from '@directus/extensions-sdk';
import type { Field, LayoutProps } from '@directus/types';
import { computed, reactive, ref, toRefs } from 'vue';
import DeleteAction from './components/atoms/delete-action/DeleteAction.vue';
import Layout from './components/templates/mapgrid-layout/MapgridLayout.vue';
import Options from './components/templates/mapgrid-options/MapgridOptions.vue';
import type { GeoItem } from './contract/index';
import { useWritableLayoutQuery } from './contract/index';
import {
  embutirLayout,
  LAYOUTS_EMBUTIDOS,
  type LayoutEmbutido,
} from './services/embedded-layout/index';
import type { LayoutOptions, LayoutQuery } from './types';

/**
 * Campos de controle do Directus. Nenhum serve como geometria, e escolher um
 * como padrão só significaria trocá-lo em toda coleção nova.
 */
const EXCLUDED_FIELDS = [
  'id',
  'sort',
  'status',
  'user_created',
  'date_created',
  'user_updated',
  'date_updated',
];

const detectarGeometria = (fields: Field[]): string | undefined => {
  const campoDeMapa = fields.find((field) => field.meta?.interface === 'map');
  if (campoDeMapa) return campoDeMapa.field;

  const campoJson = fields.find(
    (field) => field.type === 'json' && !EXCLUDED_FIELDS.includes(field.field)
  );
  return campoJson?.field;
};

type Opcoes = { value: Record<string, unknown> };

export default defineLayout<LayoutOptions, LayoutQuery | null>({
  id: 'mapgrid',
  name: 'MapGrid',
  icon: 'map',
  component: Layout,
  slots: {
    options: Options,
    sidebar: () => undefined,
    actions: DeleteAction,
  },
  setup(props, { emit }) {
    const layoutOptions = useSync(props, 'layoutOptions', emit);
    const layoutQuery = useSync(props, 'layoutQuery', emit);
    const selection = useSync(props, 'selection', emit);
    const api = useApi();

    const { collection, filter, search } = toRefs(props);
    const { fields: fieldsInCollection, primaryKeyField } = useCollection(collection);
    const { layouts } = useExtensions();

    const writableQuery = useWritableLayoutQuery(layoutQuery);
    const geometriaDetectada = computed(() => detectarGeometria(fieldsInCollection.value ?? []));

    /*
     * Cada layout embutido guarda a configuração dele numa chave própria do
     * nosso `layoutOptions`: o mapa o campo de geometria e o mapa base, a grade
     * o espaçamento e o alinhamento. Numa chave só, um sobrescreveria o outro.
     */
    const opcoesDaGrade = computed<Record<string, unknown>>({
      get: () => ({ ...((layoutOptions.value?.tabular ?? {}) as object) }),
      set: (valor) => {
        layoutOptions.value = { ...layoutOptions.value, tabular: valor };
      },
    });

    const opcoesDoMapa = computed<Record<string, unknown>>({
      get: () => ({
        geometryField: geometriaDetectada.value,
        ...((layoutOptions.value?.map ?? {}) as object),
      }),
      set: (valor) => {
        layoutOptions.value = { ...layoutOptions.value, map: valor };
      },
    });

    /*
     * A consulta é uma só, dividida pelos dois. Sem isto cada layout faz a
     * própria busca, com campos e ordenação diferentes — medido no spike.
     */
    const consulta = computed<Record<string, unknown>>({
      get: () => ({ ...(layoutQuery.value ?? {}) }),
      set: (valor) => {
        layoutQuery.value = valor as unknown as LayoutQuery;
      },
    });

    const propsPara = (opcoes: Opcoes): LayoutProps =>
      reactive({
        collection,
        selection,
        layoutOptions: opcoes,
        layoutQuery: consulta,
        layoutProps: ref({}),
        filter,
        filterUser: ref(null),
        filterSystem: ref(null),
        search,
        showSelect: ref('multiple'),
        selectMode: ref(false),
        readonly: ref(false),
        resetPreset: ref(undefined),
        clearFilters: ref(undefined),
      }) as unknown as LayoutProps;

    const emitirPara =
      (opcoes: Opcoes) =>
      (evento: string, valor: unknown): void => {
        if (evento === 'update:layoutQuery') consulta.value = valor as Record<string, unknown>;
        if (evento === 'update:layoutOptions') opcoes.value = valor as Record<string, unknown>;
        if (evento === 'update:selection') selection.value = valor as (string | number)[];
      };

    const embutir = (id: string, opcoes: Opcoes): LayoutEmbutido | null =>
      embutirLayout({
        id,
        registro: layouts.value,
        props: propsPara(opcoes),
        emit: emitirPara(opcoes),
      });

    const grade = embutir(LAYOUTS_EMBUTIDOS.grade, opcoesDaGrade);
    const mapa = embutir(LAYOUTS_EMBUTIDOS.mapa, opcoesDoMapa);

    /** A única opção que não vem de nenhum dos dois: é da composição. */
    const zoomOnClick = computed<boolean | undefined>({
      get: () => layoutOptions.value?.zoomOnClick,
      set: (valor) => {
        layoutOptions.value = { ...layoutOptions.value, zoomOnClick: valor };
      },
    });

    /** O app lê estes daqui para desenhar paginação e contagem. */
    const daGrade = <T>(chave: string, vazio: T) =>
      computed<T>(() => (grade?.state[chave] as T) ?? vazio);

    const items = daGrade<GeoItem[]>('items', []);

    const selectedItems = computed<GeoItem[]>(() =>
      items.value.filter((item) => selection.value.includes(item.id))
    );

    const deleteSelectedItems = async (): Promise<void> => {
      if (selection.value.length === 0) return;

      await api.delete(`/items/${collection.value}`, { data: [...selection.value] });
      selection.value = [];
      (grade?.state.refresh as (() => void) | undefined)?.();
      (mapa?.state.refresh as (() => void) | undefined)?.();
    };

    return {
      items,
      loading: daGrade('loading', false),
      error: daGrade<unknown>('error', null),
      totalPages: daGrade('totalPages', 1),
      itemCount: daGrade('itemCount', 0),
      totalCount: daGrade('totalCount', 0),
      page: writableQuery.page,
      limit: writableQuery.limit,
      sort: writableQuery.sort,
      fieldsInCollection,
      primaryKeyField,
      selectedItems,
      deleteSelectedItems,
      zoomOnClick,
      /*
       * O Directus entrega o retorno deste `setup()` ao componente E ao painel
       * de opções, que são irmãos na árvore. É por isso que os dois embutidos
       * nascem aqui: a área que desenha e o painel que configura passam a
       * enxergar o mesmo estado, sem um segundo wrapper e sem busca a mais.
       */
      grade,
      mapa,
    };
  },
});

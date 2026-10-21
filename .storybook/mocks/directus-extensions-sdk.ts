import { computed, type Ref, ref } from 'vue';

function useCollection() {
  return {
    fields: ref([]) as Ref<Array<{ name: string; field: string; meta?: { interface?: string } }>>,
  };
}

function useSync<Props extends Record<string, unknown>, Key extends keyof Props & string>(
  props: Props,
  key: Key,
  emit: (event: `update:${Key}`, value: Props[Key]) => void
) {
  return computed({
    get: () => props[key],
    set: (value: Props[Key]) => emit(`update:${key}`, value),
  });
}

function defineLayout<Options>(options: Options): Options {
  return options;
}

function useItems() {
  return {
    items: ref([]),
    loading: ref(false),
    error: ref(null),
    totalPages: ref(0),
    itemCount: ref(0),
    totalCount: ref(0),
  };
}

function useApi() {
  return {
    get: async () => ({ data: [] }),
    delete: async () => ({}),
    post: async () => ({ data: {} }),
    patch: async () => ({ data: {} }),
  };
}

export { defineLayout, useApi, useCollection, useItems, useSync };

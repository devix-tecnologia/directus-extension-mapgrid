import { computed, type Ref, ref } from 'vue';

function useCollection() {
  return {
    fields: ref([]) as Ref<Array<{ name: string; field: string; meta?: { interface?: string } }>>,
  };
}

function useSync(
  props: Record<string, any>,
  key: string,
  emit: (event: string, ...args: any[]) => void
) {
  return computed({
    get: () => props[key],
    set: (val: any) => emit(`update:${key}`, val),
  });
}

function defineLayout(options: any) {
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

/**
 * O ambiente que o app do Directus dá a uma extensão, reproduzido para stories e
 * testes: os componentes globais `v-*`, a diretiva de tooltip, o cliente de api
 * e as stores. As fixtures de domínio ficam em `mappable-mocks.ts` — aqui é só
 * o entorno.
 */
import type { App, Component, Directive } from 'vue';

export const createStub = (name: string, props: string[] = []) => ({
  template: `<div class="${name}"><slot /></div>`,
  props,
});

export const vTableStub: Component = {
  name: 'v-table',
  props: {
    items: { type: Array, default: () => [] },
    headers: { type: Array, default: () => [] },
    showSelect: { type: Boolean, default: false },
    showResize: { type: Boolean, default: false },
    fixedHeader: { type: Boolean, default: false },
    modelValue: { default: () => [] },
    canDelete: { type: Boolean, default: true },
  },
  emits: ['click:row', 'update:modelValue'],
  data() {
    return {
      localSelected: Object.assign([], this.modelValue ?? []),
    };
  },
  computed: {
    normalizedItems(): { id: string | number }[] {
      return this.items ?? [];
    },
    selectedIds(): (string | number)[] {
      const source =
        (this.localSelected ?? []).length > 0 ? this.localSelected : (this.modelValue ?? []);
      return source.map((item: { id: string | number }) => item.id);
    },
    isAllSelected(): boolean {
      return (
        this.normalizedItems.length > 0 && this.selectedIds.length === this.normalizedItems.length
      );
    },
  },
  watch: {
    modelValue: {
      handler(value: unknown[]): void {
        this.localSelected = [...(value ?? [])];
      },
      deep: true,
    },
  },
  template: `
    <div class="v-table v-table-mock">
      <table>
        <thead>
          <tr>
            <th
              v-if="showSelect"
              class="v-table-mock__select"
              style="width: 48px;"
            >
              <input
                type="checkbox"
                :checked="isAllSelected"
                :disabled="!canDelete"
                @click.stop
                @change="canDelete && onSelectAll"
              />
            </th>
            <th v-for="h in headers" :key="h.value">{{ h.text }}</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="item in items"
            :key="item.id"
            :data-id="item.id"
            @click="$emit('click:row', { item })"
          >
            <td
              v-if="showSelect"
              class="v-table-mock__select"
              @click.stop
            >
              <input
                type="checkbox"
                :checked="selectedIds.includes(item.id)"
                :disabled="!canDelete"
                @change="canDelete && toggleItem(item)"
              />
            </td>
            <td v-for="h in headers" :key="h.value">
              <slot :name="'item.' + h.value" :item="item">{{ item[h.value] }}</slot>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
  methods: {
    onSelectAll(event: Event): void {
      const target = event.target;
      if (!(target instanceof HTMLInputElement)) return;

      this.localSelected = target.checked ? [...this.items] : [];
      this.$emit('update:modelValue', this.localSelected);
    },
    toggleItem(item: { id: string | number }): void {
      const current = [...this.selectedIds];
      this.localSelected = current.includes(item.id)
        ? this.localSelected.filter((el: { id: string | number }) => el.id !== item.id)
        : [...this.localSelected, item];
      this.$emit('update:modelValue', this.localSelected);
    },
  },
};

const vInfoStub: Component = {
  name: 'v-info',
  props: {
    icon: { type: String, default: 'info' },
    title: { type: String, default: '' },
    center: { type: Boolean, default: false },
  },
  template: `
    <div class="v-info" :class="{ 'v-info--center': center }">
      <div class="v-info__title">{{ title }}</div>
      <slot name="append" />
      <slot />
    </div>
  `,
};

const vProgressCircularStub: Component = {
  name: 'v-progress-circular',
  props: {
    indeterminate: { type: Boolean, default: false },
  },
  template:
    '<div class="v-progress-circular"><span class="v-progress-circular__ring"></span></div>',
};

const vButtonStub: Component = {
  name: 'v-button',
  props: {
    icon: { type: Boolean, default: false },
    rounded: { type: Boolean, default: false },
    danger: { type: Boolean, default: false },
    warning: { type: Boolean, default: false },
    secondary: { type: Boolean, default: false },
    outlined: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
    type: { type: String, default: 'button' },
    small: { type: Boolean, default: false },
    xSmall: { type: Boolean, default: false },
    large: { type: Boolean, default: false },
    xLarge: { type: Boolean, default: false },
    fullWidth: { type: Boolean, default: false },
  },
  emits: ['click'],
  template: `
    <div
      class="v-button v-button-mock"
      :class="{ secondary, danger, warning, outlined, 'full-width': fullWidth, rounded }"
    >
      <button
        type="button"
        class="button mock-button"
        :class="[
          sizeClass,
          {
            icon,
            outlined,
            rounded,
            secondary,
            danger,
            warning,
            'full-width': fullWidth,
          },
        ]"
        :disabled="disabled"
        @click="$emit('click', $event)"
      >
        <div class="content">
          <slot />
        </div>
      </button>
    </div>
  `,
  computed: {
    sizeClass(): string {
      if (this.xSmall) return 'x-small';
      if (this.small) return 'small';
      if (this.large) return 'large';
      if (this.xLarge) return 'x-large';
      return '';
    },
  },
};

const vIconStub: Component = {
  name: 'v-icon',
  props: {
    name: { type: String, default: '' },
    small: { type: Boolean, default: false },
    large: { type: Boolean, default: false },
  },
  computed: {
    isEdit(): boolean {
      return this.name === 'edit';
    },
    sizeClass(): string {
      if (this.small) return 'v-icon-mock--small';
      if (this.large) return 'v-icon-mock--large';
      return '';
    },
  },
  template: `
    <span
      class="v-icon v-icon-mock"
      :class="sizeClass"
    >
      <svg
        v-if="isEdit"
        viewBox="0 0 24 24"
        width="20"
        height="20"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.9959.9959 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
      </svg>
      <template v-else>{{ name }}</template>
    </span>
  `,
};

const vDetailStub: Component = {
  name: 'v-detail',
  props: {
    icon: { type: String, default: '' },
    header: { type: String, default: '' },
  },
  template: `
    <details class="v-detail">
      <summary class="v-detail__summary">{{ header }}</summary>
      <div class="v-detail__content"><slot /></div>
    </details>
  `,
};

const vSelectStub: Component = {
  name: 'v-select',
  props: {
    modelValue: { default: null },
    items: { type: Array, default: () => [] },
    placeholder: { type: String, default: '' },
    showDeselect: { type: Boolean, default: false },
    itemText: { type: String, default: 'text' },
    itemValue: { type: String, default: 'value' },
  },
  emits: ['update:modelValue'],
  template: `
    <select
      class="v-select-mock"
      :value="modelValue ?? ''"
      @change="$emit('update:modelValue', $event.target.value || null)"
    >
      <option v-if="placeholder" value="">{{ placeholder }}</option>
      <option
        v-for="item in items"
        :key="item[itemValue]"
        :value="item[itemValue]"
      >
        {{ item[itemText] }}
      </option>
    </select>
  `,
};

const vCheckboxStub: Component = {
  name: 'v-checkbox',
  props: {
    modelValue: { type: Boolean, default: false },
    label: { type: String, default: '' },
  },
  emits: ['update:modelValue'],
  template: `
    <label class="v-checkbox-mock">
      <input
        type="checkbox"
        :checked="modelValue"
        @change="$emit('update:modelValue', $event.target.checked)"
      />
      <span>{{ label }}</span>
    </label>
  `,
};

const vCollectionFieldTemplateStub: Component = {
  name: 'v-collection-field-template',
  props: {
    modelValue: { type: String, default: '' },
    collection: { type: String, default: '' },
  },
  emits: ['update:modelValue'],
  template: `
    <input
      class="v-collection-field-template-mock"
      type="text"
      :value="modelValue"
      @input="$emit('update:modelValue', $event.target.value)"
    />
  `,
};

const vInputStub: Component = {
  name: 'v-input',
  props: {
    modelValue: { default: null },
    label: { type: String, default: '' },
    placeholder: { type: String, default: '' },
    type: { type: String, default: 'text' },
    step: { type: String, default: undefined },
    min: { type: String, default: undefined },
    max: { type: String, default: undefined },
  },
  emits: ['update:modelValue'],
  template: `
    <label class="v-input-mock">
      <span v-if="label" class="v-input-mock__label">{{ label }}</span>
      <input
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :step="step"
        :min="min"
        :max="max"
        @input="$emit('update:modelValue', $event.target.value)"
      />
    </label>
  `,
};

export const directusComponentStubs: Record<string, Component> = {
  'v-button': vButtonStub,
  'v-icon': vIconStub,
  'v-dialog': createStub('v-dialog', ['modelValue']),
  'v-card': createStub('v-card'),
  'v-card-title': createStub('v-card-title'),
  'v-card-text': createStub('v-card-text'),
  'v-card-actions': createStub('v-card-actions'),
  'v-table': vTableStub,
  'v-info': vInfoStub,
  'v-detail': vDetailStub,
  'v-select': vSelectStub,
  'v-input': vInputStub,
  'v-checkbox': vCheckboxStub,
  'v-collection-field-template': vCollectionFieldTemplateStub,
  'v-progress-circular': vProgressCircularStub,
};

export const tooltipDirective: Directive = {
  mounted(): void {},
  updated(): void {},
};

const mockComponentsStyles = `
.v-button-mock, .v-icon-mock, .v-select-mock, .v-checkbox-mock {
  font-family: inherit;
}
.v-button-mock {
  display: inline-flex;
  align-items: center;
}
.v-button-mock.full-width {
  display: flex;
  min-inline-size: 100%;
}
.v-button-mock .mock-button {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  inline-size: auto;
  min-inline-size: 7.875rem;
  block-size: 2.5rem;
  padding: 0 1.0625rem;
  color: var(--v-button-color, var(--theme--primary, #6644ff));
  font-weight: 600;
  font-size: 0.875rem;
  line-height: 1.4286;
  text-decoration: none;
  background-color: var(--v-button-background-color, var(--theme--primary, #6644ff));
  border: var(--theme--border-width, 1px) solid var(--v-button-background-color, var(--theme--primary, #6644ff));
  border-radius: var(--theme--border-radius, 6px);
  cursor: pointer;
  transition: 200ms ease;
  transition-property: background-color, border, color;
}
.v-button-mock .mock-button:hover {
  color: var(--v-button-color-hover, var(--theme--primary, #6644ff));
  background-color: var(--v-button-background-color-hover, var(--theme--primary, #6644ff));
  border-color: var(--v-button-background-color-hover, var(--theme--primary, #6644ff));
}
.v-button-mock .mock-button:disabled {
  color: var(--theme--foreground-subdued, #999);
  background-color: var(--theme--background-normal, #fff);
  border: var(--theme--border-width, 1px) solid var(--theme--background-normal, #fff);
  cursor: not-allowed;
}
.v-button-mock .mock-button.icon {
  inline-size: 2.5rem;
  min-inline-size: 0;
  padding: 0;
}
.v-button-mock.rounded .mock-button,
.v-button-mock.rounded {
  border-radius: 50%;
}
.v-button-mock.secondary .mock-button {
  color: var(--theme--foreground, #212222);
  background-color: var(--theme--background-normal, #fff);
  border-color: var(--theme--border-normal, var(--theme--border-color-subdued, #e0e0e0));
}
.v-button-mock.secondary.rounded .mock-button {
  background-color: var(--theme--background-normal, #fff);
}
.v-button-mock.danger .mock-button {
  color: var(--white, #fff);
  background-color: var(--theme--danger, #e53935);
  border-color: var(--theme--danger, #e53935);
}
.v-button-mock.warning .mock-button {
  color: var(--white, #fff);
  background-color: var(--theme--warning, #ff9800);
  border-color: var(--theme--warning, #ff9800);
}
.v-button-mock .mock-button .content {
  display: flex;
  align-items: center;
  max-inline-size: 100%;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  line-height: normal;
}
.v-button-mock .mock-button.x-small {
  inline-size: 1.5625rem;
  block-size: 1.5625rem;
  min-inline-size: 3.375rem;
  font-size: 0.6875rem;
  padding: 0 0.6875rem;
}
.v-button-mock .mock-button.small {
  inline-size: 2rem;
  block-size: 2rem;
  min-inline-size: 6.75rem;
  font-size: 0.8125rem;
  padding: 0 0.6875rem;
}
.v-button-mock .mock-button.x-small.icon,
.v-button-mock .mock-button.small.icon {
  min-inline-size: 0;
  padding: 0;
}
.v-icon-mock {
  display: inline-flex;
  align-items: center;
  font-size: 20px;
  line-height: 1;
  color: var(--v-icon-color, var(--theme--primary, var(--theme--primary, #6644ff)));
}
.v-progress-circular {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  inline-size: 24px;
  block-size: 24px;
  color: var(--theme--primary, #6644ff);
}
.v-progress-circular__ring {
  inline-size: 100%;
  block-size: 100%;
  border-radius: 50%;
  border: 2px solid var(--theme--primary, #6644ff);
  border-top-color: transparent;
  animation: v-progress-circular-spin 0.8s linear infinite;
}
@keyframes v-progress-circular-spin {
  to { transform: rotate(360deg); }
}
.v-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  padding: 24px 32px;
  border: 1px dashed #ccc;
  border-radius: 8px;
  background: #fafafa;
}
.v-info--center {
  align-items: center;
  text-align: center;
  justify-content: center;
}
.v-info__title {
  font-weight: 600;
}
.v-detail {
  border: 1px solid #eee;
  border-radius: 6px;
  margin-bottom: 8px;
  padding: 8px 12px;
  background: #fff;
}
.v-detail__summary {
  cursor: pointer;
  font-weight: 600;
  color: var(--theme--foreground, #212222);
}
.v-detail__content {
  padding-top: 8px;
}
.v-select-mock,
.v-collection-field-template-mock {
  width: 100%;
  padding: 6px;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-family: inherit;
}
.v-input-mock {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-family: inherit;
}
.v-input-mock__label {
  font-size: 12px;
  color: var(--theme--foreground-subdued, #666);
}
.v-input-mock input {
  padding: 6px;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-family: inherit;
}
.v-checkbox-mock {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-family: inherit;
  cursor: pointer;
}
.v-table-mock { width: 100%; }
.v-table-mock table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}
.v-table-mock th {
  position: sticky;
  top: 0;
  z-index: 1;
  background: var(--theme--background-subdued, #f4f5f7);
  border: 1px solid #eee;
  padding: 6px 10px;
  text-align: left;
}
.v-table-mock td {
  border: 1px solid #eee;
  padding: 6px 10px;
  text-align: left;
}
.v-table-mock tbody tr:hover { background: #f5f5f5; }
`;

export function registerDirectusMockComponents(app: App): void {
  const styleId = 'directus-mock-components-styles';
  if (typeof document !== 'undefined' && !document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = mockComponentsStyles;
    document.head.appendChild(style);
  }

  Object.entries(directusComponentStubs).forEach(([name, component]) => {
    if (!app.component(name)) {
      app.component(name, component);
    }
  });

  if (!app.directive('tooltip')) {
    app.directive('tooltip', tooltipDirective);
  }
}

/** Uma rota que o cliente de api falso atende, por método e caminho. */
export interface MockApiRoute {
  method: 'get' | 'post' | 'patch' | 'delete';
  /** Caminho exato, ou um prefixo terminado em `/`. */
  path: string;
  respond: (config?: { data?: unknown }) => unknown;
}

const routeMatches = (route: MockApiRoute, method: string, url: string): boolean =>
  route.method === method &&
  (route.path.endsWith('/') ? url.startsWith(route.path) : url === route.path);

/**
 * O cliente de api do Directus, servindo rotas declaradas. Sem rotas devolve uma
 * resposta vazia — mas uma story que exercita busca ou exclusão precisa que a
 * chamada devolva algo coerente, e não `{}`.
 */
export function createMockApi({ routes = [] }: { routes?: MockApiRoute[] } = {}) {
  const handle =
    (method: MockApiRoute['method']) =>
    async (url: string, config?: { data?: unknown }): Promise<{ data: unknown }> => {
      const route = routes.find((candidate) => routeMatches(candidate, method, url));
      return { data: route ? route.respond(config) : method === 'get' ? [] : {} };
    };

  return {
    get: handle('get'),
    post: handle('post'),
    patch: handle('patch'),
    delete: handle('delete'),
  };
}

/** Um campo de coleção como as stores do Directus o descrevem. */
export interface MockCollectionField {
  field: string;
  primaryKey?: boolean;
  /** `null` é como o Directus grava "sem interface", e não ausência do campo. */
  meta?: { interface?: string | null } | null;
}

/** Uma coleção como as stores do Directus a descrevem. */
export interface MockCollection {
  collection: string;
  icon?: string;
  fields?: MockCollectionField[];
}

/** As stores do app, com as coleções que as stories precisam que `useCollection()` resolva. */
export function createMockStores(
  collections: MockCollection[] = [{ collection: 'mapgrid' }]
): Record<string, () => unknown> {
  const collectionsStore = {
    collections: collections.map((entry) => ({
      collection: entry.collection,
      icon: entry.icon ?? 'map',
      meta: { sort_field: null, singleton: false, accountability: null },
    })),
  };

  const fieldsStore = {
    getFieldsForCollection: (collection: string) =>
      collections.find((entry) => entry.collection === collection)?.fields ?? [],
  };

  return {
    useCollectionsStore: () => collectionsStore,
    useFieldsStore: () => fieldsStore,
    usePermissionsStore: () => ({ hasPermission: () => true }),
    useUserStore: () => ({ currentUser: { id: 1, email: 'test@example.com' } }),
  };
}

/**
 * The environment the Directus app gives an extension, reproduced for stories
 * and tests: the global `v-*` components, the tooltip directive, the api client
 * and the stores. Domain fixtures live in `mappable-mocks.ts` — this file is
 * only the surroundings.
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

/**
 * The app's `v-icon` draws a Material Symbols glyph from the name. Here the
 * name travels as an attribute and the CSS turns it into the glyph, instead of
 * becoming a text node: that keeps `textContent` empty, so an assertion on a
 * button's label does not pick up the word "delete" along with it.
 */
const vIconStub: Component = {
  name: 'v-icon',
  props: {
    name: { type: String, default: '' },
    small: { type: Boolean, default: false },
    large: { type: Boolean, default: false },
  },
  template: `
    <i
      class="v-icon v-icon-mock"
      :data-name="name"
      :data-size="small ? 'small' : large ? 'large' : undefined"
    />
  `,
};

/**
 * O `v-detail` do app recebe `label`, e nao `header`. O stub aceitava `header` e
 * renderizava o titulo assim mesmo, o que escondeu por muito tempo que no
 * Directus real as secoes do painel de opcoes apareciam todas rotuladas como
 * "Toggle" — o texto padrao do componente quando `label` nao vem. Espelhar o
 * contrato real e o que impede o stub de mentir de novo.
 */
const vDetailStub: Component = {
  name: 'v-detail',
  props: {
    icon: { type: String, default: '' },
    label: { type: String, default: '' },
    startOpen: { type: Boolean, default: false },
  },
  template: `
    <details class="v-detail" :open="startOpen">
      <summary class="v-detail__summary">{{ label }}</summary>
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

/**
 * The app's field picker, as the tabular layout uses it: it renders the
 * collection's field tree and emits the chosen keys. The real one reads the
 * fields store; here the caller passes what it wants offered.
 */
const vFieldListStub: Component = {
  name: 'v-field-list',
  props: {
    collection: { type: String, default: '' },
    disabledFields: { type: Array, default: () => [] },
    field: { type: String, default: '' },
  },
  emits: ['add'],
  template: `
    <div class="v-field-list v-field-list-mock"><slot /></div>
  `,
};

/**
 * The app's popover. The real one opens on the activator and teleports its
 * content; here the content stays in place and the activator's `toggle` is a
 * no-op, because what a test or a story needs is the content mounted and
 * reachable, not the floating behaviour.
 */
const vMenuStub: Component = {
  name: 'v-menu',
  props: {
    placement: { type: String, default: 'bottom' },
    showArrow: { type: Boolean, default: false },
  },
  template: `
    <div class="v-menu v-menu-mock">
      <slot name="activator" :toggle="() => {}" :active="true" />
      <div class="v-menu-mock__content"><slot /></div>
    </div>
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
  'v-field-list': vFieldListStub,
  'v-menu': vMenuStub,
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
/*
 * The real icon, from the name in the attribute.
 *
 * Material Symbols maps a ligature (\`map\`, \`delete\`) to a glyph, and
 * ligatures apply to generated content too — so the name can live in the CSS
 * \`content\` instead of in a text node. That is what keeps \`textContent\`
 * empty, and a test's assertion on a button label untouched. Without the font
 * (offline) the name shows as text, which is still readable. The font comes
 * from .storybook/preview-head.html.
 */
.v-icon-mock {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-style: normal;
  line-height: 1;
  vertical-align: middle;
  color: var(--v-icon-color, var(--theme--primary, #6644ff));
  transition: color var(--transition-fast, 120ms) var(--transition, ease);
}
.v-icon-mock::before {
  content: attr(data-name);
  font-family: 'Material Symbols Rounded', monospace;
  font-weight: 400;
  font-size: var(--v-icon-size, 24px);
  line-height: 1;
  letter-spacing: normal;
  font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
  font-feature-settings: 'liga';
  word-wrap: normal;
  direction: ltr;
}
.v-icon-mock[data-size='small']::before {
  font-size: var(--v-icon-size, 18px);
}
.v-icon-mock[data-size='large']::before {
  font-size: var(--v-icon-size, 36px);
}
.v-icon-mock:hover {
  color: var(--v-icon-color-hover, var(--v-icon-color, var(--theme--primary, #6644ff)));
}
.v-select-mock {
  inline-size: 100%;
  box-sizing: border-box;
  min-block-size: 44px;
  padding: 0 12px;
  border: var(--theme--border-width, 1px) solid var(--theme--border-color, #d9d9d9);
  border-radius: var(--theme--border-radius, 6px);
  background: var(--theme--form--field--input--background, #fff);
  color: var(--theme--form--field--input--foreground, #212222);
  font-size: 14px;
}
.v-select-mock:focus {
  outline: none;
  border-color: var(--theme--primary, #6644ff);
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

/** A route the fake api client serves, by method and path. */
export interface MockApiRoute {
  method: 'get' | 'post' | 'patch' | 'delete';
  /** An exact path, or a prefix ending in `/`. */
  path: string;
  respond: (config?: { data?: unknown }) => unknown;
}

const routeMatches = (route: MockApiRoute, method: string, url: string): boolean =>
  route.method === method &&
  (route.path.endsWith('/') ? url.startsWith(route.path) : url === route.path);

/**
 * The Directus api client, serving declared routes. With no routes it returns
 * an empty response — but a story that exercises fetching or deleting needs the
 * call to return something coherent, not `{}`.
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

/** A collection field as the Directus stores describe it. */
export interface MockCollectionField {
  field: string;
  primaryKey?: boolean;
  /** `null` is how Directus stores "no interface", not a missing field. */
  meta?: { interface?: string | null } | null;
}

/** A collection as the Directus stores describe it. */
export interface MockCollection {
  collection: string;
  icon?: string;
  fields?: MockCollectionField[];
}

/** The app stores, with the collections stories need `useCollection()` to resolve. */
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

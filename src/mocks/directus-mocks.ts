import type { App, Component, Directive } from 'vue';
import type { GeoItem } from '../services/geo/geo.types.js';
import type { Header } from '../services/table/table.types.js';

export const mockGeoItems: GeoItem[] = [
  {
    id: 1,
    nome: 'Praça São Paulo',
    localizacao: { type: 'Point', coordinates: [-46.6333, -23.5505] },
  },
  {
    id: 2,
    nome: 'Museu do Amanhã',
    localizacao: { type: 'Point', coordinates: [-43.1943, -22.8942] },
  },
  {
    id: 3,
    nome: 'Parque Ibirapuera',
    localizacao: { type: 'Point', coordinates: [-46.6598, -23.5874] },
  },
  {
    id: 4,
    nome: 'Cristo Redentor',
    localizacao: { type: 'Point', coordinates: [-43.2105, -22.9519] },
  },
];

export const mockHeaders: Header[] = [
  { text: 'ID', value: 'id' },
  { text: 'Nome', value: 'nome' },
  { text: 'Localização', value: 'localizacao' },
];

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
  },
  emits: ['click:row', 'update:modelValue'],
  template: `
    <div class="v-table v-table-mock">
      <table>
        <thead>
          <tr>
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
            <td v-for="h in headers" :key="h.value">
              <slot :name="'item.' + h.value" :item="item">{{ item[h.value] }}</slot>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
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
  template: '<div class="v-progress-circular">⏳</div>',
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
  template: `
    <span
      class="v-icon v-icon-mock"
      :class="{ 'v-icon-mock--small': small, 'v-icon-mock--large': large }"
    >
      {{ name }}
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

export function createMockApi(): Record<string, () => Promise<{ data: unknown }>> {
  return {
    get: async () => ({ data: {} }),
    post: async () => ({ data: {} }),
    patch: async () => ({ data: {} }),
    delete: async () => ({ data: {} }),
  };
}

export function createMockStores(): Record<string, () => unknown> {
  const collectionsStore = {
    collections: [
      {
        collection: 'mapgrid',
        meta: { sort_field: null, singleton: false, accountability: null },
      },
    ],
  };

  return {
    useCollectionsStore: () => collectionsStore,
    usePermissionsStore: () => ({ hasPermission: () => true }),
    useUserStore: () => ({ currentUser: { id: 1, email: 'test@example.com' } }),
  };
}

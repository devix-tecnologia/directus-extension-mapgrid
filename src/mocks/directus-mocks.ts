import type { App, Component } from 'vue';
import type { GeoItem } from '../services/geo/geo.types.js';

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

export const mockHeaders = [
  { text: 'ID', value: 'id' },
  { text: 'Nome', value: 'nome' },
  { text: 'Localização', value: 'localizacao' },
];

export const DirectusMockComponents: Record<string, Component> = {
  'v-button': {
    name: 'v-button',
    props: {
      icon: { type: Boolean, default: false },
      rounded: { type: Boolean, default: false },
    },
    emits: ['click'],
    template: `
      <button class="v-button-mock" type="button" @click="$emit('click', $event)">
        <slot />
      </button>
    `,
  },
  'v-icon': {
    name: 'v-icon',
    props: {
      name: { type: String, default: '' },
      small: { type: Boolean, default: false },
      large: { type: Boolean, default: false },
    },
    template: `
      <span class="v-icon-mock" :class="{ 'v-icon-mock--small': small, 'v-icon-mock--large': large }">
        {{ name }}
      </span>
    `,
  },
  'v-info': {
    name: 'v-info',
    props: {
      title: { type: String, default: '' },
      icon: { type: String, default: 'info' },
      center: { type: Boolean, default: false },
    },
    template: `
      <div class="v-info-mock" :class="{ 'v-info-mock--center': center }">
        <div class="v-info-mock__title">{{ title }}</div>
        <slot name="append" />
        <slot />
      </div>
    `,
  },
  'v-progress-circular': {
    name: 'v-progress-circular',
    props: {
      indeterminate: { type: Boolean, default: false },
    },
    template: '<div class="v-progress-circular-mock">⏳</div>',
  },
  'v-detail': {
    name: 'v-detail',
    props: {
      header: { type: String, default: '' },
      icon: { type: String, default: '' },
    },
    template: `
      <details class="v-detail-mock">
        <summary class="v-detail-mock__summary">{{ header }}</summary>
        <div class="v-detail-mock__content"><slot /></div>
      </details>
    `,
  },
  'v-select': {
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
  },
  'v-checkbox': {
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
  },
  'v-collection-field-template': {
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
  },
  'v-table': {
    name: 'v-table',
    props: {
      headers: { type: Array, default: () => [] },
      items: { type: Array, default: () => [] },
      fixedHeader: { type: Boolean, default: false },
      showSelect: { type: Boolean, default: false },
      showResize: { type: Boolean, default: false },
    },
    emits: ['click:row'],
    template: `
      <div class="v-table-mock">
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
  },
};

const vTooltip = {
  mounted(): void {},
  updated(): void {},
};

const mockComponentsStyles = `
.v-button-mock, .v-icon-mock, .v-select-mock, .v-checkbox-mock {
  font-family: inherit;
}
.v-button-mock {
  padding: 6px 12px;
  border: 1px solid #ccc;
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
}
.v-info-mock {
  padding: 16px;
  border: 1px dashed #ccc;
  border-radius: 8px;
  background: #fafafa;
}
.v-info-mock--center { text-align: center; }
.v-info-mock__title { font-weight: 600; margin-bottom: 4px; }
.v-detail-mock { border: 1px solid #eee; border-radius: 6px; margin-bottom: 8px; padding: 8px; }
.v-detail-mock__summary { cursor: pointer; font-weight: 600; }
.v-select-mock, .v-collection-field-template-mock { width: 100%; padding: 6px; border: 1px solid #ccc; border-radius: 6px; }
.v-table-mock table { width: 100%; border-collapse: collapse; }
.v-table-mock th, .v-table-mock td { border: 1px solid #eee; padding: 6px 10px; text-align: left; }
.v-table-mock tbody tr:hover { background: #f5f5f5; }
`;

export function registerDirectusMockComponents(app: App): void {
  const styleId = 'directus-mock-components-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = mockComponentsStyles;
    document.head.appendChild(style);
  }

  Object.entries(DirectusMockComponents).forEach(([name, component]) => {
    if (!app.component(name)) {
      app.component(name, component);
    }
  });

  if (!app.directive('tooltip')) {
    app.directive('tooltip', vTooltip);
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

  const fieldsStore = {
    getFieldsForCollectionSorted: () => [
      {
        collection: 'mapgrid',
        field: 'id',
        schema: { is_primary_key: true, default_value: null },
        meta: null,
      },
      {
        collection: 'mapgrid',
        field: 'nome',
        schema: { default_value: null },
        meta: { interface: 'input' },
      },
      {
        collection: 'mapgrid',
        field: 'localizacao',
        schema: null,
        meta: { interface: 'map' },
      },
    ],
  };

  return {
    useCollectionsStore: () => collectionsStore,
    useFieldsStore: () => fieldsStore,
    usePermissionsStore: () => ({ hasPermission: () => true }),
    useUserStore: () => ({ currentUser: { id: 1, email: 'test@example.com' } }),
  };
}

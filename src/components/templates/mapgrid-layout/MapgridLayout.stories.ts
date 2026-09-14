import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect, waitFor } from 'storybook/test';
import { defineComponent } from 'vue';
import type { GeoItem } from '../../../services/geo/index.js';
import { generateMockData } from './MapgridLayout.mock';
import MapgridLayout from './MapgridLayout.vue';

const meta: Meta<typeof MapgridLayout> = {
  title: '04 - Templates/MapgridLayout',
  component: MapgridLayout,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

const mockData = generateMockData();

const layoutFrame = (args: Record<string, unknown>) => ({
  components: { MapgridLayout },
  setup: () => ({ args }),
  template: `
    <div style="width: 1000px; height: 600px;">
      <MapgridLayout v-bind="args" />
    </div>
  `,
});

export const Default: Story = {
  args: mockData.props,
  render: layoutFrame,
  play: async ({ canvasElement }) => {
    await waitFor(() => {
      expect(canvasElement.querySelector('.mapgrid-container')).toBeTruthy();
    });
  },
};

export const Loading: Story = {
  args: {
    ...mockData.props,
    loading: true,
  },
  render: layoutFrame,
};

export const Empty: Story = {
  args: {
    ...mockData.props,
    items: [],
    selectedItems: [],
  },
  render: layoutFrame,
};

const editFlowFrame = (args: Record<string, unknown>) =>
  defineComponent({
    components: { MapgridLayout },
    setup: () => ({ args }),
    data() {
      return {
        editingItem: null as GeoItem | null,
        draft: '' as string,
      };
    },
    methods: {
      openEdit(item: GeoItem) {
        this.editingItem = item;
        this.draft = String(item.nome);
      },
      saveEdit() {
        if (this.editingItem) this.editingItem.nome = this.draft;
        this.editingItem = null;
      },
      cancelEdit() {
        this.editingItem = null;
      },
    },
    template: `
      <div style="width: 1000px; height: 600px; position: relative;">
        <MapgridLayout v-bind="args" @edit-item="openEdit" />
        <div
          v-if="editingItem"
          data-testid="edit-overlay"
          style="position:absolute; inset:0; background: rgba(0,0,0,0.4); display:flex; align-items:center; justify-content:center; z-index:10;"
        >
          <div
            style="background: var(--theme--background-normal, #fff); border-radius: var(--theme--border-radius, 6px); box-shadow: var(--theme--elevation-2xl, 0 8px 24px rgba(0,0,0,0.2)); padding:24px; width:320px; display:flex; flex-direction:column; gap:12px;"
          >
            <h3>Editar item #{{ editingItem.id }}</h3>
            <label style="display:flex; flex-direction:column; gap:4px; font-size:0.875rem;">
              Nome
              <input v-model="draft" type="text" data-testid="edit-name" style="padding:8px; border:1px solid var(--theme--border-normal, #ccc); border-radius: var(--theme--border-radius, 6px);" />
            </label>
            <div style="display:flex; justify-content:flex-end; gap:8px;">
              <button type="button" @click="saveEdit" data-testid="edit-save" style="padding:8px 16px; border:none; border-radius: var(--theme--border-radius, 6px); cursor:pointer; background: var(--theme--primary, #6644ff); color:#fff;">Salvar</button>
              <button type="button" @click="cancelEdit" data-testid="edit-cancel" style="padding:8px 16px; border:none; border-radius: var(--theme--border-radius, 6px); cursor:pointer; background: var(--theme--background-subdued, #eee);">Cancelar</button>
            </div>
          </div>
        </div>
      </div>
    `,
  });

export const WithEditFlow: Story = {
  args: mockData.props,
  render: editFlowFrame,
  parameters: {
    docs: {
      description: {
        story:
          'Demonstra o fluxo completo de edição: o clique no lápis emite `edit-item`, ' +
          'que o consumidor intercepta para abrir uma tela de edição. O Mapgrid é um ' +
          'componente independente — não navega nem depende do Directus para editar.',
      },
    },
  },
};

export const ReadOnlyPermission: Story = {
  name: 'Permissão: sem edição e sem deleção',
  args: {
    ...mockData.props,
    canEdit: false,
    canDelete: false,
  },
  render: layoutFrame,
  parameters: {
    docs: {
      description: {
        story:
          'Usuário sem permissão de edição nem deleção: o lápis de edição não aparece e os ' +
          'checkboxes de seleção ficam desabilitados (não é possível selecionar para excluir).',
      },
    },
  },
};

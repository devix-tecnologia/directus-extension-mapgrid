import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect, fn, userEvent, waitFor } from 'storybook/test';
import { generateMockData } from './TableComponent.mock';
import TableComponent from './TableComponent.vue';

const meta: Meta<typeof TableComponent> = {
  title: '03 - Organisms/TableComponent',
  component: TableComponent,
  tags: ['autodocs'],
  argTypes: {
    collection: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const mockData = generateMockData();

const tableFrame = (args: Record<string, unknown>) => ({
  components: { TableComponent },
  setup: () => ({ args }),
  template: `
    <div style="width: 800px; height: 400px;">
      <TableComponent v-bind="args" />
    </div>
  `,
});

/** The column menu is a popup, so the `play` opens it the way a user would. */
const openHeaderMenu = async (canvasElement: HTMLElement, field: string): Promise<void> => {
  const header = canvasElement.querySelector<HTMLElement>(`[data-header="${field}"]`);
  expect(header).toBeTruthy();
  if (header) await userEvent.click(header);
};

export const Default: Story = {
  args: {
    ...mockData.props,
    selectedItems: [],
  },
  render: tableFrame,
  play: async ({ canvasElement }) => {
    const rows = canvasElement.querySelectorAll<HTMLTableRowElement>('tbody tr');
    const firstRow = rows[0];
    expect(firstRow).toBeTruthy();
    if (firstRow) await userEvent.click(firstRow);
  },
};

export const WithSelection: Story = {
  args: {
    ...mockData.props,
    selectedItems: [mockData.props.items[0]],
  },
  render: tableFrame,
};

export const EmptyState: Story = {
  args: {
    items: [],
    headers: mockData.props.headers,
    collection: mockData.props.collection,
    selectedItems: [],
  },
  render: tableFrame,
};

export const EditDisabled: Story = {
  name: 'Permissions: no edit',
  args: {
    ...mockData.props,
    canEdit: false,
  },
  render: tableFrame,
};

export const DeleteDisabled: Story = {
  name: 'Permissions: no delete',
  args: {
    ...mockData.props,
    canDelete: false,
  },
  render: tableFrame,
};

export const EditDeleteDisabled: Story = {
  name: 'Permissions: no edit, no delete',
  args: {
    ...mockData.props,
    canEdit: false,
    canDelete: false,
  },
  render: tableFrame,
};

/*
 * As colunas se escolhem no cabecalho, e nao no painel lateral. O `play` cobre
 * o caminho inteiro no navegador — o menu de contexto, o clique e o evento que
 * sobe — porque o unitario exercita o stub do `v-table`, e nao o de verdade.
 */
export const ChoosingColumns: Story = {
  name: 'Choosing columns from the header',
  args: {
    ...mockData.props,
    selectedItems: [],
    'onUpdate:fields': fn(),
  },
  render: tableFrame,
  play: async ({ args, canvasElement }) => {
    const { 'onUpdate:fields': onUpdateFields } = args as unknown as {
      'onUpdate:fields': ReturnType<typeof fn>;
    };

    const shown = mockData.props.headers.map((header) => header.value);
    const [first] = shown;
    expect(first).toBeTruthy();
    if (!first) return;

    await openHeaderMenu(canvasElement, first);

    const remove = await waitFor(() => {
      const item = canvasElement.querySelector<HTMLElement>(`[data-remove-field="${first}"]`);
      expect(item).toBeTruthy();
      return item;
    });
    if (!remove) return;

    await userEvent.click(remove);

    expect(onUpdateFields).toHaveBeenCalledWith(shown.slice(1));
  },
};

/*
 * Ordenar tambem mora no menu de contexto do cabecalho: o `v-table` do Directus
 * troca o clique que ordena por abrir o menu assim que esse slot existe.
 */
export const SortingFromTheHeader: Story = {
  name: 'Sorting from the header menu',
  args: {
    ...mockData.props,
    selectedItems: [],
    sort: [],
    'onUpdate:sort': fn(),
  },
  render: tableFrame,
  play: async ({ args, canvasElement }) => {
    const { 'onUpdate:sort': onUpdateSort } = args as unknown as {
      'onUpdate:sort': ReturnType<typeof fn>;
    };

    const [first] = mockData.props.headers.map((header) => header.value);
    expect(first).toBeTruthy();
    if (!first) return;

    await openHeaderMenu(canvasElement, first);

    const descending = await waitFor(() => {
      const item = canvasElement.querySelector<HTMLElement>(`[data-sort-desc="${first}"]`);
      expect(item).toBeTruthy();
      return item;
    });
    if (!descending) return;

    await userEvent.click(descending);

    expect(onUpdateSort).toHaveBeenCalledWith([`-${first}`]);
  },
};

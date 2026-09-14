import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { optionsPropsFor } from './MapgridOptions.mock';
import MapgridOptions from './MapgridOptions.vue';

/**
 * MapgridOptions — the sidebar panel that configures the layout.
 *
 * Purpose: let someone pick the geolocation field, the popup template, the
 * initial camera and the grid columns. The panel fetches nothing on its own:
 * the collection's fields arrive as a prop and every change goes up as an
 * event — which is what lets it mount here without the Directus app behind it.
 */
const meta: Meta<typeof MapgridOptions> = {
  title: '04 - Templates/MapgridOptions',
  component: MapgridOptions,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Popup, Geolocation, Map centre, Zoom on click and Grid columns sections.',
      },
    },
  },
  args: optionsPropsFor(),
  render: (args) => ({
    components: { MapgridOptions },
    setup: () => ({ args }),
    template: `
      <div style="width: 380px; padding: 16px; background: var(--theme--background-normal, #fff);">
        <MapgridOptions v-bind="args" />
      </div>
    `,
  }),
} satisfies Meta<typeof MapgridOptions>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A collection already set up: map field chosen and three columns filled in. */
export const Configurado: Story = {
  name: 'Configured collection',
};

export const OutraColecao: Story = {
  name: 'Another collection',
  args: optionsPropsFor('units'),
  parameters: {
    docs: {
      description: {
        story:
          'The fields on offer come from the collection, not from a fixed ' +
          'list: here the map field is called `position` and the columns differ.',
      },
    },
  },
};

export const SemConfiguracao: Story = {
  name: 'Nothing configured yet',
  args: {
    ...optionsPropsFor(),
    title: undefined,
    geolocation: undefined,
    mapCenterLng: undefined,
    mapCenterLat: undefined,
    mapZoom: undefined,
    fields: [],
    coluna1: undefined,
    coluna2: undefined,
    coluna3: undefined,
    coluna4: undefined,
    coluna5: undefined,
  },
  parameters: {
    docs: {
      description: {
        story:
          'How the panel opens on a freshly configured collection, before the ' +
          'layout stores the defaults it detected.',
      },
    },
  },
};

export const SemCampoDeMapa: Story = {
  name: 'Collection without a map field',
  args: {
    ...optionsPropsFor(),
    fieldsInCollection: [
      { name: 'Name', field: 'name', meta: null },
      { name: 'Status', field: 'status', meta: { interface: 'input' } },
    ],
  },
  parameters: {
    docs: {
      description: {
        story:
          'The geolocation select only offers fields with the `map` interface. ' +
          'On a collection with none it is left with the empty option only — ' +
          'which is the sign that the field has to be created before this ' +
          'layout can be used.',
      },
    },
  },
};

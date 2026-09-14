import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect, waitFor } from 'storybook/test';
import { mappableKind } from '../../../mocks/mappable-mocks';
import { mapPropsFor } from './MapComponent.mock';
import MapComponent from './MapComponent.vue';

/**
 * MapComponent — the collection's items as points on a map.
 *
 * Purpose: show where each item is and let you reach it in one click. The
 * component knows nothing about the collection beyond the field holding the
 * point and the label template, and the stories below are the situations that
 * produces: scattered points, points so close they become a cluster, points on
 * both sides of the date line, and a collection where half the items have no
 * point at all.
 */
const meta: Meta<typeof MapComponent> = {
  title: '03 - Organisms/MapComponent',
  component: MapComponent,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'MapLibre map with automatic clustering, a marker popup and ' +
          'grid synchronisation through the `select-item` event.',
      },
    },
  },
  argTypes: {
    geolocation: { control: 'text' },
    title: { control: 'text' },
    zoomOnClick: { control: 'boolean' },
    mapCenterLng: { control: 'number' },
    mapCenterLat: { control: 'number' },
    mapZoom: { control: 'number', min: 1, max: 20 },
  },
  args: mapPropsFor(),
  render: (args) => ({
    components: { MapComponent },
    setup: () => ({ args }),
    template: `
      <div style="width: 800px; height: 500px;">
        <MapComponent v-bind="args" />
      </div>
    `,
  }),
} satisfies Meta<typeof MapComponent>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Points far apart: the initial framing opens on the whole country. */
export const PontosEspalhados: Story = {
  name: 'Scattered points',
  play: async ({ canvasElement }) => {
    await waitFor(() => {
      expect(canvasElement.querySelector('.maplibregl-canvas')).toBeTruthy();
    });
  },
};

export const PontosAglomerados: Story = {
  name: 'Clustered points',
  args: mapPropsFor('units'),
  parameters: {
    docs: {
      description: {
        story:
          'A dozen points within a few blocks. Clustering gathers what would ' +
          'not fit apart, and the label shows how many items are there; ' +
          'clicking the cluster zooms in until it breaks open.',
      },
    },
  },
};

export const LinhaDeData: Story = {
  name: 'Both sides of the date line',
  args: mapPropsFor('sensors'),
  parameters: {
    docs: {
      description: {
        story:
          'The map scrolls endlessly along the east-west axis, so a point at ' +
          '-174° and a click at +179° are close on screen and 353° apart in ' +
          'arithmetic. The popup opens on the turn that is in view, not on a ' +
          'copy of the world outside it.',
      },
    },
  },
};

export const ItensSemPonto: Story = {
  name: 'Half-filled collection',
  args: mapPropsFor('works'),
  parameters: {
    docs: {
      description: {
        story:
          'Half the items have no point. They stay in the grid and are left ' +
          'off the map, instead of becoming a marker at (0, 0) in the Gulf of ' +
          'Guinea or breaking the clustering.',
      },
    },
  },
};

export const ZoomAoClicar: Story = {
  name: 'Zoom on row click',
  args: { ...mapPropsFor(), zoomOnClick: true },
  parameters: {
    docs: {
      description: {
        story:
          'With the option on, clicking a grid row flies to the point. With ' +
          'it off, the map only pans when the point is outside the view.',
      },
    },
  },
};

/** With no items the map still draws, centred where the preset said. */
export const SemItens: Story = {
  name: 'No items',
  args: { ...mapPropsFor(), items: [] },
};

/** The geolocation field is chosen in the options — here, another collection's. */
export const OutroCampoDeGeolocalizacao: Story = {
  name: 'Another geolocation field',
  args: mapPropsFor(mappableKind('units').id),
};

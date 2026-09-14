import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect, waitFor } from 'storybook/test';
import { mappableKind } from '../../../mocks/mappable-mocks.js';
import { mapPropsFor } from './MapComponent.mock.js';
import MapComponent from './MapComponent.vue';

/**
 * MapComponent — os itens da coleção como pontos num mapa.
 *
 * Objetivo: mostrar onde cada item está e deixar chegar nele com um clique. O
 * componente não sabe nada da coleção além do campo que guarda o ponto e do
 * template do rótulo, e as stories abaixo são as situações que isso produz:
 * pontos espalhados, pontos tão próximos que viram um agrupamento, pontos dos
 * dois lados da linha de data e uma coleção em que metade dos itens não tem
 * ponto nenhum.
 */
const meta: Meta<typeof MapComponent> = {
  title: '03 - Organismos/MapComponent',
  component: MapComponent,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Mapa MapLibre com agrupamento automático, popup no marcador e ' +
          'sincronia com a grade pelo evento `select-item`.',
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

/** Pontos distantes entre si: o enquadramento inicial abre o Brasil inteiro. */
export const PontosEspalhados: Story = {
  name: 'Pontos espalhados',
  play: async ({ canvasElement }) => {
    await waitFor(() => {
      expect(canvasElement.querySelector('.maplibregl-canvas')).toBeTruthy();
    });
  },
};

export const PontosAglomerados: Story = {
  name: 'Pontos aglomerados',
  args: mapPropsFor('unidades'),
  parameters: {
    docs: {
      description: {
        story:
          'Doze pontos dentro de poucos quarteirões. O agrupamento junta o que ' +
          'não caberia separado e o rótulo mostra quantos itens estão ali; ' +
          'clicar no grupo aproxima até ele se abrir.',
      },
    },
  },
};

export const LinhaDeData: Story = {
  name: 'Dos dois lados da linha de data',
  args: mapPropsFor('sensores'),
  parameters: {
    docs: {
      description: {
        story:
          'O mapa rola sem fim no eixo leste-oeste, então um ponto em -174° e ' +
          'um clique em +179° estão perto na tela e a 353° na conta. O popup ' +
          'abre na volta que está à vista, e não numa cópia do mundo fora dela.',
      },
    },
  },
};

export const ItensSemPonto: Story = {
  name: 'Coleção meio preenchida',
  args: mapPropsFor('obras'),
  parameters: {
    docs: {
      description: {
        story:
          'Metade dos itens não tem ponto. Eles continuam na grade e são ' +
          'omitidos do mapa, em vez de virarem um marcador em (0, 0) no golfo ' +
          'da Guiné ou de quebrarem o agrupamento.',
      },
    },
  },
};

export const ZoomAoClicar: Story = {
  name: 'Zoom ao clicar na linha',
  args: { ...mapPropsFor(), zoomOnClick: true },
  parameters: {
    docs: {
      description: {
        story:
          'Com a opção ligada, clicar numa linha da grade voa até o ponto. ' +
          'Desligada, o mapa só desloca quando o ponto está fora do que se vê.',
      },
    },
  },
};

/** Sem itens o mapa ainda desenha, centrado onde o preset mandou. */
export const SemItens: Story = {
  name: 'Sem itens',
  args: { ...mapPropsFor(), items: [] },
};

/** O campo de geolocalização é escolhido nas opções — aqui, o de outra coleção. */
export const OutroCampoDeGeolocalizacao: Story = {
  name: 'Outro campo de geolocalização',
  args: mapPropsFor(mappableKind('unidades').id),
};

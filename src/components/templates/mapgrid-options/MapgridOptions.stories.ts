import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { optionsPropsFor } from './MapgridOptions.mock';
import MapgridOptions from './MapgridOptions.vue';

/**
 * MapgridOptions — o painel lateral que configura o layout.
 *
 * Objetivo: deixar escolher o campo de geolocalização, o template do popup, a
 * câmera inicial e as colunas da grade. O painel não busca nada por conta
 * própria: os campos da coleção chegam por prop, e cada alteração sobe como um
 * evento — o que permite montá-lo aqui sem o app do Directus por trás.
 */
const meta: Meta<typeof MapgridOptions> = {
  title: '04 - Templates/MapgridOptions',
  component: MapgridOptions,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Seções de Popup, Geolocalização, Centro do mapa, Zoom ao clicar e Colunas da grade.',
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

/** Uma coleção já configurada: campo de mapa escolhido e três colunas preenchidas. */
export const Configurado: Story = {
  name: 'Coleção configurada',
};

export const OutraColecao: Story = {
  name: 'Outra coleção',
  args: optionsPropsFor('unidades'),
  parameters: {
    docs: {
      description: {
        story:
          'Os campos oferecidos vêm da coleção, não de uma lista fixa: aqui o ' +
          'campo de mapa chama `position` e as colunas são outras.',
      },
    },
  },
};

export const SemConfiguracao: Story = {
  name: 'Nada configurado ainda',
  args: {
    ...optionsPropsFor(),
    title: undefined,
    geolocation: undefined,
    mapCenterLng: undefined,
    mapCenterLat: undefined,
    mapZoom: undefined,
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
          'Como o painel abre numa coleção recém-configurada, antes de o ' +
          'layout gravar os padrões que detectou.',
      },
    },
  },
};

export const SemCampoDeMapa: Story = {
  name: 'Coleção sem campo de mapa',
  args: {
    ...optionsPropsFor(),
    fieldsInCollection: [
      { name: 'Nome', field: 'nome', meta: null },
      { name: 'Status', field: 'status', meta: { interface: 'input' } },
    ],
  },
  parameters: {
    docs: {
      description: {
        story:
          'O select de geolocalização só oferece campos com interface `map`. ' +
          'Numa coleção sem nenhum, ele fica apenas com a opção vazia — o que ' +
          'é o sinal de que falta criar o campo antes de usar este layout.',
      },
    },
  },
};

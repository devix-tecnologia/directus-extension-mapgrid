// @vitest-environment happy-dom
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { directusComponentStubs } from '../../../mocks/directus-mocks';
import { FieldPathSelect } from '../../molecules/field-path-select/index';
import type { MapgridOptionsProps } from './MapgridOptions.types';
import MapgridOptions from './MapgridOptions.vue';

const FIELDS = [
  { field: 'plate', name: 'Plate', type: 'string' },
  { field: 'captured_at', name: 'Captured At', type: 'timestamp' },
  { field: 'course', name: 'Course', type: 'integer' },
  { field: 'photo', name: 'Photo', type: 'uuid', meta: { special: ['file'] } },
  { field: 'location', name: 'Location', type: 'json' },
];

const panel = (props: Partial<MapgridOptionsProps> = {}) =>
  mount(MapgridOptions, {
    props: { collection: 'lpr', fieldsInCollection: FIELDS, ...props },
    global: { components: directusComponentStubs },
  });

/** The fields a picker's tree offers at the top, from the tree it is given. */
const optionsOf = (wrapper: ReturnType<typeof panel>, selector: string): string[] => {
  const picker = wrapper
    .findAllComponents(FieldPathSelect)
    .find((candidate) => candidate.classes().includes(selector.replace(/^\./, '')));
  if (!picker) throw new Error(`no picker ${selector}`);
  const nodesOf = picker.props('nodesOf') as (collection: string) => { path: string }[];
  return nodesOf('lpr').map((node) => node.path);
};

describe('MapgridOptions — the direction', () => {
  it('asks for a course field only when the arrow reads one, offering numbers only', () => {
    expect(panel().find('.mapgrid-option__heading-field').exists()).toBe(false);

    const wrapper = panel({ headingSource: 'field' });
    expect(optionsOf(wrapper, '.mapgrid-option__heading-field')).toEqual(['course']);
  });

  it('writes the source chosen', async () => {
    const wrapper = panel();

    await wrapper.get('.mapgrid-option__heading-source').setValue('computed');

    expect(wrapper.emitted('update:headingSource')).toEqual([['computed']]);
  });
});

describe('MapgridOptions — the data clock', () => {
  it('says which date it will use when none was chosen, without writing it', () => {
    const wrapper = panel({ sort: ['-captured_at'] });

    expect(wrapper.get('[data-time-field-hint]').text()).toContain('captured_at');
    expect(wrapper.emitted('update:playbackTimeField')).toBeUndefined();
  });

  it('asks for a field when the sort has no date', () => {
    expect(
      panel({ sort: ['plate'] })
        .get('[data-time-field-hint]')
        .text()
    ).toContain('choose a field');
  });

  it('offers only the speed while on the data clock', () => {
    expect(panel().find('.mapgrid-option__speed').exists()).toBe(false);
    expect(panel({ playbackTiming: 'realtime' }).find('.mapgrid-option__speed').exists()).toBe(
      true
    );
  });
});

describe('MapgridOptions — the card', () => {
  it('offers file fields for the photo once the card is on', () => {
    expect(panel().find('.mapgrid-option__card-image').exists()).toBe(false);

    const wrapper = panel({ showCard: true });
    expect(optionsOf(wrapper, '.mapgrid-option__card-image')).toEqual(['photo']);
  });
});

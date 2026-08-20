export const createStub = (name: string, props: string[] = []) => ({
  template: `<div class="${name}"><slot /></div>`,
  props,
});

export const directusComponentStubs = {
  'v-button': createStub('v-button', ['icon', 'rounded', 'danger', 'secondary', 'modelValue']),
  'v-icon': createStub('v-icon', ['name', 'small', 'clickable']),
  'v-dialog': createStub('v-dialog', ['modelValue']),
  'v-card': createStub('v-card'),
  'v-card-title': createStub('v-card-title'),
  'v-card-text': createStub('v-card-text'),
  'v-card-actions': createStub('v-card-actions'),
  'v-table': createStub('v-table', [
    'items',
    'headers',
    'showSelect',
    'showResize',
    'fixedHeader',
    'modelValue',
  ]),
  'v-info': createStub('v-info', ['icon', 'title', 'center']),
  'v-detail': createStub('v-detail', ['icon', 'header']),
  'v-select': createStub('v-select', [
    'modelValue',
    'collection',
    'items',
    'itemText',
    'itemValue',
    'placeholder',
    'showDeselect',
  ]),
  'v-input': createStub('v-input', [
    'modelValue',
    'label',
    'placeholder',
    'type',
    'step',
    'min',
    'max',
  ]),
  'v-checkbox': createStub('v-checkbox', ['modelValue', 'label']),
  'v-collection-field-template': createStub('v-collection-field-template', [
    'modelValue',
    'collection',
  ]),
  'v-progress-circular': createStub('v-progress-circular', ['indeterminate']),
};

export const tooltipDirective = { vTooltip: () => {} };

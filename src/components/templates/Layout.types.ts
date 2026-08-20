export interface LayoutType {
  models: LayoutModels;
  props: LayoutProps;
  emits: LayoutEmits;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type LayoutModels = Record<string, never>;

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type LayoutProps = Record<string, never>;

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type LayoutEmits = Record<string, never>;

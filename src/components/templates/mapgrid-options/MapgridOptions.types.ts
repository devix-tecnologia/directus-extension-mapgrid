import type { HeadingSource, PlaybackTiming } from '../../../contract/index';
import type { CardRowOption } from '../../../services/card-rows/index';
import type { EmbeddedLayout } from '../../../services/embedded-layout/index';
import type { FieldTreeSource } from '../../../services/field-tree/index';

/** A collection field, as `useCollection` lists it — what the pickers filter by. */
export interface OptionField {
  field: string;
  name?: string | null;
  type: string;
  meta?: { special?: string[] | null; interface?: string | null } | null;
}

export interface MapgridOptionsType {
  models: MapgridOptionsModels;
  props: MapgridOptionsProps;
  emits: MapgridOptionsEmits;
}

export type MapgridOptionsModels = Record<string, never>;

/**
 * The panel hosts the configuration of both Directus layouts and adds what is
 * only ours. The embedded layouts arrive ready from `setup()`, the same place
 * the layout component receives them from.
 */
export interface MapgridOptionsProps {
  collection: string;
  grid?: EmbeddedLayout | null;
  map?: EmbeddedLayout | null;
  /** Zoom the map in when a record is focused. Does not exist in their layouts. */
  zoomOnClick?: boolean;
  /** Seconds between records during playback. Does not exist in their layouts. */
  playbackInterval?: number;
  playbackTiming?: PlaybackTiming;
  playbackSpeed?: number;
  playbackTimeField?: string;
  headingSource?: HeadingSource;
  headingField?: string;
  trailLength?: number;
  showCard?: boolean;
  cardImageField?: string;
  cardFields?: string[];
  /** The card's lines; when empty, `cardFields` is shown as lines. */
  cardRows?: CardRowOption[];
  tourOnFirstVisit?: boolean;
  /** The collection's fields, which the field pickers offer. */
  fieldsInCollection?: OptionField[];
  /** The collection's fields and, one many-to-one away, the related ones, by path (`smartphone.icon`). */
  fieldsWithRelated?: OptionField[];
  /** The app's schema, for the field pickers' trees; without it they offer the collection's own fields. */
  fieldTreeSource?: FieldTreeSource | null;
  /** The query's sort, from which the time field is suggested. */
  sort?: string[];
}

export interface MapgridOptionsEmits {
  'update:zoomOnClick': [value: boolean];
  'update:playbackInterval': [value: number];
  'update:playbackTiming': [value: PlaybackTiming];
  'update:playbackSpeed': [value: number];
  /** Empty clears the choice, and the sort's date is used again. */
  'update:playbackTimeField': [value: string];
  'update:headingSource': [value: HeadingSource];
  'update:headingField': [value: string];
  'update:trailLength': [value: number];
  'update:showCard': [value: boolean];
  'update:cardImageField': [value: string];
  'update:cardFields': [value: string[]];
  'update:cardRows': [value: CardRowOption[]];
  'update:tourOnFirstVisit': [value: boolean];
}

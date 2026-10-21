import type { CardRow } from '../../../services/record-card/index';

export interface CaptureCardType {
  models: CaptureCardModels;
  props: CaptureCardProps;
  emits: CaptureCardEmits;
}

export type CaptureCardModels = Record<string, never>;

/** The focused record over the map: its photo, which enlarges, and its fields. */
export interface CaptureCardProps {
  /** The first field's value, which names the record — the plate, in a LPR collection. */
  title: string;
  rows: CardRow[];
  /** `lat, lng`, already formatted; no line when absent. */
  coordinates?: string | null;
  /** The photo's address; no photo area when absent. */
  imageUrl?: string | null;
  loading?: boolean;
}

export interface CaptureCardEmits {
  close: [];
}

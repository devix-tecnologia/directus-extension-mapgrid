import type { CaptureCardType } from './CaptureCard.types';

const PHOTO = `data:image/svg+xml;utf8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="400"><rect width="640" height="400" fill="#475569"/><rect x="245" y="245" width="150" height="50" rx="5" fill="#fff"/><text x="320" y="285" font-family="monospace" font-size="28" font-weight="700" text-anchor="middle">RQP4C58</text></svg>'
)}`;

export const generateMockData = (): CaptureCardType => ({
  props: {
    title: 'RQP4C58',
    rows: [
      { field: 'captured_at', label: 'Captured At', value: '05/06/2026 16:12:06' },
      { field: 'vehicle_type', label: 'Vehicle Type', value: 'Car' },
      { field: 'equipment_label', label: 'Equipment Label', value: 'VTR-1203' },
      { field: 'address', label: 'Address', value: 'Av. Champagnat — Praia da Costa' },
    ],
    coordinates: '-20.33180, -40.28480',
    imageUrl: PHOTO,
    loading: false,
  },
  models: {},
  emits: { close: [] },
});

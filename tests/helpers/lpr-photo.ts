/** A capture photo drawn as SVG: no binary fixtures, and the plate stays legible when enlarged. */
export interface LprPhoto {
  plate: string;
  vehicleType: 'car' | 'bus' | 'truck';
  reader: string;
  capturedAt: string;
}

const BODY_COLOUR: Record<LprPhoto['vehicleType'], string> = {
  bus: '#E8E4D8',
  car: '#3B4252',
  truck: '#B45309',
};

const vehicle = (type: LprPhoto['vehicleType']): string => {
  const colour = BODY_COLOUR[type];
  if (type === 'bus') {
    return `<rect x="150" y="70" width="340" height="250" rx="18" fill="${colour}"/>
      <rect x="175" y="95" width="290" height="110" rx="8" fill="#1E293B"/>`;
  }
  if (type === 'truck') {
    return `<rect x="140" y="60" width="360" height="190" rx="6" fill="${colour}"/>
      <rect x="170" y="250" width="300" height="70" rx="8" fill="#374151"/>`;
  }
  return `<path d="M170 190 L215 110 Q225 95 245 95 L395 95 Q415 95 425 110 L470 190 Z" fill="${colour}"/>
    <rect x="150" y="185" width="340" height="125" rx="22" fill="${colour}"/>
    <path d="M200 180 L235 120 L405 120 L440 180 Z" fill="#1E293B"/>
    <rect x="165" y="215" width="60" height="22" rx="6" fill="#DC2626"/>
    <rect x="415" y="215" width="60" height="22" rx="6" fill="#DC2626"/>`;
};

/** The Mercosul plate: white field, blue band on top. */
const plate = (text: string): string => `
  <rect x="245" y="245" width="150" height="50" rx="5" fill="#FFFFFF" stroke="#111827" stroke-width="2"/>
  <rect x="245" y="245" width="150" height="12" rx="3" fill="#1D4ED8"/>
  <text x="320" y="287" font-family="monospace" font-size="28" font-weight="700"
    text-anchor="middle" fill="#111827">${text}</text>`;

export const lprPhotoSvg = (photo: LprPhoto): string => `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="640" height="400" viewBox="0 0 640 400">
  <defs>
    <linearGradient id="road" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#64748B"/>
      <stop offset="1" stop-color="#1F2937"/>
    </linearGradient>
  </defs>
  <rect width="640" height="400" fill="url(#road)"/>
  <rect x="0" y="330" width="640" height="70" fill="#111827"/>
  ${vehicle(photo.vehicleType)}
  ${plate(photo.plate)}
  <rect x="0" y="0" width="640" height="30" fill="#000000" opacity="0.6"/>
  <text x="12" y="21" font-family="monospace" font-size="15" fill="#FACC15">${photo.reader}</text>
  <text x="628" y="21" font-family="monospace" font-size="15" fill="#FACC15"
    text-anchor="end">${photo.capturedAt}</text>
</svg>`;

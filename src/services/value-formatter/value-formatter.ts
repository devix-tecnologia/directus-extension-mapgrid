import type { GeoItem } from '../../contract/index';
import { parsePointCoordinates } from '../../contract/index';

/** `{{campo}}`. Compilado uma vez: `resolveFieldTemplate` roda por item exibido. */
const PLACEHOLDER_PATTERN = /\{\{([^}]+)\}\}/;
const PLACEHOLDER_PATTERN_GLOBAL = /\{\{([^}]+)\}\}/g;

/**
 * Um ponto na célula da grade é mostrado como "latitude, longitude" — a ordem
 * que se lê, invertida em relação à ordem do GeoJSON.
 */
const formatPointCoordinates = ([longitude, latitude]: [number, number]): string =>
  `${latitude}, ${longitude}`;

/** Qualquer valor de um item como texto de uma célula. */
export const serializeValue = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  if (typeof value !== 'object') return String(value);
  if (Array.isArray(value)) return value.join(', ');

  const point = parsePointCoordinates(value);
  if (point) return formatPointCoordinates(point);

  return JSON.stringify(value);
};

/**
 * O template do popup, resolvido sobre um item. Aceita tanto `{{campo}}` quanto
 * o nome cru de um campo, porque as opções do layout permitem os dois. Sempre
 * cai no id quando nada resolve, para o popup nunca abrir em branco.
 */
export const resolveFieldTemplate = (item: GeoItem, template: string): string => {
  if (!template) return String(item.id);

  const hasPlaceholders = PLACEHOLDER_PATTERN.test(template);
  if (!hasPlaceholders && template in item) return serializeValue(item[template]);

  const resolved = template.replace(PLACEHOLDER_PATTERN_GLOBAL, (_match, fieldName: string) =>
    serializeValue(item[fieldName])
  );

  return resolved.trim() || String(item.id);
};

/** O valor de um campo do item, pronto para a célula. */
export const serializeItemRow = (item: GeoItem | null | undefined, field: string): string => {
  if (!item) return '';
  if (!(field in item)) return '';
  return serializeValue(item[field]);
};

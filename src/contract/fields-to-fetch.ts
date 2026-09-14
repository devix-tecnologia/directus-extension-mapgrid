/**
 * Which fields the layout has to request from the API.
 *
 * The extension used to ask for every field of the collection and then show a
 * handful, which made every page load carry columns nobody was looking at. The
 * set is not just the visible columns, though: the map needs the geolocation
 * field and the popup template may cite a field that is not a column at all.
 */

/** `{{field}}` inside a popup template. */
const PLACEHOLDER_PATTERN = /\{\{([^}]+)\}\}/g;

/**
 * The fields a popup template reads. A template is either placeholders or a
 * bare field name, because the options panel accepts both.
 */
const templateFields = (template: string | undefined): string[] => {
  if (!template) return [];

  const placeholders = [...template.matchAll(PLACEHOLDER_PATTERN)].map((match) =>
    (match[1] ?? '').trim()
  );

  if (placeholders.length > 0) return placeholders.filter((field) => field !== '');

  const bare = template.trim();
  return bare === '' || bare.includes(' ') ? [] : [bare];
};

export interface FieldsToFetchInput {
  /** The fields the grid shows. */
  displayed: string[];
  /** The collection's primary key, which matches a row to its marker. */
  primaryKey: string;
  /** The field holding the point, when one is configured. */
  geolocation?: string;
  /** The marker popup template, which may cite fields that are not columns. */
  titleTemplate?: string;
}

export const fieldsToFetch = ({
  displayed,
  primaryKey,
  geolocation,
  titleTemplate,
}: FieldsToFetchInput): string[] => {
  const wanted = [
    primaryKey,
    ...(geolocation ? [geolocation] : []),
    ...displayed,
    ...templateFields(titleTemplate),
  ];

  return [...new Set(wanted.filter((field) => field !== ''))];
};

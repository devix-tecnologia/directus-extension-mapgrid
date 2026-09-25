/** What the MapGrid stores in the Directus preset. */
export interface LayoutOptions {
  /** The embedded tabular layout's configuration; the content is Directus'. */
  tabular?: Record<string, unknown>;
  /** The embedded map layout's configuration; the content is Directus'. */
  map?: Record<string, unknown>;
  /** Zoom the map in when a row is clicked, instead of keeping the zoom. */
  zoomOnClick?: boolean;
}

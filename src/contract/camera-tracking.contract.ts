/**
 * How much the camera chases the current record.
 *
 * It lives in the contract because it is stored in the Directus preset: a map
 * implementing `IMapCenterer` has to read the same three states.
 *
 * Navigation apps call this *follow mode*; the name "autofocus" was dropped on
 * purpose, because in photography it is lens sharpness, not framing.
 *
 * - `off` — the map stays where the person left it;
 * - `follow` — moves only when the record leaves the visible area;
 * - `center` — keeps the record in the middle at every step.
 */
export type CameraTracking = 'off' | 'follow' | 'center';

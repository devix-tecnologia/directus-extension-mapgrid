/** What a key asks the composition to do — the same controls the toolbar has. */
export type NavigationAction = 'first' | 'previous' | 'next' | 'last' | 'playback';

/** The part of a `KeyboardEvent` the mapping reads. */
export interface ShortcutEvent {
  key: string;
  altKey?: boolean;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  target?: EventTarget | null;
}

/**
 * The keys that walk the records.
 *
 * Checked against Directus 10.13.1: every shortcut of theirs carries `meta` —
 * `meta+s`, `meta+shift+s`, `meta+enter`, the markdown ones, and the `meta+a`
 * of the tabular layout the MapGrid embeds — the only exception being the
 * `escape` of `v-dialog`. So the keys here are plain ones, and a held modifier
 * hands the event back to them.
 */
export interface IKeyboardNavigation {
  /** `null` when the key is not ours, a modifier is held, or the person is typing. */
  actionFor(event: ShortcutEvent): NavigationAction | null;
  /**
   * Whether the layout is the one being spoken to. Mirrors the rule of the
   * Directus `useShortcut`: the focus is inside the layout, or nowhere at all.
   */
  inScope(root: Element | null, activeElement: Element | null): boolean;
}

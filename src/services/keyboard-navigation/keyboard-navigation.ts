import type {
  IKeyboardNavigation,
  NavigationAction,
  ShortcutEvent,
} from './keyboard-navigation.types';

/** The key of each control, for the mapping and for the help text in the toolbar. */
export const NAVIGATION_KEYS: Readonly<Record<string, NavigationAction>> = {
  ArrowLeft: 'previous',
  ArrowRight: 'next',
  End: 'last',
  Home: 'first',
  ' ': 'playback',
};

const TYPING_TAGS = new Set(['INPUT', 'SELECT', 'TEXTAREA']);

export class KeyboardNavigation implements IKeyboardNavigation {
  actionFor(event: ShortcutEvent): NavigationAction | null {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return null;
    if (this.isTyping(event.target)) return null;
    return NAVIGATION_KEYS[event.key] ?? null;
  }

  inScope(root: Element | null, activeElement: Element | null): boolean {
    if (activeElement === null || activeElement === activeElement.ownerDocument.body) return true;
    return root?.contains(activeElement) === true;
  }

  private isTyping(target: EventTarget | null | undefined): boolean {
    const element = target as (Element & { isContentEditable?: boolean }) | null | undefined;
    if (!element || typeof element.tagName !== 'string') return false;
    return TYPING_TAGS.has(element.tagName) || element.isContentEditable === true;
  }
}

// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { KeyboardNavigation } from './keyboard-navigation';

const keyboard = new KeyboardNavigation();

describe('KeyboardNavigation — which key does what', () => {
  it('walks the records with the arrows, the ends with Home and End, and plays with Space', () => {
    expect(keyboard.actionFor({ key: 'ArrowLeft' })).toBe('previous');
    expect(keyboard.actionFor({ key: 'ArrowRight' })).toBe('next');
    expect(keyboard.actionFor({ key: 'Home' })).toBe('first');
    expect(keyboard.actionFor({ key: 'End' })).toBe('last');
    expect(keyboard.actionFor({ key: ' ' })).toBe('playback');
  });

  it('ignores a key that is not ours', () => {
    expect(keyboard.actionFor({ key: 'a' })).toBeNull();
    expect(keyboard.actionFor({ key: 'Escape' })).toBeNull();
    expect(keyboard.actionFor({ key: 'ArrowUp' })).toBeNull();
  });

  it('gives the event back whenever a modifier is held, as every Directus shortcut has one', () => {
    expect(keyboard.actionFor({ key: 'ArrowRight', metaKey: true })).toBeNull();
    expect(keyboard.actionFor({ key: 'ArrowRight', ctrlKey: true })).toBeNull();
    expect(keyboard.actionFor({ key: 'ArrowRight', altKey: true })).toBeNull();
    expect(keyboard.actionFor({ key: 'ArrowRight', shiftKey: true })).toBeNull();
  });

  it('keeps quiet while the person is typing', () => {
    const field = document.createElement('input');
    const area = document.createElement('textarea');
    const select = document.createElement('select');
    const template = document.createElement('div');
    template.setAttribute('contenteditable', 'true');

    expect(keyboard.actionFor({ key: ' ', target: field })).toBeNull();
    expect(keyboard.actionFor({ key: 'End', target: area })).toBeNull();
    expect(keyboard.actionFor({ key: 'Home', target: select })).toBeNull();
    expect(keyboard.actionFor({ key: 'ArrowRight', target: template })).toBeNull();
  });
});

describe('KeyboardNavigation — who is being spoken to', () => {
  it('answers to the focus inside the layout', () => {
    const root = document.createElement('div');
    const button = document.createElement('button');
    root.append(button);

    expect(keyboard.inScope(root, button)).toBe(true);
    expect(keyboard.inScope(root, root)).toBe(true);
  });

  it('answers when nothing is focused, which is where a page starts', () => {
    const root = document.createElement('div');

    expect(keyboard.inScope(root, document.body)).toBe(true);
    expect(keyboard.inScope(root, null)).toBe(true);
  });

  it('keeps quiet while the focus is elsewhere — a dialog, the sidebar', () => {
    const root = document.createElement('div');
    const elsewhere = document.createElement('input');
    document.body.append(elsewhere);

    expect(keyboard.inScope(root, elsewhere)).toBe(false);
    expect(keyboard.inScope(null, elsewhere)).toBe(false);
  });
});

import { describe, expect, it } from 'vitest';
import { evidenceName } from './evidence-name';

describe('evidenceName', () => {
  it('starts with the task number, which is how TASKS/assets is indexed', () => {
    expect(evidenceName({ task: '008', label: 'grid' })).toBe('task-008-grid.png');
  });

  it('marks before and after in the name, not in separate directories', () => {
    // Separate directories would force whoever reads the task to navigate; the
    // pair is obvious when both names show up side by side in the same folder.
    expect(evidenceName({ task: '008', label: 'grid', moment: 'antes' })).toBe(
      'task-008-grid-antes.png'
    );
    expect(evidenceName({ task: '008', label: 'grid', moment: 'depois' })).toBe(
      'task-008-grid-depois.png'
    );
  });

  it('normalises the number to three digits, like the task files', () => {
    expect(evidenceName({ task: '8', label: 'x' })).toBe('task-008-x.png');
    expect(evidenceName({ task: 'task-8', label: 'x' })).toBe('task-008-x.png');
  });

  it('refuses a label that would produce a name outside TASKS/assets', () => {
    // `..` in a label would write the PNG somewhere else in the repository.
    expect(() => evidenceName({ task: '008', label: '../outside' })).toThrow(/label/i);
  });
});

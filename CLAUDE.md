# Guide for agents — directus-extension-mapgrid

## Language

This is a public package (`@devix-tecnologia/directus-extension-mapgrid`), and
its code is written in **English**:

- names of folders, files, classes, functions, types and variables;
- comments and TSDoc;
- log and error messages;
- `describe` / `it` titles.

What stays in **Portuguese**: the documents in `TASKS/` and commit messages.

User-facing text always goes through `src/shared/messages.ts` (en-US and
pt-BR), never as a literal string.

Parts of `src/`, `tests/`, `.sandcastle/` and `scripts/` were written in
Portuguese and are being renamed; do not take them as the model. New code is
English from the start.

## Comments

Minimal. Short TSDoc on contracts — interfaces, exported types, options,
public constants. The implementation speaks through its names; a one-line
comment only for what the code cannot say (a limit of a third-party tool, a
trap). The story of a decision or of a measurement goes in the task or in the
commit, not in the source.

## Code

Behaviour lives in a class that implements an `I<Name>` interface, one folder
per class (`name.ts`, `name.types.ts`, `name.test.ts`, `index.ts`).

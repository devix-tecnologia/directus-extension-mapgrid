import type { CardRowOption, CardTemplateRow, ICardRows } from './card-rows.types';

const PLACEHOLDER = /{{\s*([^{}\s]+?)\s*}}/g;

const asLine = (field: string): CardRowOption => ({ template: `{{${field}}}` });

export class CardRows implements ICardRows {
  optionsFrom(source: {
    cardRows?: readonly CardRowOption[] | null;
    cardFields?: readonly string[] | null;
    gridFields?: readonly string[] | null;
  }): CardRowOption[] {
    if (source.cardRows?.length) {
      return source.cardRows.filter((row) => row.template.trim() !== '');
    }
    if (source.cardFields?.length) return source.cardFields.map(asLine);
    return (source.gridFields ?? []).map(asLine);
  }

  fieldsOf(templates: readonly string[]): string[] {
    const paths = templates.flatMap((template) =>
      [...template.matchAll(PLACEHOLDER)].map((match) => match[1] as string)
    );
    return [...new Set(paths)];
  }

  rows(
    options: readonly CardRowOption[],
    nameOf: (path: string) => string | null
  ): CardTemplateRow[] {
    return options.map((option, index) => {
      const [first] = this.fieldsOf([option.template]);
      const label = option.label?.trim() || (first ? (nameOf(first) ?? first) : '');
      return { key: `${index}:${option.template}`, label, template: option.template };
    });
  }
}

export interface Header {
  text: string;
  value: string;
}

export interface ResolvedHeader extends Header {
  sortable: boolean;
  width: number | null;
  align?: string;
}

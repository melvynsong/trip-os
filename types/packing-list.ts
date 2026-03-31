export interface PackingListItem {
  name: string;
  quantity: number;
  notes?: string;
}

export interface PackingListCategory {
  category: string;
  items: PackingListItem[];
}

export interface PackingList {
  categories: PackingListCategory[];
}

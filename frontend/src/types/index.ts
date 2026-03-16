export type ItemStatus = 'OWNED' | 'LOST' | 'STOLEN' | 'DAMAGED' | 'DESTROYED';

export interface Catalogue {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  _count?: { items: number; collections: number };
}

export interface Collection {
  id: string;
  name: string;
  description?: string;
  catalogueId: string;
  catalogue?: { name: string; icon?: string };
  _count?: { items: number };
}

export interface Item {
  id: string;
  name: string;
  description?: string;
  barcode?: string;
  isbn?: string;
  catalogueId: string;
  catalogue?: Catalogue;
  collections?: { collectionId: string; collection: Collection }[];
  status: ItemStatus;
  imageUrl?: string;
  manufacturer?: string;
  author?: string;
  publisher?: string;
  year?: number;
  metadata?: Record<string, unknown>;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export const STATUS_LABELS: Record<ItemStatus, string> = {
  OWNED: 'Owned',
  LOST: 'Lost',
  STOLEN: 'Stolen',
  DAMAGED: 'Damaged',
  DESTROYED: 'Destroyed',
};

export const STATUS_COLORS: Record<ItemStatus, string> = {
  OWNED: 'bg-green-100 text-green-800',
  LOST: 'bg-yellow-100 text-yellow-800',
  STOLEN: 'bg-red-100 text-red-800',
  DAMAGED: 'bg-orange-100 text-orange-800',
  DESTROYED: 'bg-gray-100 text-gray-800',
};

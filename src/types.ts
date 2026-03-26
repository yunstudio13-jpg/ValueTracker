export type ItemStatus = 'active' | 'idle' | 'resold' | 'scrapped';

export interface Item {
  id: string;
  user_id: string;
  name: string;
  price: number;
  purchase_date: string; // ISO 8601
  category_id?: string;
  category_name?: string;
  emoji?: string;
  status: ItemStatus;
  resale_value?: number;
  end_date?: string; // ISO 8601
  cover_image?: string;
  brand?: string;
  warranty_expiry?: string; // ISO 8601
  notes?: string;
}

export interface Category {
  id: string;
  user_id: string; // 0 for system default
  name: string;
  icon?: string;
}

export interface DashboardStats {
  totalItems: number;
  totalValue: number;
  globalDailyCost: number;
  superValueItems: (Item & { dailyCost: number })[];
  dustyItems: (Item & { dailyCost: number })[];
}

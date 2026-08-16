export interface RawBookRecord {
  title: string;
  product_url: string;
  price_text: string;
  availability_text: string;
  rating_text: string;
  description: string | null;
  source_page: string;
  fetched_at: string;
}

export interface CleanBookRecord {
  title: string;
  product_url: string;
  price_text: string;
  price_gbp: number;
  availability_text: string;
  rating_text: string;
  description: string | null;
  source_page: string;
  fetched_at: string;
}
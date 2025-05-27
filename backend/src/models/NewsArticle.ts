export interface NewsArticle {
  id: number;
  title: string;
  content: string;
  source: string;
  author?: string;
  url: string;
  image_url?: string;
  category?: string;
  bias_rating?: number; // -3.0 to +3.0
  bias_source?: string;
  tags?: string[];
  published_at: Date;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface ArticleWithBiasInfo extends NewsArticle {
  bias_label: string; // 'Left', 'Lean Left', 'Center', 'Lean Right', 'Right'
  reliability_score?: number;
} 
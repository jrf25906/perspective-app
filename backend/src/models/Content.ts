import db from '../db';

export enum BiasRating {
  FAR_LEFT = 'far_left',
  LEFT = 'left',
  LEFT_CENTER = 'left_center',
  CENTER = 'center',
  RIGHT_CENTER = 'right_center',
  RIGHT = 'right',
  FAR_RIGHT = 'far_right',
}

export enum ContentType {
  NEWS_ARTICLE = 'news_article',
  OPINION = 'opinion',
  ANALYSIS = 'analysis',
  FACT_CHECK = 'fact_check',
}

export interface INewsSource {
  id: number;
  name: string;
  domain: string;
  bias_rating: BiasRating;
  credibility_score: number; // 0-100
  description?: string;
  logo_url?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface IContent {
  id: number;
  source_id: number;
  type: ContentType;
  headline: string;
  subheadline?: string;
  author?: string;
  excerpt: string;
  full_text?: string;
  url: string;
  image_url?: string;
  published_at: Date;
  bias_rating: BiasRating;
  topics: string[];
  keywords: string[];
  sentiment_score?: number; // -1 to 1
  is_verified: boolean;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface IContentGroup {
  id: number;
  topic: string;
  date: Date;
  articles: IContent[];
  bias_distribution: Record<BiasRating, number>;
}

class Content {
  static async createSource(sourceData: Omit<INewsSource, 'id' | 'created_at' | 'updated_at'>): Promise<INewsSource> {
    const [source] = await db('news_sources')
      .insert(sourceData)
      .returning('*');
    
    return source;
  }

  static async createArticle(articleData: Omit<IContent, 'id' | 'created_at' | 'updated_at'>): Promise<IContent> {
    const [article] = await db('content')
      .insert({
        ...articleData,
        topics: articleData.topics, // Keep as array - PostgreSQL will handle it
        keywords: articleData.keywords, // Keep as array - PostgreSQL will handle it
      })
      .returning('*');
    
    return {
      ...article,
      topics: article.topics,
      keywords: article.keywords,
    };
  }

  static async findArticleById(id: number): Promise<IContent | null> {
    const article = await db('content')
      .where({ id })
      .first();
    
    if (!article) return null;
    
    return {
      ...article,
      topics: article.topics, // Already an array
      keywords: article.keywords, // Already an array
    };
  }

  static async getBalancedArticles(
    topic: string,
    count: number = 3
  ): Promise<IContent[]> {
    // Get one article from each major bias category
    const biasCategories = [
      [BiasRating.LEFT, BiasRating.FAR_LEFT],
      [BiasRating.CENTER, BiasRating.LEFT_CENTER, BiasRating.RIGHT_CENTER],
      [BiasRating.RIGHT, BiasRating.FAR_RIGHT],
    ];
    
    const articles: IContent[] = [];
    
    for (const biases of biasCategories) {
      const article = await db('content')
        .whereIn('bias_rating', biases)
        .where('is_active', true)
        .where('is_verified', true)
        .whereRaw('? = ANY(topics)', [topic])
        .orderBy('published_at', 'desc')
        .first();
      
      if (article) {
        articles.push({
          ...article,
          topics: article.topics, // Already an array, no need to parse
          keywords: article.keywords, // Already an array, no need to parse
        });
      }
    }
    
    return articles;
  }

  static async getArticlesByBias(
    bias: BiasRating,
    limit: number = 10,
    offset: number = 0
  ): Promise<IContent[]> {
    const articles = await db('content')
      .where({ bias_rating: bias, is_active: true })
      .orderBy('published_at', 'desc')
      .limit(limit)
      .offset(offset);
    
    return articles.map(article => ({
      ...article,
      topics: article.topics, // Already an array
      keywords: article.keywords, // Already an array
    }));
  }

  static async getTrendingTopics(days: number = 7): Promise<{
    topic: string;
    count: number;
    bias_distribution: Record<BiasRating, number>;
  }[]> {
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - days);
    
    const results = await db('content')
      .where('published_at', '>', sinceDate)
      .where('is_active', true)
      .select('topics', 'bias_rating');
    
    // Aggregate topics and their bias distribution
    const topicMap = new Map<string, {
      count: number;
      bias_distribution: Record<BiasRating, number>;
    }>();
    
    for (const article of results) {
      const topics = article.topics; // Already an array from PostgreSQL
      for (const topic of topics) {
        if (!topicMap.has(topic)) {
          topicMap.set(topic, {
            count: 0,
            bias_distribution: {} as Record<BiasRating, number>,
          });
        }
        
        const topicData = topicMap.get(topic)!;
        topicData.count++;
        topicData.bias_distribution[article.bias_rating] = 
          (topicData.bias_distribution[article.bias_rating] || 0) + 1;
      }
    }
    
    // Convert to array and sort by count
    return Array.from(topicMap.entries())
      .map(([topic, data]) => ({ topic, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  static async getDailyFeed(
    userId: number,
    date: Date = new Date()
  ): Promise<IContentGroup[]> {
    // Get user's bias profile
    const biasProfile = await db('bias_profiles')
      .where({ user_id: userId })
      .first();
    
    // Get trending topics
    const trendingTopics = await this.getTrendingTopics(1);
    
    const contentGroups: IContentGroup[] = [];
    
    // For each trending topic, get balanced articles
    for (const { topic } of trendingTopics.slice(0, 5)) {
      const articles = await this.getBalancedArticles(topic);
      
      if (articles.length >= 2) { // Only include if we have multiple perspectives
        const biasDistribution = articles.reduce((acc, article) => {
          acc[article.bias_rating] = (acc[article.bias_rating] || 0) + 1;
          return acc;
        }, {} as Record<BiasRating, number>);
        
        contentGroups.push({
          id: Math.random(), // This should be properly generated
          topic,
          date,
          articles,
          bias_distribution: biasDistribution,
        });
      }
    }
    
    return contentGroups;
  }

  static async searchArticles(
    query: string,
    filters?: {
      bias?: BiasRating[];
      dateFrom?: Date;
      dateTo?: Date;
      sources?: number[];
    }
  ): Promise<IContent[]> {
    let queryBuilder = db('content')
      .where('is_active', true)
      .where(function() {
        this.where('headline', 'ilike', `%${query}%`)
          .orWhere('excerpt', 'ilike', `%${query}%`)
          .orWhereRaw('? = ANY(keywords)', [query.toLowerCase()]);
      });
    
    if (filters?.bias && filters.bias.length > 0) {
      queryBuilder = queryBuilder.whereIn('bias_rating', filters.bias);
    }
    
    if (filters?.dateFrom) {
      queryBuilder = queryBuilder.where('published_at', '>=', filters.dateFrom);
    }
    
    if (filters?.dateTo) {
      queryBuilder = queryBuilder.where('published_at', '<=', filters.dateTo);
    }
    
    if (filters?.sources && filters.sources.length > 0) {
      queryBuilder = queryBuilder.whereIn('source_id', filters.sources);
    }
    
    const articles = await queryBuilder
      .orderBy('published_at', 'desc')
      .limit(50);
    
    return articles.map(article => ({
      ...article,
      topics: article.topics, // Already an array
      keywords: article.keywords, // Already an array
    }));
  }

  static async logContentView(userId: number, contentId: number): Promise<void> {
    await db('content_views').insert({
      user_id: userId,
      content_id: contentId,
      viewed_at: new Date(),
    });
  }

  static async getUserContentHistory(
    userId: number,
    days: number = 30
  ): Promise<{
    articles_read: number;
    bias_distribution: Record<BiasRating, number>;
    topics: string[];
    sources: string[];
  }> {
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - days);
    
    const views = await db('content_views as cv')
      .join('content as c', 'cv.content_id', 'c.id')
      .join('news_sources as ns', 'c.source_id', 'ns.id')
      .where('cv.user_id', userId)
      .where('cv.viewed_at', '>', sinceDate)
      .select('c.bias_rating', 'c.topics', 'ns.name as source_name');
    
    const biasDistribution: Record<BiasRating, number> = {} as Record<BiasRating, number>;
    const topicsSet = new Set<string>();
    const sourcesSet = new Set<string>();
    
    for (const view of views) {
      biasDistribution[view.bias_rating] = (biasDistribution[view.bias_rating] || 0) + 1;
      
      const topics = view.topics; // Already an array from PostgreSQL
      topics.forEach((topic: string) => topicsSet.add(topic));
      
      sourcesSet.add(view.source_name);
    }
    
    return {
      articles_read: views.length,
      bias_distribution: biasDistribution,
      topics: Array.from(topicsSet),
      sources: Array.from(sourcesSet),
    };
  }

  // Admin methods
  static async getTotalArticlesCount(): Promise<number> {
    const result = await db('content').count('* as count').first();
    return parseInt(result?.count as string) || 0;
  }

  static async getTotalSourcesCount(): Promise<number> {
    const result = await db('news_sources').count('* as count').first();
    return parseInt(result?.count as string) || 0;
  }

  static async getArticlesCountByTimeframe(timeframe: string): Promise<number> {
    let startDate: Date;
    const now = new Date();

    switch (timeframe) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      default:
        startDate = new Date(0); // Beginning of time
    }

    const result = await db('content')
      .where('created_at', '>=', startDate)
      .count('* as count')
      .first();
    
    return parseInt(result?.count as string) || 0;
  }

  static async getFlaggedContent(limit: number = 10, offset: number = 0): Promise<IContent[]> {
    const articles = await db('content')
      .where('is_verified', false)
      .orWhere('is_active', false)
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset);
    
    return articles.map(article => ({
      ...article,
      topics: article.topics || [], // Already an array, provide fallback
      keywords: article.keywords || [], // Already an array, provide fallback
    }));
  }

  static async moderateContent(id: string, action: string, reason: string): Promise<void> {
    const contentId = parseInt(id);
    
    switch (action) {
      case 'approve':
        await db('content')
          .where({ id: contentId })
          .update({
            is_verified: true,
            is_active: true,
            updated_at: new Date(),
          });
        break;
      case 'reject':
        await db('content')
          .where({ id: contentId })
          .update({
            is_verified: false,
            is_active: false,
            updated_at: new Date(),
          });
        break;
      case 'delete':
        await db('content')
          .where({ id: contentId })
          .del();
        break;
      default:
        throw new Error('Invalid moderation action');
    }

    // Log the moderation action
    await db('moderation_logs').insert({
      content_id: contentId,
      action,
      reason,
      created_at: new Date(),
    });
  }
}

export default Content; 
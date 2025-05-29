import axios from 'axios';
import Content, { BiasRating, ContentType, IContent, INewsSource } from '../models/Content';
import config from '../config';

interface NewsApiArticle {
  title: string;
  description: string;
  url: string;
  urlToImage?: string;
  publishedAt: string;
  author?: string;
  source: {
    id: string;
    name: string;
  };
  content?: string;
}

interface NewsApiResponse {
  status: string;
  totalResults: number;
  articles: NewsApiArticle[];
}

interface AllSidesArticle {
  title: string;
  excerpt: string;
  url: string;
  image?: string;
  date: string;
  source: string;
  bias_rating: string;
  author?: string;
}

interface AllSidesApiResponse {
  articles: AllSidesArticle[];
  total: number;
}

class NewsIntegrationService {
  private newsApiKey: string;
  private allSidesApiKey?: string;

  constructor() {
    this.newsApiKey = process.env.NEWS_API_KEY || '';
    this.allSidesApiKey = process.env.ALLSIDES_API_KEY;
  }

  /**
   * Map AllSides bias ratings to our internal bias rating system
   */
  private mapAllSidesBias(allSidesBias: string): BiasRating {
    const mapping: Record<string, BiasRating> = {
      'allsides-left': BiasRating.FAR_LEFT,
      'left': BiasRating.LEFT,
      'lean-left': BiasRating.LEFT_CENTER,
      'center': BiasRating.CENTER,
      'lean-right': BiasRating.RIGHT_CENTER,
      'right': BiasRating.RIGHT,
      'allsides-right': BiasRating.FAR_RIGHT,
    };
    
    return mapping[allSidesBias.toLowerCase()] || BiasRating.CENTER;
  }

  /**
   * Fetch articles from AllSides API (or mock if API key not available)
   */
  async fetchFromAllSides(topic?: string): Promise<Partial<IContent>[]> {
    if (!this.allSidesApiKey) {
      // Return mock data for development
      return this.getMockAllSidesData(topic);
    }

    try {
      // This would be the actual AllSides API call
      const response = await axios.get<AllSidesApiResponse>('https://api.allsides.com/v1/news', {
        headers: {
          'Authorization': `Bearer ${this.allSidesApiKey}`,
        },
        params: {
          topic,
          limit: 50,
        }
      });

      return response.data.articles.map((article: AllSidesArticle) => ({
        type: ContentType.NEWS_ARTICLE,
        headline: article.title,
        excerpt: article.excerpt,
        url: article.url,
        image_url: article.image,
        published_at: new Date(article.date),
        bias_rating: this.mapAllSidesBias(article.bias_rating),
        author: article.author,
        // Note: topics and keywords would need to be extracted
        topics: this.extractTopics(article.title + ' ' + article.excerpt),
        keywords: this.extractKeywords(article.title + ' ' + article.excerpt),
      }));
    } catch (error) {
      console.error('Error fetching from AllSides:', error);
      return this.getMockAllSidesData(topic);
    }
  }

  /**
   * Fetch articles from News API
   */
  async fetchFromNewsAPI(query: string, sources?: string[]): Promise<Partial<IContent>[]> {
    if (!this.newsApiKey) {
      throw new Error('News API key not configured');
    }

    try {
      const response = await axios.get<NewsApiResponse>('https://newsapi.org/v2/everything', {
        params: {
          q: query,
          sources: sources?.join(','),
          apiKey: this.newsApiKey,
          sortBy: 'publishedAt',
          pageSize: 100,
        }
      });

      return response.data.articles.map((article: NewsApiArticle) => ({
        type: ContentType.NEWS_ARTICLE,
        headline: article.title,
        excerpt: article.description || '',
        url: article.url,
        image_url: article.urlToImage,
        published_at: new Date(article.publishedAt),
        author: article.author,
        full_text: article.content,
        // Note: News API doesn't provide bias ratings
        topics: this.extractTopics(article.title + ' ' + article.description),
        keywords: this.extractKeywords(article.title + ' ' + article.description),
      }));
    } catch (error) {
      console.error('Error fetching from News API:', error);
      throw error;
    }
  }

  /**
   * Fetch articles from RSS feeds
   */
  async fetchFromRSS(feedUrl: string, sourceBias: BiasRating): Promise<Partial<IContent>[]> {
    // This would use an RSS parser library
    // For now, returning empty array
    return [];
  }

  /**
   * Extract topics from text using simple keyword extraction
   */
  private extractTopics(text: string): string[] {
    // Simple implementation - in production, use NLP library
    const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for']);
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 4 && !commonWords.has(word));
    
    // Count word frequency
    const wordFreq = new Map<string, number>();
    words.forEach(word => {
      wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
    });

    // Return top topics
    return Array.from(wordFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word]) => word);
  }

  /**
   * Extract keywords from text
   */
  private extractKeywords(text: string): string[] {
    // Similar to topics but includes more words
    return this.extractTopics(text).slice(0, 10);
  }

  /**
   * Get mock AllSides data for development
   */
  private getMockAllSidesData(topic?: string): Partial<IContent>[] {
    const mockArticles = [
      {
        type: ContentType.NEWS_ARTICLE,
        headline: "Biden Administration Announces New Climate Initiative",
        excerpt: "The White House unveiled a comprehensive plan to address climate change through infrastructure investments.",
        url: "https://example.com/biden-climate",
        published_at: new Date(),
        bias_rating: BiasRating.LEFT,
        topics: ["climate", "biden", "infrastructure", "environment", "policy"],
        keywords: ["climate", "biden", "infrastructure", "environment", "policy", "white house", "administration"],
      },
      {
        type: ContentType.NEWS_ARTICLE,
        headline: "Republicans Push Back on Climate Spending",
        excerpt: "GOP lawmakers argue that the proposed climate measures will harm economic growth.",
        url: "https://example.com/gop-climate",
        published_at: new Date(),
        bias_rating: BiasRating.RIGHT,
        topics: ["climate", "republicans", "economy", "spending", "policy"],
        keywords: ["climate", "republicans", "economy", "spending", "policy", "gop", "lawmakers"],
      },
      {
        type: ContentType.NEWS_ARTICLE,
        headline: "Economists Debate Impact of Climate Policy",
        excerpt: "Experts are divided on the economic implications of the proposed climate initiatives.",
        url: "https://example.com/climate-economics",
        published_at: new Date(),
        bias_rating: BiasRating.CENTER,
        topics: ["climate", "economy", "policy", "experts", "debate"],
        keywords: ["climate", "economy", "policy", "experts", "debate", "economists", "impact"],
      },
    ];

    if (topic) {
      return mockArticles.filter(article => 
        article.topics?.includes(topic.toLowerCase())
      );
    }

    return mockArticles;
  }

  /**
   * Aggregate articles from multiple sources
   */
  async aggregateArticles(topics: string[]): Promise<Partial<IContent>[]> {
    const allArticles: Partial<IContent>[] = [];

    // Fetch from AllSides
    for (const topic of topics) {
      const articles = await this.fetchFromAllSides(topic);
      allArticles.push(...articles);
    }

    // Fetch from News API if configured
    if (this.newsApiKey) {
      try {
        const newsApiArticles = await this.fetchFromNewsAPI(topics.join(' OR '));
        allArticles.push(...newsApiArticles);
      } catch (error) {
        console.error('Failed to fetch from News API:', error);
      }
    }

    // Remove duplicates based on URL
    const uniqueArticles = Array.from(
      new Map(allArticles.map(article => [article.url, article])).values()
    );

    return uniqueArticles;
  }
}

export default new NewsIntegrationService(); 
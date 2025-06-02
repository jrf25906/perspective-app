import Content, { BiasRating, ContentType, IContent, INewsSource } from '../models/Content';
import logger from '../utils/logger';
import { container, ServiceTokens } from '../di/container';
import db from '../db';
import { URL } from 'url';
import { processWithErrors } from '../utils/concurrentProcessing';
import { contentCache, cacheKeys } from './cacheService';

interface ContentValidation {
  isValid: boolean;
  errors: string[];
}

interface BiasAnalysis {
  rating: BiasRating;
  confidence: number;
  indicators: string[];
}

export class ContentCurationService {
  private getNewsIntegrationService() {
    return container.get(ServiceTokens.NewsIntegrationService);
  }

  /**
   * Validate content before ingestion
   */
  private validateContent(content: Partial<IContent>): ContentValidation {
    const errors: string[] = [];

    if (!content.headline || content.headline.length < 10) {
      errors.push('Headline is too short or missing');
    }

    if (!content.excerpt || content.excerpt.length < 20) {
      errors.push('Excerpt is too short or missing');
    }

    if (!content.url || !this.isValidUrl(content.url)) {
      errors.push('Invalid or missing URL');
    }

    if (!content.published_at || isNaN(content.published_at.getTime())) {
      errors.push('Invalid publication date');
    }

    if (!content.topics || content.topics.length === 0) {
      errors.push('No topics identified');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Check if URL is valid
   */
  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Analyze bias based on source and content
   */
  private async analyzeBias(
    content: Partial<IContent>, 
    source?: INewsSource
  ): Promise<BiasAnalysis> {
    // If bias rating is already provided, use it
    if (content.bias_rating) {
      return {
        rating: content.bias_rating,
        confidence: 0.9,
        indicators: ['Source-provided bias rating']
      };
    }

    // If we have source information, use its bias rating
    if (source) {
      return {
        rating: source.bias_rating,
        confidence: 0.8,
        indicators: ['Source bias rating']
      };
    }

    // Otherwise, attempt to infer from content (simplified)
    const indicators: string[] = [];
    let leftScore = 0;
    let rightScore = 0;

    // Simple keyword-based bias detection (in production, use ML)
    const leftKeywords = ['progressive', 'liberal', 'social justice', 'inequality'];
    const rightKeywords = ['conservative', 'traditional', 'free market', 'liberty'];

    const contentText = `${content.headline} ${content.excerpt}`.toLowerCase();

    leftKeywords.forEach(keyword => {
      if (contentText.includes(keyword)) {
        leftScore++;
        indicators.push(`Contains left-leaning keyword: ${keyword}`);
      }
    });

    rightKeywords.forEach(keyword => {
      if (contentText.includes(keyword)) {
        rightScore++;
        indicators.push(`Contains right-leaning keyword: ${keyword}`);
      }
    });

    // Determine bias rating
    let rating = BiasRating.CENTER;
    if (leftScore > rightScore + 1) {
      rating = BiasRating.LEFT;
    } else if (rightScore > leftScore + 1) {
      rating = BiasRating.RIGHT;
    }

    return {
      rating,
      confidence: 0.5, // Low confidence for keyword-based analysis
      indicators
    };
  }

  /**
   * Calculate sentiment score
   */
  private calculateSentiment(text: string): number {
    // Simple sentiment analysis (in production, use NLP library)
    const positiveWords = ['good', 'great', 'excellent', 'positive', 'success', 'achievement'];
    const negativeWords = ['bad', 'terrible', 'negative', 'failure', 'crisis', 'disaster'];

    const words = text.toLowerCase().split(/\s+/);
    let score = 0;

    words.forEach(word => {
      if (positiveWords.includes(word)) score += 0.1;
      if (negativeWords.includes(word)) score -= 0.1;
    });

    // Clamp between -1 and 1
    return Math.max(-1, Math.min(1, score));
  }

  /**
   * Ingest new content
   */
  async ingestContent(
    contentData: Partial<IContent>,
    sourceId?: number
  ): Promise<IContent | null> {
    // Validate content
    const validation = this.validateContent(contentData);
    if (!validation.isValid) {
      logger.error(`Content validation failed: ${JSON.stringify(validation.errors)}`);
      return null;
    }

    // Check for duplicates
    const existingContent = await db('content')
      .where('url', contentData.url)
      .first();

    if (existingContent) {
      logger.info(`Content already exists: ${contentData.url}`);
      return existingContent;
    }

    // Get source information if provided
    let source: INewsSource | null = null;
    if (sourceId) {
      source = await db('news_sources')
        .where('id', sourceId)
        .first();
    }

    // Analyze bias if not provided
    if (!contentData.bias_rating) {
      const biasAnalysis = await this.analyzeBias(contentData, source || undefined);
      contentData.bias_rating = biasAnalysis.rating;
    }

    // Calculate sentiment if not provided
    if (!contentData.sentiment_score) {
      contentData.sentiment_score = this.calculateSentiment(
        `${contentData.headline} ${contentData.excerpt}`
      );
    }

    // Create content with source ID
    const fullContentData: Omit<IContent, 'id' | 'created_at' | 'updated_at'> = {
      source_id: sourceId || 1, // Default source ID
      type: contentData.type || ContentType.NEWS_ARTICLE,
      headline: contentData.headline!,
      subheadline: contentData.subheadline,
      author: contentData.author,
      excerpt: contentData.excerpt!,
      full_text: contentData.full_text,
      url: contentData.url!,
      image_url: contentData.image_url,
      published_at: contentData.published_at!,
      bias_rating: contentData.bias_rating!,
      topics: contentData.topics!,
      keywords: contentData.keywords!,
      sentiment_score: contentData.sentiment_score,
      is_verified: false, // New content needs verification
      is_active: true,
    };

    return Content.createArticle(fullContentData);
  }

  /**
   * Batch ingest content from news sources
   */
  async batchIngestFromSources(topics: string[]): Promise<{
    ingested: number;
    failed: number;
    duplicates: number;
  }> {
    const results = {
      ingested: 0,
      failed: 0,
      duplicates: 0,
    };

    // Get all active news sources
    const sources = await db('news_sources')
      .where('is_active', true)
      .select('*');

    // Create a map of domain to source
    const sourceMap = new Map<string, INewsSource>();
    sources.forEach(source => {
      sourceMap.set(source.domain, source);
    });

    // Aggregate articles from all sources
    const articles = await this.getNewsIntegrationService().aggregateArticles(topics);

    // Check for duplicates in batch
    const existingUrls = await db('content')
      .whereIn('url', articles.map(a => a.url).filter(url => url))
      .pluck('url');
    
    const existingUrlSet = new Set(existingUrls);

    // Filter out duplicates before processing
    const newArticles = articles.filter(article => 
      article.url && !existingUrlSet.has(article.url)
    );
    
    results.duplicates = articles.length - newArticles.length;

    // Process new articles in parallel
    const ingestionResults = await processWithErrors<Partial<IContent>, IContent | null>(
      newArticles,
      async (article) => {
        // Try to match source by URL domain
        const articleDomain = new URL(article.url!).hostname;
        const source = Array.from(sourceMap.values()).find(s => 
          articleDomain.includes(s.domain)
        );

        const ingested = await this.ingestContent(article, source?.id);
        return ingested;
      },
      {
        concurrencyLimit: 10, // Process 10 articles concurrently
        continueOnError: true,
        onError: (error, article) => {
          logger.error(`Failed to ingest article "${article.headline}": ${error.message}`);
        }
      }
    );

    // Count successful and failed ingestions
    results.ingested = ingestionResults.successful.filter(r => r.result !== null).length;
    results.failed = ingestionResults.failed.length + 
                     ingestionResults.successful.filter(r => r.result === null).length;

    return results;
  }

  /**
   * Curate content for a specific topic
   */
  async curateContentForTopic(
    topic: string,
    options: {
      minBiasVariety?: number;
      maxAge?: number; // days
      minArticles?: number;
    } = {}
  ): Promise<IContent[]> {
    const {
      minBiasVariety = 3, // At least 3 different bias perspectives
      maxAge = 7,
      minArticles = 6,
    } = options;

    // Try to get from cache first
    const cacheKey = cacheKeys.contentByTopic(topic);
    const cachedContent = contentCache.get<IContent[]>(cacheKey);
    
    if (cachedContent) {
      logger.info(`Returning cached content for topic: ${topic}`);
      return cachedContent;
    }

    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - maxAge);

    // Get articles for the topic
    const articles = await db('content')
      .where('is_active', true)
      .where('is_verified', true)
      .where('published_at', '>', sinceDate)
      .whereRaw('? = ANY(topics)', [topic])
      .orderBy('published_at', 'desc')
      .limit(50);

    // Group by bias rating
    const biasGroups = new Map<BiasRating, IContent[]>();
    articles.forEach(article => {
      const group = biasGroups.get(article.bias_rating) || [];
      group.push(article);
      biasGroups.set(article.bias_rating, group);
    });

    // Check if we have enough bias variety
    if (biasGroups.size < minBiasVariety) {
      logger.info(`Not enough bias variety for topic ${topic}: ${biasGroups.size} < ${minBiasVariety}`);
      return [];
    }

    // Select articles to ensure balance
    const curatedArticles: IContent[] = [];
    const targetPerBias = Math.ceil(minArticles / biasGroups.size);

    biasGroups.forEach((articles, bias) => {
      // Take up to targetPerBias articles from each bias group
      curatedArticles.push(...articles.slice(0, targetPerBias));
    });

    const result = curatedArticles.sort((a, b) => 
      b.published_at.getTime() - a.published_at.getTime()
    );

    // Cache the result for 10 minutes
    contentCache.set(cacheKey, result, 600000);

    return result;
  }

  /**
   * Update content verification status
   */
  async verifyContent(contentId: number, isVerified: boolean): Promise<void> {
    await db('content')
      .where('id', contentId)
      .update({
        is_verified: isVerified,
        updated_at: new Date(),
      });
  }

  /**
   * Get content statistics
   */
  async getContentStats(): Promise<{
    total: number;
    byType: Record<ContentType, number>;
    byBias: Record<BiasRating, number>;
    unverified: number;
    last24Hours: number;
  }> {
    const [
      totalResult,
      typeResults,
      biasResults,
      unverifiedResult,
      last24Result,
    ] = await Promise.all([
      db('content').count('* as count').first(),
      db('content').select('type').count('* as count').groupBy('type'),
      db('content').select('bias_rating').count('* as count').groupBy('bias_rating'),
      db('content').where('is_verified', false).count('* as count').first(),
      db('content')
        .where('created_at', '>', new Date(Date.now() - 24 * 60 * 60 * 1000))
        .count('* as count')
        .first(),
    ]);

    const byType: Record<ContentType, number> = {} as Record<ContentType, number>;
    typeResults.forEach((row: any) => {
      byType[row.type as ContentType] = parseInt(row.count);
    });

    const byBias: Record<BiasRating, number> = {} as Record<BiasRating, number>;
    biasResults.forEach((row: any) => {
      byBias[row.bias_rating as BiasRating] = parseInt(row.count);
    });

    return {
      total: parseInt(totalResult?.count as string) || 0,
      byType,
      byBias,
      unverified: parseInt(unverifiedResult?.count as string) || 0,
      last24Hours: parseInt(last24Result?.count as string) || 0,
    };
  }
}

// Factory function for DI
export function createContentCurationService(): ContentCurationService {
  return new ContentCurationService();
}

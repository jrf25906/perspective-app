import { BiasRating, IContent, INewsSource } from '../models/Content';
import db from '../db';

interface BiasScore {
  rating: BiasRating;
  score: number; // Numeric representation for calculations
  label: string;
  description: string;
}

interface BiasDistribution {
  [key: string]: number; // BiasRating -> count or percentage
}

interface BiasAnalysisResult {
  overallBias: BiasRating;
  distribution: BiasDistribution;
  diversityScore: number; // 0-1, higher is more diverse
  recommendations: string[];
}

class BiasRatingService {
  private biasScores: Map<BiasRating, BiasScore>;

  constructor() {
    // Initialize bias scores mapping
    this.biasScores = new Map([
      [BiasRating.FAR_LEFT, {
        rating: BiasRating.FAR_LEFT,
        score: -3,
        label: 'Far Left',
        description: 'Strongly liberal/progressive perspective'
      }],
      [BiasRating.LEFT, {
        rating: BiasRating.LEFT,
        score: -2,
        label: 'Left',
        description: 'Liberal/progressive perspective'
      }],
      [BiasRating.LEFT_CENTER, {
        rating: BiasRating.LEFT_CENTER,
        score: -1,
        label: 'Lean Left',
        description: 'Slightly liberal perspective'
      }],
      [BiasRating.CENTER, {
        rating: BiasRating.CENTER,
        score: 0,
        label: 'Center',
        description: 'Balanced or neutral perspective'
      }],
      [BiasRating.RIGHT_CENTER, {
        rating: BiasRating.RIGHT_CENTER,
        score: 1,
        label: 'Lean Right',
        description: 'Slightly conservative perspective'
      }],
      [BiasRating.RIGHT, {
        rating: BiasRating.RIGHT,
        score: 2,
        label: 'Right',
        description: 'Conservative perspective'
      }],
      [BiasRating.FAR_RIGHT, {
        rating: BiasRating.FAR_RIGHT,
        score: 3,
        label: 'Far Right',
        description: 'Strongly conservative perspective'
      }],
    ]);
  }

  /**
   * Get bias score information
   */
  getBiasScore(rating: BiasRating): BiasScore {
    return this.biasScores.get(rating) || this.biasScores.get(BiasRating.CENTER)!;
  }

  /**
   * Convert numeric score to bias rating
   */
  private scoreToRating(score: number): BiasRating {
    if (score <= -2.5) return BiasRating.FAR_LEFT;
    if (score <= -1.5) return BiasRating.LEFT;
    if (score <= -0.5) return BiasRating.LEFT_CENTER;
    if (score <= 0.5) return BiasRating.CENTER;
    if (score <= 1.5) return BiasRating.RIGHT_CENTER;
    if (score <= 2.5) return BiasRating.RIGHT;
    return BiasRating.FAR_RIGHT;
  }

  /**
   * Calculate diversity score based on bias distribution
   */
  private calculateDiversityScore(distribution: BiasDistribution): number {
    const total = Object.values(distribution).reduce((sum, count) => sum + count, 0);
    if (total === 0) return 0;

    // Calculate Shannon entropy
    let entropy = 0;
    const maxEntropy = Math.log2(7); // 7 bias categories

    Object.values(distribution).forEach(count => {
      if (count > 0) {
        const probability = count / total;
        entropy -= probability * Math.log2(probability);
      }
    });

    // Normalize to 0-1
    return entropy / maxEntropy;
  }

  /**
   * Analyze user's content consumption bias
   */
  async analyzeUserBias(userId: number, days: number = 30): Promise<BiasAnalysisResult> {
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - days);

    // Get user's content history
    const contentHistory = await db('content_views as cv')
      .join('content as c', 'cv.content_id', 'c.id')
      .where('cv.user_id', userId)
      .where('cv.viewed_at', '>', sinceDate)
      .select('c.bias_rating');

    // Calculate distribution
    const distribution: BiasDistribution = {};
    let totalScore = 0;
    let count = 0;

    contentHistory.forEach(item => {
      const biasRating = item.bias_rating as BiasRating;
      distribution[biasRating] = (distribution[biasRating] || 0) + 1;
      totalScore += this.getBiasScore(biasRating).score;
      count++;
    });

    // Calculate average bias
    const averageScore = count > 0 ? totalScore / count : 0;
    const overallBias = this.scoreToRating(averageScore);

    // Calculate diversity score
    const diversityScore = this.calculateDiversityScore(distribution);

    // Generate recommendations
    const recommendations = this.generateRecommendations(overallBias, diversityScore, distribution);

    return {
      overallBias,
      distribution,
      diversityScore,
      recommendations,
    };
  }

  /**
   * Generate bias-aware recommendations
   */
  private generateRecommendations(
    overallBias: BiasRating,
    diversityScore: number,
    distribution: BiasDistribution
  ): string[] {
    const recommendations: string[] = [];

    // Check diversity
    if (diversityScore < 0.5) {
      recommendations.push('Try reading articles from more diverse perspectives to broaden your understanding.');
    }

    // Check for missing perspectives
    const allRatings = Object.values(BiasRating);
    const missingPerspectives = allRatings.filter(rating => !distribution[rating]);
    
    if (missingPerspectives.length > 0) {
      const missingLabels = missingPerspectives
        .map(rating => this.getBiasScore(rating).label)
        .slice(0, 3)
        .join(', ');
      recommendations.push(`Consider exploring ${missingLabels} perspectives.`);
    }

    // Check for heavy bias
    const biasScore = this.getBiasScore(overallBias);
    if (Math.abs(biasScore.score) >= 2) {
      const oppositeDirection = biasScore.score > 0 ? 'left' : 'right';
      recommendations.push(`Your reading tends to be ${biasScore.label.toLowerCase()}. Try some ${oppositeDirection}-leaning sources for balance.`);
    }

    // Encourage center reading if low
    if (!distribution[BiasRating.CENTER] || distribution[BiasRating.CENTER] < 2) {
      recommendations.push('Include more centrist sources to get balanced perspectives.');
    }

    return recommendations;
  }

  /**
   * Get balanced content recommendations
   */
  async getBalancedRecommendations(
    userId: number,
    topic: string,
    count: number = 6
  ): Promise<IContent[]> {
    // Analyze user's current bias
    const userBias = await this.analyzeUserBias(userId, 7); // Last week

    // Determine which biases to emphasize
    const targetBiases: BiasRating[] = [];
    
    // Always include some center content
    targetBiases.push(BiasRating.CENTER);

    // Add underrepresented biases
    const allRatings = Object.values(BiasRating);
    const underrepresented = allRatings.filter(rating => {
      const count = userBias.distribution[rating] || 0;
      const total = Object.values(userBias.distribution).reduce((sum, n) => sum + n, 0);
      const percentage = total > 0 ? count / total : 0;
      return percentage < 0.1; // Less than 10%
    });

    targetBiases.push(...underrepresented.slice(0, 3));

    // If user is heavily biased, add opposite perspectives
    const userBiasScore = this.getBiasScore(userBias.overallBias);
    if (Math.abs(userBiasScore.score) >= 1.5) {
      if (userBiasScore.score > 0) {
        // User leans right, add left content
        targetBiases.push(BiasRating.LEFT, BiasRating.LEFT_CENTER);
      } else {
        // User leans left, add right content
        targetBiases.push(BiasRating.RIGHT, BiasRating.RIGHT_CENTER);
      }
    }

    // Fetch content with target biases
    const articles: IContent[] = [];
    const articlesPerBias = Math.ceil(count / targetBiases.length);

    for (const bias of targetBiases) {
      const biasArticles = await db('content')
        .where('bias_rating', bias)
        .where('is_active', true)
        .where('is_verified', true)
        .whereRaw('? = ANY(topics)', [topic])
        .orderBy('published_at', 'desc')
        .limit(articlesPerBias);

      articles.push(...biasArticles);
    }

    // Shuffle and limit
    return articles
      .sort(() => Math.random() - 0.5)
      .slice(0, count);
  }

  /**
   * Rate source credibility based on various factors
   */
  async rateSourceCredibility(sourceId: number): Promise<number> {
    // Get source information
    const source = await db('news_sources')
      .where('id', sourceId)
      .first();

    if (!source) {
      throw new Error('Source not found');
    }

    // Get content statistics for the source
    const [
      totalArticles,
      verifiedArticles,
      recentArticles,
    ] = await Promise.all([
      db('content').where('source_id', sourceId).count('* as count').first(),
      db('content').where('source_id', sourceId).where('is_verified', true).count('* as count').first(),
      db('content')
        .where('source_id', sourceId)
        .where('created_at', '>', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
        .count('* as count')
        .first(),
    ]);

    const total = parseInt(totalArticles?.count as string) || 0;
    const verified = parseInt(verifiedArticles?.count as string) || 0;
    const recent = parseInt(recentArticles?.count as string) || 0;

    // Calculate credibility factors
    let credibilityScore = source.credibility_score || 50;

    // Verification rate (max 20 points)
    if (total > 0) {
      const verificationRate = verified / total;
      credibilityScore += verificationRate * 20 - 10; // -10 to +10
    }

    // Activity level (max 10 points)
    if (recent > 10) {
      credibilityScore += 5;
    } else if (recent < 2) {
      credibilityScore -= 5;
    }

    // Clamp between 0 and 100
    credibilityScore = Math.max(0, Math.min(100, credibilityScore));

    // Update source credibility
    await db('news_sources')
      .where('id', sourceId)
      .update({ credibility_score: credibilityScore });

    return credibilityScore;
  }

  /**
   * Get bias distribution for a set of articles
   */
  getBiasDistribution(articles: IContent[]): BiasDistribution {
    const distribution: BiasDistribution = {};
    
    articles.forEach(article => {
      distribution[article.bias_rating] = (distribution[article.bias_rating] || 0) + 1;
    });

    return distribution;
  }

  /**
   * Check if a content set is balanced
   */
  isContentSetBalanced(articles: IContent[], threshold: number = 0.6): boolean {
    const distribution = this.getBiasDistribution(articles);
    const diversityScore = this.calculateDiversityScore(distribution);
    return diversityScore >= threshold;
  }

  /**
   * Get all bias ratings with descriptions
   */
  getAllBiasRatings(): BiasScore[] {
    return Array.from(this.biasScores.values());
  }
}

export default new BiasRatingService(); 
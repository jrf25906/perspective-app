# Content Management System

## Overview

The Perspective App Content Management System provides a comprehensive solution for ingesting, curating, and managing news content from various sources with different political biases. The system ensures balanced content presentation and helps users understand media bias.

## Features

### 1. News Source Integration
- **Multi-source Support**: Integrates with AllSides API, News API, and RSS feeds
- **Bias Rating System**: 7-point scale from Far Left to Far Right
- **Source Credibility**: Credibility scores (0-100) for each news source
- **Automatic Ingestion**: Batch ingestion of articles from configured sources

### 2. Content Curation Service
- **Validation**: Ensures content quality before ingestion
- **Deduplication**: Prevents duplicate articles based on URL
- **Topic Extraction**: Automatically extracts topics and keywords
- **Sentiment Analysis**: Basic sentiment scoring for articles
- **Balanced Curation**: Ensures diverse perspectives on topics

### 3. Bias Rating System
- **User Bias Analysis**: Tracks user reading patterns and bias exposure
- **Diversity Scoring**: Measures content diversity using Shannon entropy
- **Recommendations**: Personalized suggestions to broaden perspectives
- **Balance Checking**: Verifies content sets are balanced

### 4. Admin Endpoints

#### News Sources Management
- `GET /api/admin/sources` - List all news sources with filtering
- `POST /api/admin/sources` - Add new news source
- `PUT /api/admin/sources/:id` - Update source information
- `DELETE /api/admin/sources/:id` - Deactivate news source

#### Content Management
- `GET /api/admin/content` - List content with advanced filtering
- `POST /api/admin/content/ingest` - Batch ingest articles by topics
- `PUT /api/admin/content/:id/verify` - Verify/unverify content
- `POST /api/admin/content/:id/moderate` - Moderate content (approve/reject/delete)

#### Bias Analysis
- `GET /api/admin/bias/ratings` - Get all bias rating definitions
- `GET /api/admin/bias/analysis/:userId` - Analyze user's bias exposure
- `POST /api/admin/bias/source-credibility/:sourceId` - Update source credibility

#### Statistics
- `GET /api/admin/stats/overview` - Get system overview statistics
- `GET /api/admin/stats/content-by-timeframe` - Content statistics by time period
- `POST /api/admin/curate/topic` - Curate balanced content for a topic

## Public API Endpoints

### Content Access
- `GET /api/content/trending` - Get trending topics
- `GET /api/content/articles/:id` - Get specific article
- `GET /api/content/search` - Search articles with filters
- `GET /api/content/topic/:topic` - Get balanced articles for a topic

### Authenticated User Endpoints
- `GET /api/content/feed` - Get personalized daily feed
- `GET /api/content/recommendations` - Get balanced recommendations
- `POST /api/content/articles/:id/view` - Log article view
- `GET /api/content/history` - Get user's reading history
- `GET /api/content/bias-analysis` - Get personal bias analysis

## Database Schema

### news_sources
- `id`: Primary key
- `name`: Source name
- `domain`: Website domain
- `bias_rating`: Bias classification (far_left to far_right)
- `credibility_score`: 0-100 credibility rating
- `description`: Source description
- `logo_url`: Source logo
- `is_active`: Active status
- `created_at`, `updated_at`: Timestamps

### content
- `id`: Primary key
- `source_id`: Foreign key to news_sources
- `type`: Content type (news_article, opinion, analysis, fact_check)
- `headline`: Article headline
- `subheadline`: Article subheadline
- `author`: Article author
- `excerpt`: Short description
- `full_text`: Full article text (if available)
- `url`: Original article URL
- `image_url`: Featured image
- `published_at`: Publication date
- `bias_rating`: Article bias rating
- `topics[]`: Array of topics
- `keywords[]`: Array of keywords
- `sentiment_score`: -1 to 1 sentiment
- `is_verified`: Verification status
- `is_active`: Active status
- `created_at`, `updated_at`: Timestamps

### content_views
- `id`: Primary key
- `user_id`: Foreign key to users
- `content_id`: Foreign key to content
- `viewed_at`: View timestamp

### moderation_logs
- `id`: Primary key
- `content_id`: Foreign key to content
- `action`: Moderation action (approve, reject, delete)
- `reason`: Reason for action
- `moderator_id`: Foreign key to users
- `created_at`: Action timestamp

## Configuration

### Environment Variables
```env
# News API Keys
NEWS_API_KEY=your_news_api_key
ALLSIDES_API_KEY=your_allsides_api_key

# Admin Configuration
ADMIN_USER_ID=1  # User ID with admin privileges
```

### Initial Setup
1. Run database migrations:
   ```bash
   npm run migrate
   ```

2. Seed initial news sources:
   ```bash
   npm run seed
   ```

3. Configure API keys in `.env` file

4. Start ingesting content:
   ```bash
   curl -X POST http://localhost:3000/api/admin/content/ingest \
     -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"topics": ["politics", "economy", "climate"]}'
   ```

## Usage Examples

### Ingest Content
```javascript
// POST /api/admin/content/ingest
{
  "topics": ["climate change", "economy", "healthcare"]
}
```

### Search Articles
```javascript
// GET /api/content/search?q=climate&bias=center,left_center&dateFrom=2024-01-01
```

### Get Balanced Feed
```javascript
// GET /api/content/feed
// Returns content groups with diverse perspectives
```

### Analyze User Bias
```javascript
// GET /api/content/bias-analysis?days=30
// Returns:
{
  "overallBias": "left_center",
  "distribution": {
    "far_left": 5,
    "left": 15,
    "left_center": 20,
    "center": 10,
    "right_center": 3,
    "right": 2,
    "far_right": 0
  },
  "diversityScore": 0.72,
  "recommendations": [
    "Consider exploring Right, Far Right perspectives.",
    "Include more centrist sources to get balanced perspectives."
  ]
}
```

## Best Practices

1. **Content Verification**: Always verify content before making it public
2. **Source Diversity**: Maintain sources across all bias categories
3. **Regular Updates**: Update source credibility scores regularly
4. **Moderation**: Review flagged content promptly
5. **API Rate Limits**: Respect third-party API rate limits
6. **Caching**: Cache frequently accessed content
7. **Monitoring**: Track bias distribution and user engagement

## Security Considerations

1. **Authentication**: All admin endpoints require authentication
2. **Authorization**: Admin-only endpoints check user role
3. **Input Validation**: All inputs are validated before processing
4. **SQL Injection**: Using parameterized queries via Knex
5. **Rate Limiting**: Applied to prevent abuse
6. **Content Sanitization**: User-generated content is sanitized

## Future Enhancements

1. **Machine Learning**: Implement ML-based bias detection
2. **NLP Integration**: Advanced topic and sentiment analysis
3. **Real-time Updates**: WebSocket support for live content
4. **Analytics Dashboard**: Visual analytics for admins
5. **Content Recommendations**: AI-powered personalization
6. **Fact-Checking Integration**: Automated fact-check aggregation 
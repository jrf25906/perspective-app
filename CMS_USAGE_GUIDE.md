# Perspective App CMS - Next Steps Guide

## Quick Start

Your Content Management System is now ready! The backend server should be running on `http://localhost:3000`.

## Next Steps to Use the CMS

### 1. **Create an Admin Account**

First, you need to register a user account and make it an admin:

```bash
# Register a new user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "your-secure-password",
    "name": "Admin User"
  }'

# Login to get your authentication token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "your-secure-password"
  }'
```

Save the JWT token from the login response - you'll need it for admin endpoints.

### 2. **Add News Sources**

Before you can ingest content, you need to configure news sources:

```bash
# Add a news source
curl -X POST http://localhost:3000/api/admin/sources \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "CNN",
    "domain": "cnn.com",
    "bias_rating": "left",
    "credibility_score": 75,
    "description": "Cable News Network"
  }'

# Add more sources with different biases
# Bias ratings: far_left, left, left_center, center, right_center, right, far_right
```

### 3. **Configure API Keys (Optional)**

To enable automatic content ingestion, add news API keys to your `.env` file:

```env
NEWS_API_KEY=your_news_api_key_here
ALLSIDES_API_KEY=your_allsides_api_key_here
```

Get free API keys from:
- News API: https://newsapi.org/
- AllSides: https://www.allsides.com/unbiased-news-api

### 4. **Ingest Content**

Once sources are configured, you can start ingesting content:

```bash
# Ingest articles for specific topics
curl -X POST http://localhost:3000/api/admin/content/ingest \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "topics": ["politics", "economy", "climate change", "healthcare"]
  }'
```

### 5. **View and Manage Content**

#### List All Content
```bash
curl -X GET "http://localhost:3000/api/admin/content?page=1&limit=20" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Search Content
```bash
# Public endpoint - no auth required
curl -X GET "http://localhost:3000/api/content/search?q=climate&bias=center,left_center"
```

#### Get Trending Topics
```bash
curl -X GET "http://localhost:3000/api/content/trending?days=7"
```

### 6. **Content Moderation**

Review and moderate content:

```bash
# Verify content
curl -X PUT http://localhost:3000/api/admin/content/123/verify \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"verified": true}'

# Moderate content (approve/reject/delete)
curl -X POST http://localhost:3000/api/admin/content/123/moderate \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "approve",
    "reason": "Content meets quality standards"
  }'
```

### 7. **View Statistics**

Monitor your CMS performance:

```bash
# Get overview statistics
curl -X GET http://localhost:3000/api/admin/stats/overview \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Key CMS Features

### Content Types
- **News Articles**: Regular news content
- **Opinion**: Opinion pieces and editorials
- **Analysis**: In-depth analysis articles
- **Fact Check**: Fact-checking content

### Bias Ratings
- `far_left`: Far Left perspective
- `left`: Left perspective
- `left_center`: Left-Center perspective
- `center`: Center/neutral perspective
- `right_center`: Right-Center perspective
- `right`: Right perspective
- `far_right`: Far Right perspective

### Content Management Workflow
1. **Ingestion**: Automatically fetch content from configured sources
2. **Validation**: Ensure content quality and completeness
3. **Verification**: Admin review and approval
4. **Publication**: Make content available to users
5. **Analysis**: Track user engagement and bias exposure

## Public API Endpoints

Users can access content through these endpoints:

- `GET /api/content/trending` - Trending topics
- `GET /api/content/articles/:id` - Specific article
- `GET /api/content/search` - Search with filters
- `GET /api/content/topic/:topic` - Balanced articles by topic

Authenticated users get additional features:
- `GET /api/content/feed` - Personalized daily feed
- `GET /api/content/recommendations` - AI-powered suggestions
- `GET /api/content/bias-analysis` - Personal bias analysis

## Admin Dashboard (Future)

While API endpoints are available now, consider building an admin dashboard for easier management:

1. **Source Management**: Add/edit/remove news sources
2. **Content Queue**: Review and moderate incoming content
3. **Analytics**: Visualize bias distribution and user engagement
4. **User Management**: Monitor user bias exposure
5. **Settings**: Configure ingestion rules and thresholds

## Best Practices

1. **Balanced Sources**: Maintain sources across all bias categories
2. **Regular Ingestion**: Schedule regular content updates
3. **Quality Control**: Review flagged content promptly
4. **User Privacy**: Respect user reading preferences
5. **API Limits**: Monitor third-party API usage

## Troubleshooting

### Backend won't start
- Check if port 3000 is available
- Ensure SQLite database exists
- Verify `.env` file configuration

### Can't access admin endpoints
- Ensure you're using the correct JWT token
- Check if your user ID matches ADMIN_USER_ID in `.env`
- Verify token hasn't expired

### Content ingestion fails
- Check API keys are configured
- Verify news sources are added
- Check network connectivity

## Next Development Steps

1. **Build Admin UI**: Create a React/Vue admin panel
2. **Automate Ingestion**: Set up cron jobs for regular updates
3. **Enhance Analysis**: Implement ML-based bias detection
4. **Add Webhooks**: Real-time content notifications
5. **Cache Layer**: Add Redis for better performance

## Support

For issues or questions:
- Check backend logs: `backend/logs/`
- Review API documentation: `backend/docs/`
- Database queries: Use SQLite browser for `dev.sqlite3` 
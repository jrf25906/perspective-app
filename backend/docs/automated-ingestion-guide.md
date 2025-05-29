# Automated Content Ingestion Guide

## Overview

The Perspective App includes a powerful automated content ingestion system that can fetch, process, and curate news articles from multiple sources across the political spectrum. This ensures users always have fresh, balanced content to explore different perspectives.

## Quick Start

### 1. Add News Sources

First, populate the database with news sources:

```bash
cd backend
npm run ingestion add-sources
```

This adds 12 pre-configured sources across the political spectrum (left, center, right).

### 2. Configure API Keys (Optional)

For real content ingestion, add API keys to your `.env` file:

```env
# News API - Free tier available at https://newsapi.org/
NEWS_API_KEY=your_news_api_key

# AllSides API - Request access at https://www.allsides.com/unbiased-news-api
ALLSIDES_API_KEY=your_allsides_api_key

# Enable automatic ingestion on server start
ENABLE_AUTO_INGESTION=true

# Ingestion schedule (cron format)
INGESTION_SCHEDULE=0 */6 * * *  # Every 6 hours
```

### 3. Run Manual Ingestion

Test the ingestion system manually:

```bash
# Ingest default topics
npm run ingestion run

# Ingest specific topics
npm run ingestion run -t "climate change" "healthcare" "economy"
```

### 4. Start Automated Ingestion

Start the scheduler for automatic ingestion:

```bash
# Start scheduler (runs until stopped)
npm run ingestion start

# Or enable it automatically when the server starts
ENABLE_AUTO_INGESTION=true npm run dev
```

## CLI Commands

The ingestion system includes a comprehensive CLI:

### `npm run ingestion add-sources`
Adds default news sources to the database.

### `npm run ingestion run [options]`
Runs content ingestion manually.

Options:
- `-t, --topics <topics...>`: Topics to ingest (default: politics, economy, technology, climate)

### `npm run ingestion start`
Starts the automated scheduler.

### `npm run ingestion status`
Shows current scheduler status and recent runs.

### `npm run ingestion config [options]`
Configure ingestion settings.

Options:
- `-s, --schedule <cron>`: Set cron schedule
- `-t, --topics <topics...>`: Set topics to ingest
- `-e, --enable`: Enable scheduler
- `-d, --disable`: Disable scheduler

### `npm run ingestion stats`
Shows content statistics by bias and source.

## Configuration Options

### Scheduler Configuration

```javascript
{
  enabled: true,                    // Enable/disable scheduler
  schedule: '0 */6 * * *',         // Cron expression (every 6 hours)
  topics: [                        // Topics to monitor
    'politics',
    'economy',
    'technology',
    'climate',
    'healthcare',
    'education'
  ],
  maxArticlesPerRun: 100,          // Limit articles per ingestion
  notifyOnError: true              // Alert on failures
}
```

### Cron Schedule Examples

- `0 */6 * * *` - Every 6 hours
- `0 0 * * *` - Daily at midnight
- `0 9,15,21 * * *` - At 9am, 3pm, and 9pm
- `0 */4 * * 1-5` - Every 4 hours on weekdays
- `*/30 * * * *` - Every 30 minutes (for testing)

## Features

### 1. Automatic Content Processing

- **Topic Extraction**: Automatically extracts topics from headlines and content
- **Bias Detection**: Uses source bias ratings and content analysis
- **Sentiment Analysis**: Basic sentiment scoring for articles
- **Deduplication**: Prevents duplicate articles based on URL

### 2. Post-Ingestion Tasks

After each ingestion run:
- Updates trending topics cache
- Cleans up old unverified content (30+ days)
- Updates source credibility scores
- Generates content statistics

### 3. Content Curation

The system ensures balanced content by:
- Fetching articles from sources across the political spectrum
- Requiring minimum bias variety for topic curation
- Tracking bias distribution in content groups

### 4. Monitoring & Logging

- Ingestion results logged to database
- Statistics tracking for historical analysis
- Error notifications (configurable)
- Real-time status via API endpoints

## API Endpoints

Admin endpoints for managing ingestion:

### GET `/api/admin/ingestion/status`
Get current scheduler status and recent runs.

### POST `/api/admin/ingestion/run`
Trigger manual ingestion run.

Body:
```json
{
  "topics": ["climate", "healthcare"]
}
```

### POST `/api/admin/ingestion/start`
Start the automated scheduler.

### POST `/api/admin/ingestion/stop`
Stop the automated scheduler.

### PUT `/api/admin/ingestion/config`
Update scheduler configuration.

Body:
```json
{
  "schedule": "0 */4 * * *",
  "topics": ["politics", "economy"],
  "enabled": true
}
```

## Database Tables

### ingestion_logs
Tracks each ingestion run:
- `timestamp`: When the run occurred
- `ingested`: Number of new articles
- `failed`: Number of failed ingestions
- `duplicates`: Number of duplicates found
- `duration`: Run duration in seconds
- `error`: Error message if failed

### ingestion_stats
Stores periodic statistics:
- `timestamp`: When stats were generated
- `total_articles`: Total article count
- `articles_last_24h`: Recent articles
- `unverified_count`: Articles pending verification
- `stats_json`: Detailed statistics

### system_config
Stores configuration:
- `key`: Configuration key
- `value`: JSON configuration
- `updated_at`: Last update time

## Troubleshooting

### No Articles Being Ingested

1. Check if news sources are configured:
   ```bash
   npm run ingestion stats
   ```

2. Verify API keys are set (if using real APIs)

3. Check ingestion logs:
   ```bash
   sqlite3 dev.sqlite3 "SELECT * FROM ingestion_logs ORDER BY timestamp DESC LIMIT 5;"
   ```

### Scheduler Not Running

1. Check scheduler status:
   ```bash
   npm run ingestion status
   ```

2. Verify configuration:
   ```bash
   sqlite3 dev.sqlite3 "SELECT * FROM system_config WHERE key='ingestion_config';"
   ```

3. Check server logs for initialization errors

### High Duplicate Count

This is normal - it means the system is working correctly by preventing duplicate content.

### API Rate Limits

- News API: 500 requests/day (free tier)
- Implement caching and respect rate limits
- Consider upgrading for production use

## Best Practices

1. **Start Small**: Begin with a few topics and sources
2. **Monitor Performance**: Check logs and statistics regularly
3. **Verify Content**: Review ingested content before making it public
4. **Balance Sources**: Ensure sources across all bias categories
5. **Regular Cleanup**: Old unverified content is automatically cleaned up

## Production Considerations

1. **Use Real APIs**: Mock data is limited; real APIs provide better content
2. **Database Indexing**: Ensure proper indexes on content tables
3. **Error Handling**: Set up alerts for ingestion failures
4. **Scaling**: Consider separate ingestion workers for high volume
5. **Caching**: Implement Redis for trending topics and statistics

## Example Workflow

1. **Initial Setup**:
   ```bash
   npm run ingestion add-sources
   npm run ingestion run -t "climate change"
   npm run ingestion stats
   ```

2. **Configure Automation**:
   ```bash
   npm run ingestion config -s "0 */4 * * *" -t politics economy technology
   npm run ingestion config -e
   ```

3. **Monitor**:
   ```bash
   npm run ingestion status
   # Check API: GET /api/admin/ingestion/status
   ```

4. **Production**:
   ```env
   ENABLE_AUTO_INGESTION=true
   INGESTION_SCHEDULE=0 */6 * * *
   NEWS_API_KEY=your_production_key
   ```

Your automated content ingestion is now ready to keep your CMS fresh with balanced, diverse perspectives! 
#!/usr/bin/env node

import * as dotenv from 'dotenv';
import { Command } from 'commander';
import contentIngestionScheduler from '../services/contentIngestionScheduler';
import Content, { BiasRating } from '../models/Content';
import db from '../db';

// Load environment variables
dotenv.config();

const program = new Command();

program
  .name('ingestion-cli')
  .description('CLI for managing content ingestion')
  .version('1.0.0');

// Initialize scheduler on startup
async function init() {
  await contentIngestionScheduler.initialize();
}

// Add news sources command
program
  .command('add-sources')
  .description('Add default news sources to the database')
  .action(async () => {
    try {
      console.log('Adding default news sources...');
      
      const defaultSources = [
        // Left-leaning sources
        { name: 'CNN', domain: 'cnn.com', bias_rating: BiasRating.LEFT, credibility_score: 75 },
        { name: 'MSNBC', domain: 'msnbc.com', bias_rating: BiasRating.LEFT, credibility_score: 70 },
        { name: 'The Guardian', domain: 'theguardian.com', bias_rating: BiasRating.LEFT_CENTER, credibility_score: 85 },
        { name: 'New York Times', domain: 'nytimes.com', bias_rating: BiasRating.LEFT_CENTER, credibility_score: 90 },
        
        // Center sources
        { name: 'BBC', domain: 'bbc.com', bias_rating: BiasRating.CENTER, credibility_score: 90 },
        { name: 'Reuters', domain: 'reuters.com', bias_rating: BiasRating.CENTER, credibility_score: 95 },
        { name: 'Associated Press', domain: 'ap.org', bias_rating: BiasRating.CENTER, credibility_score: 95 },
        { name: 'NPR', domain: 'npr.org', bias_rating: BiasRating.CENTER, credibility_score: 85 },
        
        // Right-leaning sources
        { name: 'Wall Street Journal', domain: 'wsj.com', bias_rating: BiasRating.RIGHT_CENTER, credibility_score: 90 },
        { name: 'The Hill', domain: 'thehill.com', bias_rating: BiasRating.RIGHT_CENTER, credibility_score: 80 },
        { name: 'Fox News', domain: 'foxnews.com', bias_rating: BiasRating.RIGHT, credibility_score: 65 },
        { name: 'The Daily Wire', domain: 'dailywire.com', bias_rating: BiasRating.RIGHT, credibility_score: 60 },
      ];

      let added = 0;
      for (const source of defaultSources) {
        try {
          // Check if source already exists
          const existing = await db('news_sources')
            .where('domain', source.domain)
            .first();
          
          if (!existing) {
            await Content.createSource({
              ...source,
              description: `${source.name} - News and media organization`,
              is_active: true,
            });
            added++;
            console.log(`✓ Added ${source.name}`);
          } else {
            console.log(`- ${source.name} already exists`);
          }
        } catch (error) {
          console.error(`✗ Failed to add ${source.name}:`, error);
        }
      }
      
      console.log(`\nAdded ${added} new sources`);
      process.exit(0);
    } catch (error) {
      console.error('Error adding sources:', error);
      process.exit(1);
    }
  });

// Run ingestion command
program
  .command('run')
  .description('Run content ingestion manually')
  .option('-t, --topics <topics...>', 'Topics to ingest', ['politics', 'economy', 'technology', 'climate'])
  .action(async (options) => {
    try {
      await init();
      console.log(`Running ingestion for topics: ${options.topics.join(', ')}`);
      
      const result = await contentIngestionScheduler.runIngestion(options.topics);
      
      console.log('\nIngestion Results:');
      console.log(`- New articles: ${result.ingested}`);
      console.log(`- Duplicates: ${result.duplicates}`);
      console.log(`- Failed: ${result.failed}`);
      console.log(`- Duration: ${result.duration.toFixed(2)}s`);
      
      if (result.error) {
        console.error(`- Error: ${result.error}`);
      }
      
      process.exit(0);
    } catch (error) {
      console.error('Error running ingestion:', error);
      process.exit(1);
    }
  });

// Start scheduler command
program
  .command('start')
  .description('Start the automated ingestion scheduler')
  .action(async () => {
    try {
      await init();
      contentIngestionScheduler.start();
      console.log('Ingestion scheduler started');
      
      // Keep the process running
      console.log('Press Ctrl+C to stop...');
      process.on('SIGINT', () => {
        console.log('\nStopping scheduler...');
        contentIngestionScheduler.stop();
        process.exit(0);
      });
    } catch (error) {
      console.error('Error starting scheduler:', error);
      process.exit(1);
    }
  });

// Status command
program
  .command('status')
  .description('Get ingestion scheduler status')
  .action(async () => {
    try {
      await init();
      const status = await contentIngestionScheduler.getStatus();
      
      console.log('\nIngestion Scheduler Status:');
      console.log(`- Running: ${status.isRunning ? 'Yes' : 'No'}`);
      console.log(`- Scheduled: ${status.isScheduled ? 'Yes' : 'No'}`);
      console.log(`- Schedule: ${status.config.schedule}`);
      console.log(`- Topics: ${status.config.topics.join(', ')}`);
      
      if (status.lastRun) {
        console.log('\nLast Run:');
        console.log(`- Time: ${status.lastRun.timestamp}`);
        console.log(`- Ingested: ${status.lastRun.ingested}`);
        console.log(`- Duration: ${status.lastRun.duration.toFixed(2)}s`);
      }
      
      if (status.nextRun) {
        console.log(`\nNext Run: ${status.nextRun}`);
      }
      
      if (status.recentRuns.length > 0) {
        console.log('\nRecent Runs:');
        status.recentRuns.slice(0, 5).forEach(run => {
          console.log(`- ${run.timestamp}: ${run.ingested} articles (${run.duration.toFixed(2)}s)`);
        });
      }
      
      process.exit(0);
    } catch (error) {
      console.error('Error getting status:', error);
      process.exit(1);
    }
  });

// Configure command
program
  .command('config')
  .description('Configure ingestion settings')
  .option('-s, --schedule <cron>', 'Set cron schedule (e.g., "0 */6 * * *")')
  .option('-t, --topics <topics...>', 'Set topics to ingest')
  .option('-e, --enable', 'Enable scheduler')
  .option('-d, --disable', 'Disable scheduler')
  .action(async (options) => {
    try {
      await init();
      
      const config: any = {};
      
      if (options.schedule) {
        config.schedule = options.schedule;
      }
      
      if (options.topics) {
        config.topics = options.topics;
      }
      
      if (options.enable) {
        config.enabled = true;
      }
      
      if (options.disable) {
        config.enabled = false;
      }
      
      await contentIngestionScheduler.saveConfig(config);
      
      const status = await contentIngestionScheduler.getStatus();
      console.log('Configuration updated:');
      console.log(JSON.stringify(status.config, null, 2));
      
      process.exit(0);
    } catch (error) {
      console.error('Error updating config:', error);
      process.exit(1);
    }
  });

// Stats command
program
  .command('stats')
  .description('Show content statistics')
  .action(async () => {
    try {
      const stats = await db('content')
        .select('bias_rating')
        .count('* as count')
        .groupBy('bias_rating');
      
      const sources = await db('news_sources')
        .where('is_active', true)
        .count('* as count')
        .first();
      
      const recent = await db('content')
        .where('created_at', '>', new Date(Date.now() - 24 * 60 * 60 * 1000))
        .count('* as count')
        .first();
      
      console.log('\nContent Statistics:');
      console.log(`- Active sources: ${sources?.count || 0}`);
      console.log(`- Articles (last 24h): ${recent?.count || 0}`);
      console.log('\nContent by Bias:');
      
      stats.forEach(stat => {
        console.log(`- ${stat.bias_rating}: ${stat.count} articles`);
      });
      
      process.exit(0);
    } catch (error) {
      console.error('Error getting stats:', error);
      process.exit(1);
    }
  });

program.parse(); 
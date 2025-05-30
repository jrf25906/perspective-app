/**
 * Concurrent Processing Utilities
 * Implements controlled parallel execution with configurable concurrency limits
 */

/**
 * Process items concurrently with a specified concurrency limit
 * @param items Array of items to process
 * @param processor Function to process each item
 * @param concurrencyLimit Maximum number of concurrent operations
 * @returns Array of results in the same order as input items
 */
export async function processInBatches<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  concurrencyLimit: number = 10
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  const executing: Promise<void>[] = [];

  for (let i = 0; i < items.length; i++) {
    const promise = processor(items[i]).then(
      result => { results[i] = result; },
      error => { results[i] = error; }
    );

    executing.push(promise);

    if (executing.length >= concurrencyLimit) {
      await Promise.race(executing);
      // Remove completed promises
      executing.splice(0, executing.findIndex(p => 
        p === promise || Promise.race([p, Promise.resolve()]) === Promise.resolve()
      ) + 1);
    }
  }

  await Promise.all(executing);
  return results;
}

/**
 * Process items concurrently with error handling
 * @param items Array of items to process
 * @param processor Function to process each item
 * @param options Processing options
 * @returns Object containing successful results and errors
 */
export async function processWithErrors<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  options: {
    concurrencyLimit?: number;
    continueOnError?: boolean;
    onError?: (error: Error, item: T) => void;
  } = {}
): Promise<{
  successful: Array<{ item: T; result: R }>;
  failed: Array<{ item: T; error: Error }>;
}> {
  const {
    concurrencyLimit = 10,
    continueOnError = true,
    onError
  } = options;

  const successful: Array<{ item: T; result: R }> = [];
  const failed: Array<{ item: T; error: Error }> = [];

  const processItem = async (item: T) => {
    try {
      const result = await processor(item);
      successful.push({ item, result });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      failed.push({ item, error: err });
      
      if (onError) {
        onError(err, item);
      }
      
      if (!continueOnError) {
        throw err;
      }
    }
  };

  await processInBatches(items, processItem, concurrencyLimit);

  return { successful, failed };
}

/**
 * Chunk an array into smaller arrays of specified size
 * @param array Array to chunk
 * @param chunkSize Size of each chunk
 * @returns Array of chunks
 */
export function chunk<T>(array: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}

/**
 * Retry an async operation with exponential backoff
 * @param operation The async operation to retry
 * @param options Retry options
 * @returns Result of the operation
 */
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
    backoffFactor?: number;
    retryCondition?: (error: Error) => boolean;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 30000,
    backoffFactor = 2,
    retryCondition = () => true
  } = options;

  let lastError: Error;
  let delay = initialDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt === maxRetries || !retryCondition(lastError)) {
        throw lastError;
      }

      await new Promise(resolve => setTimeout(resolve, delay));
      delay = Math.min(delay * backoffFactor, maxDelay);
    }
  }

  throw lastError!;
}

/**
 * Execute operations in parallel with result aggregation
 * @param operations Map of named operations
 * @returns Map of operation results
 */
export async function executeParallel<T extends Record<string, () => Promise<any>>>(
  operations: T
): Promise<{ [K in keyof T]: Awaited<ReturnType<T[K]>> }> {
  const keys = Object.keys(operations) as Array<keyof T>;
  const promises = keys.map(key => operations[key]());
  const results = await Promise.all(promises);
  
  const resultMap = {} as { [K in keyof T]: Awaited<ReturnType<T[K]>> };
  keys.forEach((key, index) => {
    resultMap[key] = results[index];
  });
  
  return resultMap;
} 
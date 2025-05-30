import { Application } from 'express';
import { createApp } from '../app';
import { container, ServiceTokens } from '../di/container';

export interface TestAppOptions {
  mockServices?: {
    [key: string]: any;
  };
}

/**
 * Creates a test application with optional mock services
 * @param options Configuration options for the test app
 * @returns Express application configured for testing
 */
export function createTestApp(options: TestAppOptions = {}): Application {
  // Clear the container to start fresh
  container.clear();

  // Register mock services if provided
  if (options.mockServices) {
    Object.entries(options.mockServices).forEach(([tokenName, mockService]) => {
      const token = ServiceTokens[tokenName as keyof typeof ServiceTokens];
      if (token) {
        container.registerSingleton(token, mockService);
      }
    });
  }

  // Create app without default services (since we're providing mocks)
  return createApp({ registerDefaultServices: false });
}

/**
 * Creates a mock service instance with jest mocks
 * @param methods Array of method names to mock
 * @returns Mock service object
 */
export function createMockService(methods: string[]): any {
  const mockService: any = {};
  methods.forEach(method => {
    mockService[method] = jest.fn();
  });
  return mockService;
} 
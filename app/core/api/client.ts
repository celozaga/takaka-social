// ============================================================================
// ATProto API Client
// ============================================================================
//
// Centralized API client for Bluesky/ATProto interactions
// Handles authentication, request queuing, and error handling
//

import { BskyAgent } from '@atproto/api';
import { AtpSessionData, AtpSessionEvent } from '@atproto/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================================================
// TYPES
// ============================================================================

export interface ApiClientConfig {
  service: string;
  persistSession?: boolean;
  sessionKey?: string;
}

export interface RequestOptions {
  retries?: number;
  timeout?: number;
  priority?: 'low' | 'normal' | 'high';
}

// ============================================================================
// API CLIENT
// ============================================================================

export class ApiClient {
  private agent: BskyAgent;
  private config: ApiClientConfig;
  private requestQueue: Array<() => Promise<any>> = [];
  private isProcessingQueue = false;

  constructor(config: ApiClientConfig) {
    this.config = {
      persistSession: true,
      sessionKey: 'atp-session',
      ...config,
    };

    this.agent = new BskyAgent({
      service: this.config.service,
      persistSession: this.config.persistSession ? this.persistSession : undefined,
    });
  }

  // Session persistence
  private persistSession = async (evt: AtpSessionEvent, sess?: AtpSessionData) => {
    if (evt === 'create' || evt === 'update') {
      if (sess) {
        await AsyncStorage.setItem(this.config.sessionKey!, JSON.stringify(sess));
      }
    } else if (evt === 'expired' || evt === 'create-failed') {
      await AsyncStorage.removeItem(this.config.sessionKey!);
    }
  };

  // Get the underlying agent
  getAgent(): BskyAgent {
    return this.agent;
  }

  // Authentication
  async login(identifier: string, password: string): Promise<void> {
    await this.agent.login({ identifier, password });
  }

  async logout(): Promise<void> {
    await this.agent.logout();
    if (this.config.persistSession) {
      await AsyncStorage.removeItem(this.config.sessionKey!);
    }
  }

  // Session management
  async resumeSession(): Promise<boolean> {
    if (!this.config.persistSession) return false;

    try {
      const sessionData = await AsyncStorage.getItem(this.config.sessionKey!);
      if (sessionData) {
        const session = JSON.parse(sessionData);
        await this.agent.resumeSession(session);
        return true;
      }
    } catch (error) {
      console.error('Failed to resume session:', error);
    }
    return false;
  }

  // Request queuing with priority
  async queueRequest<T>(
    request: () => Promise<T>,
    options: RequestOptions = {}
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const queuedRequest = async () => {
        try {
          const result = await this.executeWithRetry(request, options.retries || 3);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      };

      // Add to queue based on priority
      if (options.priority === 'high') {
        this.requestQueue.unshift(queuedRequest);
      } else {
        this.requestQueue.push(queuedRequest);
      }

      this.processQueue();
    });
  }

  // Process request queue
  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.requestQueue.length > 0) {
      const request = this.requestQueue.shift();
      if (request) {
        try {
          await request();
        } catch (error) {
          console.error('Request failed:', error);
        }
      }
    }

    this.isProcessingQueue = false;
  }

  // Execute request with retry logic
  private async executeWithRetry<T>(
    request: () => Promise<T>,
    retries: number
  ): Promise<T> {
    let lastError: Error;

    for (let i = 0; i <= retries; i++) {
      try {
        return await request();
      } catch (error) {
        lastError = error as Error;
        
        if (i < retries) {
          // Exponential backoff
          const delay = Math.min(1000 * Math.pow(2, i), 10000);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError!;
  }

  // Check if authenticated
  isAuthenticated(): boolean {
    return !!this.agent.session;
  }

  // Get current session
  getSession(): AtpSessionData | undefined {
    return this.agent.session;
  }
}

// ============================================================================
// DEFAULT INSTANCE
// ============================================================================

export const defaultApiClient = new ApiClient({
  service: 'https://bsky.social',
});
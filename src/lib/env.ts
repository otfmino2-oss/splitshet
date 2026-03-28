/**
 * Environment variable validation and type-safe access
 */

interface EnvConfig {
  // Database
  DATABASE_URL: string;
  
  // JWT
  JWT_SECRET: string;
  JWT_REFRESH_SECRET: string;
  
  // AI
  NVIDIA_API_KEY?: string;
  
  // App
  NODE_ENV: 'development' | 'production' | 'test';
  NEXT_PUBLIC_APP_URL?: string;
  
  // Optional features
  ALLOWED_ORIGINS?: string;
  ENABLE_REQUEST_LOGGING?: string;
  API_TIMEOUT?: string;
  
  // Sentry (optional)
  SENTRY_DSN?: string;
  
  // Redis (optional, for production caching)
  REDIS_URL?: string;
}

class EnvValidator {
  private errors: string[] = [];
  
  /**
   * Validate required environment variables
   */
  validate(): void {
    this.errors = [];
    
    // Required variables
    this.required('DATABASE_URL');
    this.required('JWT_SECRET');
    this.required('JWT_REFRESH_SECRET');
    
    // Validate JWT secrets are different
    if (process.env.JWT_SECRET === process.env.JWT_REFRESH_SECRET) {
      this.errors.push('JWT_SECRET and JWT_REFRESH_SECRET must be different');
    }
    
    // Validate JWT secret strength
    if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
      this.errors.push('JWT_SECRET should be at least 32 characters for security');
    }
    
    // Warn about missing optional but recommended variables
    this.warn('NVIDIA_API_KEY', 'AI features will be disabled');
    
    // Production-specific checks
    if (process.env.NODE_ENV === 'production') {
      this.validateProduction();
    }
    
    if (this.errors.length > 0) {
      throw new Error(
        `Environment validation failed:\n${this.errors.map(e => `  - ${e}`).join('\n')}`
      );
    }
  }
  
  /**
   * Production-specific validation
   */
  private validateProduction(): void {
    // Ensure secrets are not defaults
    if (process.env.JWT_SECRET === 'dev-secret-key') {
      this.errors.push('JWT_SECRET must not be the default value in production');
    }
    
    if (process.env.JWT_REFRESH_SECRET === 'dev-refresh-secret-key') {
      this.errors.push('JWT_REFRESH_SECRET must not be the default value in production');
    }
    
    // Check database URL is not SQLite in production
    if (process.env.DATABASE_URL?.includes('file:')) {
      this.errors.push('SQLite is not recommended for production. Use PostgreSQL.');
    }
    
    // Recommend Redis for production
    this.warn('REDIS_URL', 'In-memory cache will be used. Consider Redis for production.');
  }
  
  /**
   * Check if required variable exists
   */
  private required(key: string): void {
    if (!process.env[key]) {
      this.errors.push(`${key} is required but not set`);
    }
  }
  
  /**
   * Warn about missing optional variable
   */
  private warn(key: string, message: string): void {
    if (!process.env[key] && process.env.NODE_ENV !== 'test') {
      console.warn(`[ENV WARNING] ${key} is not set. ${message}`);
    }
  }
  
  /**
   * Get type-safe environment variable
   */
  get<K extends keyof EnvConfig>(key: K): EnvConfig[K] {
    return process.env[key] as EnvConfig[K];
  }
  
  /**
   * Get environment variable with default
   */
  getWithDefault<T extends string>(key: string, defaultValue: T): string {
    return process.env[key] || defaultValue;
  }
  
  /**
   * Check if we're in development
   */
  isDevelopment(): boolean {
    return process.env.NODE_ENV === 'development';
  }
  
  /**
   * Check if we're in production
   */
  isProduction(): boolean {
    return process.env.NODE_ENV === 'production';
  }
  
  /**
   * Check if we're in test
   */
  isTest(): boolean {
    return process.env.NODE_ENV === 'test';
  }
}

// Singleton instance
export const env = new EnvValidator();

// Validate on import (but allow errors in test mode)
if (process.env.NODE_ENV !== 'test') {
  try {
    env.validate();
  } catch (error) {
    if (error instanceof Error) {
      console.error('\n❌ Environment Validation Failed:\n');
      console.error(error.message);
      console.error('\nPlease check your .env file and ensure all required variables are set.\n');
    }
    
    // Only exit in production/development, not during build
    if (process.env.NODE_ENV !== 'test' && !process.env.SKIP_ENV_VALIDATION) {
      process.exit(1);
    }
  }
}

export default env;

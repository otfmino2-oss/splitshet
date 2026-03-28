/**
 * Performance monitoring and profiling utilities
 */

interface PerformanceMetrics {
  name: string;
  duration: number;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private maxMetrics = 1000;
  private activeTimers = new Map<string, number>();

  /**
   * Start timing an operation
   */
  start(name: string, metadata?: Record<string, unknown>): void {
    this.activeTimers.set(name, Date.now());
    if (metadata) {
      // Store metadata for later
      this.activeTimers.set(`${name}:metadata`, metadata as any);
    }
  }

  /**
   * End timing an operation and record metric
   */
  end(name: string): number {
    const startTime = this.activeTimers.get(name);
    
    if (!startTime) {
      console.warn(`[Performance] No start time found for: ${name}`);
      return 0;
    }

    const duration = Date.now() - startTime;
    const metadata = this.activeTimers.get(`${name}:metadata`) as Record<string, unknown> | undefined;

    // Record metric
    this.record({
      name,
      duration,
      timestamp: Date.now(),
      metadata,
    });

    // Clean up
    this.activeTimers.delete(name);
    this.activeTimers.delete(`${name}:metadata`);

    return duration;
  }

  /**
   * Measure an async function
   */
  async measure<T>(
    name: string,
    fn: () => Promise<T>,
    metadata?: Record<string, unknown>
  ): Promise<T> {
    this.start(name, metadata);
    try {
      const result = await fn();
      this.end(name);
      return result;
    } catch (error) {
      this.end(name);
      throw error;
    }
  }

  /**
   * Record a metric manually
   */
  record(metric: PerformanceMetrics): void {
    this.metrics.push(metric);

    // Keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }

    // Log slow operations in development
    if (process.env.NODE_ENV === 'development' && metric.duration > 1000) {
      console.warn(`[Performance] Slow operation: ${metric.name} took ${metric.duration}ms`);
    }
  }

  /**
   * Get metrics for a specific operation
   */
  getMetrics(name?: string): PerformanceMetrics[] {
    if (!name) {
      return [...this.metrics];
    }
    return this.metrics.filter(m => m.name === name);
  }

  /**
   * Get average duration for an operation
   */
  getAverage(name: string): number {
    const metrics = this.getMetrics(name);
    if (metrics.length === 0) return 0;

    const total = metrics.reduce((sum, m) => sum + m.duration, 0);
    return total / metrics.length;
  }

  /**
   * Get statistics for an operation
   */
  getStats(name: string): {
    count: number;
    avg: number;
    min: number;
    max: number;
    p50: number;
    p95: number;
    p99: number;
  } | null {
    const metrics = this.getMetrics(name);
    if (metrics.length === 0) return null;

    const durations = metrics.map(m => m.duration).sort((a, b) => a - b);
    const count = durations.length;
    const avg = durations.reduce((sum, d) => sum + d, 0) / count;
    const min = durations[0];
    const max = durations[count - 1];

    const percentile = (p: number) => {
      const index = Math.ceil((p / 100) * count) - 1;
      return durations[Math.max(0, index)];
    };

    return {
      count,
      avg: Math.round(avg),
      min,
      max,
      p50: percentile(50),
      p95: percentile(95),
      p99: percentile(99),
    };
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = [];
    this.activeTimers.clear();
  }

  /**
   * Get summary of all operations
   */
  getSummary(): Record<string, ReturnType<typeof this.getStats>> {
    const operationNames = new Set(this.metrics.map(m => m.name));
    const summary: Record<string, ReturnType<typeof this.getStats>> = {};

    for (const name of operationNames) {
      summary[name] = this.getStats(name);
    }

    return summary;
  }
}

// Global performance monitor instance
export const perfMonitor = new PerformanceMonitor();

/**
 * Decorator for measuring function performance
 */
export function measurePerformance(name?: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const metricName = name || `${target.constructor.name}.${propertyKey}`;

    descriptor.value = async function (...args: any[]) {
      return perfMonitor.measure(metricName, () => originalMethod.apply(this, args));
    };

    return descriptor;
  };
}

/**
 * Simple timer utility for inline measurements
 */
export class Timer {
  private startTime: number;
  private name: string;

  constructor(name: string) {
    this.name = name;
    this.startTime = Date.now();
  }

  /**
   * Stop timer and return duration
   */
  stop(): number {
    const duration = Date.now() - this.startTime;
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Timer] ${this.name}: ${duration}ms`);
    }

    return duration;
  }

  /**
   * Stop timer and log if above threshold
   */
  stopIf(thresholdMs: number): number {
    const duration = this.stop();
    
    if (duration > thresholdMs) {
      console.warn(`[Timer] ${this.name} exceeded threshold: ${duration}ms > ${thresholdMs}ms`);
    }

    return duration;
  }
}

/**
 * Database query performance tracking
 */
export function trackQuery(operation: string, model: string): () => void {
  const startTime = Date.now();
  
  return () => {
    const duration = Date.now() - startTime;
    perfMonitor.record({
      name: `db:${model}:${operation}`,
      duration,
      timestamp: Date.now(),
      metadata: { model, operation },
    });

    // Warn on slow queries
    if (duration > 100 && process.env.NODE_ENV === 'development') {
      console.warn(`[DB] Slow query: ${model}.${operation} took ${duration}ms`);
    }
  };
}

export default perfMonitor;

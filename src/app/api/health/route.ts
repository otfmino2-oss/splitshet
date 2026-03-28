import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cache } from '@/lib/cache';

/**
 * Health check endpoint for monitoring
 * GET /api/health
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  const health = {
    status: 'ok' as 'ok' | 'degraded' | 'error',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || '0.1.0',
    checks: {
      database: { status: 'unknown' as 'ok' | 'error', responseTime: 0 },
      cache: { status: 'unknown' as 'ok' | 'error', size: 0 },
      memory: { status: 'unknown' as 'ok' | 'error', usage: {} as any },
    },
  };
  
  // Check database connectivity
  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    health.checks.database = {
      status: 'ok',
      responseTime: Date.now() - dbStart,
    };
  } catch (error) {
    health.status = 'error';
    health.checks.database = {
      status: 'error',
      responseTime: Date.now() - startTime,
    };
  }
  
  // Check cache
  try {
    const stats = cache.stats();
    health.checks.cache = {
      status: 'ok',
      size: stats.size,
    };
  } catch (error) {
    health.checks.cache = {
      status: 'error',
      size: 0,
    };
  }
  
  // Check memory usage
  try {
    const memUsage = process.memoryUsage();
    const used = memUsage.heapUsed / 1024 / 1024;
    const total = memUsage.heapTotal / 1024 / 1024;
    
    health.checks.memory = {
      status: used / total > 0.9 ? 'error' : 'ok',
      usage: {
        heapUsed: `${Math.round(used)}MB`,
        heapTotal: `${Math.round(total)}MB`,
        percentage: `${Math.round((used / total) * 100)}%`,
      },
    };
    
    if (health.checks.memory.status === 'error') {
      health.status = 'degraded';
    }
  } catch (error) {
    health.checks.memory = {
      status: 'error',
      usage: {},
    };
  }
  
  // Determine overall status
  if (health.checks.database.status === 'error') {
    health.status = 'error';
  } else if (
    health.checks.cache.status === 'error' ||
    health.checks.memory.status === 'error'
  ) {
    health.status = 'degraded';
  }
  
  const statusCode = health.status === 'ok' ? 200 : health.status === 'degraded' ? 200 : 503;
  
  return NextResponse.json(health, {
    status: statusCode,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'X-Response-Time': `${Date.now() - startTime}ms`,
    },
  });
}

/**
 * Detailed health check for internal monitoring
 * Includes more sensitive information
 */
export async function POST(request: NextRequest) {
  // Require authorization for detailed health
  const authHeader = request.headers.get('authorization');
  const expectedToken = process.env.HEALTH_CHECK_TOKEN || 'dev-health-token';
  
  if (authHeader !== `Bearer ${expectedToken}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  const startTime = Date.now();
  
  const detailedHealth = {
    status: 'ok' as 'ok' | 'degraded' | 'error',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || '0.1.0',
    checks: {
      database: { status: 'ok' as 'ok' | 'error', responseTime: 0, connectionPool: {} as any },
      cache: { status: 'ok' as 'ok' | 'error', stats: {} as any },
      memory: { status: 'ok' as 'ok' | 'error', usage: {} as any },
      cpu: { status: 'ok' as 'ok' | 'error', usage: {} as any },
    },
    metadata: {
      pid: process.pid,
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
    },
  };
  
  // Database check with connection pool info
  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const responseTime = Date.now() - dbStart;
    
    detailedHealth.checks.database = {
      status: 'ok',
      responseTime,
      connectionPool: {
        // Prisma doesn't expose pool stats directly, but we can note the response time
        healthy: responseTime < 100,
        avgResponseTime: `${responseTime}ms`,
      },
    };
  } catch (error) {
    detailedHealth.status = 'error';
    detailedHealth.checks.database = {
      status: 'error',
      responseTime: Date.now() - startTime,
      connectionPool: { healthy: false },
    };
  }
  
  // Cache stats
  try {
    const stats = cache.stats();
    detailedHealth.checks.cache = {
      status: 'ok',
      stats,
    };
  } catch (error) {
    detailedHealth.checks.cache = {
      status: 'error',
      stats: {},
    };
  }
  
  // Memory usage
  const memUsage = process.memoryUsage();
  const used = memUsage.heapUsed / 1024 / 1024;
  const total = memUsage.heapTotal / 1024 / 1024;
  const rss = memUsage.rss / 1024 / 1024;
  const external = memUsage.external / 1024 / 1024;
  
  detailedHealth.checks.memory = {
    status: used / total > 0.9 ? 'error' : 'ok',
    usage: {
      heapUsed: `${Math.round(used)}MB`,
      heapTotal: `${Math.round(total)}MB`,
      rss: `${Math.round(rss)}MB`,
      external: `${Math.round(external)}MB`,
      percentage: `${Math.round((used / total) * 100)}%`,
    },
  };
  
  // CPU usage (basic)
  const cpuUsage = process.cpuUsage();
  detailedHealth.checks.cpu = {
    status: 'ok',
    usage: {
      user: `${(cpuUsage.user / 1000000).toFixed(2)}s`,
      system: `${(cpuUsage.system / 1000000).toFixed(2)}s`,
    },
  };
  
  return NextResponse.json(detailedHealth, {
    status: 200,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'X-Response-Time': `${Date.now() - startTime}ms`,
    },
  });
}

import { Hono } from 'hono'
import { env } from 'process'

import db from '../../db/db.js'

export const healthRoute = new Hono().basePath('health')

/**
 * Simple health check endpoint
 */
healthRoute.get('/', (c) =>
	c.json({
		status: 'ok',
		timestamp: new Date().toISOString(),
		version: '1.0.0'
	})
)

/**
 * Detailed health check with system monitoring
 */
healthRoute.get('/detailed', async (c) => {
	const startTime = Date.now()

	interface HealthCheck {
		status: 'healthy' | 'unhealthy' | 'warning'
		responseTime?: number
		error?: string
		heapUsed?: string
		heapTotal?: string
		rss?: string
		missingVariables?: string[]
	}

	const checks: Record<string, HealthCheck> = {}

	// Database connectivity check
	await db.$queryRaw`SELECT 1`
	checks['database'] = {
		status: 'healthy',
		responseTime: Date.now() - startTime
	}

	// Memory usage check
	const memoryUsage = process.memoryUsage()

	checks['memory'] = {
		status:
			memoryUsage.heapUsed < 500 * 1024 * 1024 ? 'healthy' : 'warning', // 500MB threshold
		heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
		heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
		rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`
	}

	// Environment variables check
	const requiredEnvVars = ['DATABASE_URL', 'SESSION_SECRET']

	const missingEnvVars = requiredEnvVars.filter((envVar) => !env[envVar])

	checks['environment'] = {
		status: missingEnvVars.length === 0 ? 'healthy' : 'unhealthy',
		missingVariables: missingEnvVars
	}

	// Overall status
	const overallStatus = Object.values(checks).every(
		(check) => check.status === 'healthy' || check.status === 'warning'
	)
		? 'healthy'
		: 'unhealthy'

	const health = {
		status: overallStatus,
		timestamp: new Date().toISOString(),
		version: '1.0.0',
		environment: env.NODE_ENV || 'development',
		uptime: process.uptime(),
		checks,
		responseTime: Date.now() - startTime
	}

	const statusCode = overallStatus === 'healthy' ? 200 : 503

	return c.json(health, statusCode)
})

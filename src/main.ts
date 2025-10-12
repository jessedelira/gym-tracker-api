import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'

import { corsConfig } from './config/cors-config.js'
import { customLoggerMiddleware } from './middleware/custom-logger-middleware.js'
import { rateLimiterMiddleware } from './middleware/rate-limiter-middleware.js'
import { attachmentRoute } from './routes/attachment-route.js'
import { authRoute } from './routes/auth/auth-route.js'
import { eventRoute } from './routes/event-route.js'
import { healthRoute } from './routes/health-route.js'
import { userRoute } from './routes/user/user-route.js'
import { errorHandler } from './utils/error-handler.js'

const app = new Hono()

// Global error handler
app.onError(errorHandler)

// Core middlewares (order matters!)
app.use('*', rateLimiterMiddleware)
app.use('*', logger(customLoggerMiddleware))
app.use('*', cors(corsConfig))

// API Routes
const apiRoutes = [
	userRoute,
	authRoute,
	eventRoute,
	attachmentRoute,
	healthRoute
]

for (const route of apiRoutes) {
	app.route('/api', route)
}

// Start server
const port = Number(process.env.PORT) || 3000

serve(
	{
		fetch: app.fetch,
		port
	},
	(info) => {
		console.log('🚀 Server started successfully', {
			port: info.port,
			environment: process.env.NODE_ENV || 'development',
			nodeVersion: process.version,
			pid: process.pid
		})
	}
)

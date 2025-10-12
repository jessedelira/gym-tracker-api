import { cors } from 'hono/cors'

type CORSOptions = Parameters<typeof cors>[0]

export const corsConfig: CORSOptions = {
	origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
	allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
	allowHeaders: ['Content-Type', 'Authorization', 'Cookie'],
	exposeHeaders: ['Content-Length', 'X-Kuma-Revision'],
	maxAge: 600,
	credentials: true
}

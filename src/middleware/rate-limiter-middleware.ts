import { type Context, type Next } from 'hono'

import { AppError } from '../utils/error-handler.js'

// Simple in-memory rate limiter
const rateLimiter = new Map<string, { count: number; resetTime: number }>()

export async function rateLimiterMiddleware(c: Context, next: Next) {
	const ip =
		c.req.header('x-forwarded-for') ||
		c.req.header('x-real-ip') ||
		'unknown'
	const now = Date.now()

	const userLimit = rateLimiter.get(ip)

	const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS) || 900000 // 15 minutes
	const maxRequests = Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 50

	if (userLimit) {
		if (now > userLimit.resetTime) {
			// Reset if window has passed
			rateLimiter.set(ip, {
				count: 1,
				resetTime: now + windowMs
			})
		} else if (userLimit.count >= maxRequests) {
			// Rate limit exceeded
			throw new AppError(
				'Too many requests, please try again later.',
				429
			)
		} else {
			// Increment count
			userLimit.count++
		}
	} else {
		// First request from this IP
		rateLimiter.set(ip, {
			count: 1,
			resetTime: now + windowMs
		})
	}

	await next()
}

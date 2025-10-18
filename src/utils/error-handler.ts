import { type Context } from 'hono'
import { HTTPException } from 'hono/http-exception'
import type { ContentfulStatusCode } from 'hono/utils/http-status'
import { ZodError } from 'zod'

import { HTTP_STATUS } from './http-status.enum.js'

export class AppError extends Error {
	public statusCode: number

	constructor(
		message?: string,
		statusCode: ContentfulStatusCode = 500,
		cause?: unknown
	) {
		super(message)
		this.statusCode = statusCode
		this.cause = cause
	}
}

export function errorHandler(error: Error, c: Context) {
	console.error('[Error]:', {
		message: error.message,
		cause: error.cause
	})

	// Validation errors
	if (error instanceof ZodError) {
		return c.json(
			{ error: 'Validation failed', details: error.errors },
			HTTP_STATUS.BAD_REQUEST
		)
	}

	// HTTP exceptions
	if (error instanceof HTTPException) {
		return c.json({ error: error.message }, error.status)
	}

	// App Error
	if (error instanceof AppError) {
		return c.json({ error: error.message })
	}

	// Everything else
	return c.json(
		{ error: 'Internal server error' },
		HTTP_STATUS.INTERNAL_SERVER_ERROR
	)
}

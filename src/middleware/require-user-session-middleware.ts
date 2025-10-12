import { createMiddleware } from 'hono/factory'

import { db } from '../db/prisma-config.js'
import { AppError } from '../utils/error-handler.js'
import { HTTP_STATUS } from '../utils/http-status.enum.js'

import type { User } from '@prisma/client'

export const requireUserSession = createMiddleware<{
	Variables: { user: User }
}>(async (c, next) => {
	const sessionId = c.req.header('cookie')?.match(/session_id=([^;]+)/)?.[1]

	if (!sessionId) {
		throw new AppError('Unauthorized', HTTP_STATUS.UNAUTHORIZED)
	}

	const session = await db.session.findUnique({
		where: { id: sessionId },
		include: { user: true }
	})

	if (!session || new Date() > session.expiresAt) {
		throw new AppError(
			'Session expired or invalid',
			HTTP_STATUS.UNAUTHORIZED
		)
	}

	await db.session.update({
		where: { id: sessionId },
		data: { lastActive: new Date() }
	})

	c.set('user', session.user)
	await next()
})

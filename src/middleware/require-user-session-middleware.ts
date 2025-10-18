import type { User } from '@prisma/client'
import { createMiddleware } from 'hono/factory'

import db from '../db/db.js'
import { AppError } from '../utils/error-handler.js'
import { HTTP_STATUS } from '../utils/http-status.enum.js'

export const requireUserSession = createMiddleware<{
	Variables: { user: User }
}>(async (c, next) => {
	const sessionId = c.req.header('cookie')?.match(/session_id=([^;]+)/)?.[1]

	if (!sessionId) {
		throw new AppError('Unauthorized', HTTP_STATUS.UNAUTHORIZED)
	}

	const userSession = await db.userSession.findUnique({
		where: { id: sessionId },
		include: { user: true }
	})

	if (!userSession || new Date() > userSession.expiresAt) {
		throw new AppError(
			'Session expired or invalid',
			HTTP_STATUS.UNAUTHORIZED
		)
	}

	await db.userSession.update({
		where: { id: sessionId },
		data: { lastActive: new Date() }
	})

	c.set('user', userSession.user)
	await next()
})

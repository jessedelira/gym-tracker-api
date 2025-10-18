import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'

import db from '../../db/db.js'
import { requireUserSession } from '../../middleware/require-user-session-middleware.js'
import { AppError } from '../../utils/error-handler.js'
import { HTTP_STATUS } from '../../utils/http-status.enum.js'
import { CreateActiveSessionSchema } from './dto/create-active-session.dto.js'
import { GetActiveSessionSchema } from './dto/get-active-session.dto.js'

// Route setup
export const activeSessionRoute = new Hono().basePath('active-session')

activeSessionRoute.post(
	'/',
	requireUserSession,
	zValidator('json', CreateActiveSessionSchema),
	async (c) => {
		const { userId, sessionId } = c.req.valid('json')

		// 1. Find session by ID
		const session = await db.session.findUnique({
			where: { id: sessionId }
		})

		if (!session) {
			throw new AppError('Session not found', HTTP_STATUS.NOT_FOUND)
		}

		// 2. Create new active session
		const createdActiveSession = await db.activeSession.create({
			data: {
				userId,
				sessionId,
				startedAt: new Date()
			}
		})

		return c.json(createdActiveSession, HTTP_STATUS.CREATED)
	}
)

activeSessionRoute.get(
	'/:userId',
	requireUserSession,
	zValidator('param', GetActiveSessionSchema),
	async (c) => {
		const { userId } = c.req.valid('param')

		const activeSession = await db.activeSession.findFirst({
			select: {
				startedAt: true,
				session: {
					select: {
						id: true,
						name: true
					}
				}
			},
			where: { userId }
		})

		if (!activeSession) {
			throw new AppError('No active session found', HTTP_STATUS.NOT_FOUND)
		}

		return c.json(activeSession, HTTP_STATUS.OK)
	}
)

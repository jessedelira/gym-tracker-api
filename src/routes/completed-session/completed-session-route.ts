import { zValidator } from '@hono/zod-validator'
import { toZonedTime, getTimezoneOffset } from 'date-fns-tz'
import { Hono } from 'hono'

import { CreateCompletedSessionSchema } from './dto/create-completed-session.dto.js'
import {
	GetCompletedSessionIdsSchema,
	type GetCompletedSessionIdsDto
} from './dto/get-completed-session-ids.dto.js'
import { db } from '../../db/prisma-config.js'
import { requireUserSession } from '../../middleware/require-user-session-middleware.js'
import { AppError } from '../../utils/error-handler.js'
import { HTTP_STATUS } from '../../utils/http-status.enum.js'

// Route setup
export const completedSessionRoute = new Hono().basePath('completed-session')

// POST /completed-session
completedSessionRoute.post(
	'/',
	requireUserSession,
	zValidator('json', CreateCompletedSessionSchema),
	async (c) => {
		const { userId, sessionId } = c.req.valid('json')

		// 1. Find active session
		const activeSession = await db.activeSession.findFirst({
			where: { sessionId }
		})

		if (!activeSession) {
			throw new AppError(
				'Active session not found',
				HTTP_STATUS.NOT_FOUND
			)
		}

		// TODO: calculate percentage of workouts completed
		const createdCompletedSession = await db.completedSession.create({
			data: {
				startedAt: activeSession.startedAt,
				percentageCompleted: 1, // placeholder
				sessionId,
				userId
			}
		})

		// Delete from active session
		await db.activeSession.delete({ where: { id: activeSession.id } })

		return c.json(createdCompletedSession, HTTP_STATUS.CREATED)
	}
)

// GET /completed-session/list?userUTCDateTime=...
completedSessionRoute.get(
	'/list',
	requireUserSession,
	zValidator('query', GetCompletedSessionIdsSchema),
	async (c) => {
		const currentuser = c.get('user')
		const getCompletedSessionIdsDto: GetCompletedSessionIdsDto =
			c.req.valid('query')

		const enrichedUser = await db.user.findUnique({
			where: { id: currentuser.id },
			include: {
				userPreferences: true,
				userSetting: {
					select: {
						timezone: true
					}
				}
			}
		})

		const inputDate =
			getCompletedSessionIdsDto.userUTCDateTime instanceof Date
				? getCompletedSessionIdsDto.userUTCDateTime
				: new Date(getCompletedSessionIdsDto.userUTCDateTime)

		const userTimezone = enrichedUser?.userSetting?.timezone.iana ?? 'UTC'

		const userLocalDate = toZonedTime(inputDate, userTimezone)

		const startOfDayLocal = new Date(userLocalDate)

		startOfDayLocal.setHours(0, 0, 0, 0)

		const endOfDayLocal = new Date(userLocalDate)

		endOfDayLocal.setHours(23, 59, 59, 999)

		const tzOffset = getTimezoneOffset(userTimezone, inputDate)

		const startOfDayUTC = new Date(startOfDayLocal.getTime() - tzOffset)
		const endOfDayUTC = new Date(endOfDayLocal.getTime() - tzOffset)

		const completedSessionIds = await db.completedSession.findMany({
			select: { sessionId: true },
			where: {
				userId: c.get('user')?.id,
				session: { routine: { isActive: true } },
				completedAt: { gte: startOfDayUTC, lt: endOfDayUTC }
			}
		})

		return c.json(completedSessionIds.map((s) => s.sessionId))
	}
)

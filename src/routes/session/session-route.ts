import { zValidator } from '@hono/zod-validator'
import { DayOfWeek } from '@prisma/client'
import { Hono } from 'hono'
import z from 'zod'

import db from '../../db/db.js'
import { requireUserSession } from '../../middleware/require-user-session-middleware.js'
import { HTTP_STATUS } from '../../utils/http-status.enum.js'
import {
	type CreateUpdateSessionDto,
	CreateUpdateSessionSchema
} from './dto/create-update-session.dto.js'

export const sessionRoute = new Hono().basePath('session')

/**
 * POST /session
 * Create a new session with active days
 */
sessionRoute.post(
	'/',
	requireUserSession,
	zValidator('json', CreateUpdateSessionSchema),
	async (c) => {
		const createUpdateSessionDto: CreateUpdateSessionDto =
			c.req.valid('json')

		const createdSession = await db.session.create({
			data: {
				name: createUpdateSessionDto.name,
				description: createUpdateSessionDto.description,
				userId: createUpdateSessionDto.userId
			}
		})

		await Promise.all(
			createUpdateSessionDto.days.map((day) =>
				db.sessionDaysActive.create({
					data: { day, sessionId: createdSession.id }
				})
			)
		)

		return c.json(createdSession, HTTP_STATUS.CREATED)
	}
)

/**
 * GET /session/all?userId=...
 * Get all sessions for a user
 */
sessionRoute.get(
	'/all',
	requireUserSession,
	zValidator('query', z.object({ userId: z.string() })),
	async (c) => {
		const { userId } = c.req.valid('query')
		const sessions = await db.session.findMany({ where: { userId } })

		return c.json(sessions)
	}
)

/**
 * GET /session/active-routine?userId=...
 * Get sessions added to the current active routine
 */
sessionRoute.get(
	'/active-routine',
	requireUserSession,
	zValidator('query', z.object({ userId: z.string() })),
	async (c) => {
		const { userId } = c.req.valid('query')

		const activeRoutine = await db.routine.findFirst({
			where: { userId, isActive: true }
		})

		if (!activeRoutine) return c.json(null)

		const sessions = await db.session.findMany({
			where: { routineId: activeRoutine.id },
			include: { daysActive: true }
		})

		return c.json(sessions)
	}
)

/**
 * GET /session/not-in-active-routine?userId=...
 * Get sessions not added to the active routine
 */
sessionRoute.get(
	'/not-in-active-routine',
	requireUserSession,
	zValidator('query', z.object({ userId: z.string() })),
	async (c) => {
		const { userId } = c.req.valid('query')

		const activeRoutine = await db.routine.findFirst({
			where: { userId, isActive: true }
		})

		if (!activeRoutine) return c.json(null)

		const sessions = await db.session.findMany({
			where: {
				AND: [
					{ userId },
					{
						OR: [
							{ routineId: null },
							{ routineId: { not: activeRoutine.id } }
						]
					}
				]
			}
		})

		return c.json(sessions)
	}
)

/**
 * DELETE /session/:sessionId
 * Delete a session
 */
sessionRoute.delete('/:sessionId', requireUserSession, async (c) => {
	const { sessionId } = c.req.param()

	await db.session.delete({ where: { id: sessionId } })

	return c.json({ success: true }, HTTP_STATUS.OK)
})
/**
 * GET /session/active-on-date
 * Get sessions that are active on a specific date
 */
sessionRoute.get(
	'/active-on-date',
	requireUserSession,
	zValidator(
		'query',
		z.object({
			userId: z.string(),
			date: z.coerce.date()
		})
	),
	async (c) => {
		const { userId, date } = c.req.valid('query')
		const currentUser = c.get('user')

		if (!currentUser) {
			return c.json({ error: 'Unauthorized' }, 401)
		}

		// Get user timezone (defaults to UTC if not set)
		const enrichedUser = await db.user.findFirst({
			where: { id: currentUser.id },
			include: {
				userSetting: {
					include: {
						timezone: true
					}
				}
			}
		})

		const userTimezone = enrichedUser?.userSetting?.timezone?.iana ?? 'UTC'

		// Convert input date to user's timezone
		const userDate = new Date(
			date.toLocaleString('en-US', { timeZone: userTimezone })
		)

		// Directly map JS weekday (0–6) to Prisma enum values
		const dayNames: DayOfWeek[] = [
			DayOfWeek.SUNDAY,
			DayOfWeek.MONDAY,
			DayOfWeek.TUESDAY,
			DayOfWeek.WEDNESDAY,
			DayOfWeek.THURSDAY,
			DayOfWeek.FRIDAY,
			DayOfWeek.SATURDAY
		]
		const targetDay = dayNames[userDate.getDay()]

		const sessions = await db.session.findMany({
			select: { id: true, name: true, description: true },
			where: {
				userId,
				daysActive: {
					some: {
						day: targetDay as DayOfWeek // directly use the enum
					}
				},
				routine: { isActive: true }
			}
		})

		return c.json(sessions)
	}
)

/**
 * GET /session/:sessionId
 * Get a session by ID
 */
sessionRoute.get('/:sessionId', requireUserSession, async (c) => {
	const { sessionId } = c.req.param()
	const session = await db.session.findUnique({
		where: { id: sessionId },
		include: {
			daysActive: true,
			workouts: { include: { exercise: true } }
		}
	})

	if (!session) throw new Error('Session not found')

	const currentUser = c.get('user')

	if (session.userId !== currentUser?.id) throw new Error('Unauthorized')

	return c.json(session)
})

/**
 * PATCH /session/:sessionId
 * Update a session including days and workouts
 */
sessionRoute.patch(
	'/:sessionId',
	requireUserSession,
	zValidator('json', CreateUpdateSessionSchema),
	async (c) => {
		const createUpdateSessionDto: CreateUpdateSessionDto =
			c.req.valid('json')

		// Delete existin days and workouts
		await db.sessionDaysActive.deleteMany({
			where: { sessionId: createUpdateSessionDto.sessionId }
		})
		await db.workout.deleteMany({
			where: { sessionId: createUpdateSessionDto.sessionId }
		})

		// Update Session
		const updatedSession = await db.session.update({
			where: { id: createUpdateSessionDto.sessionId },
			data: {
				name: createUpdateSessionDto.name,
				description: createUpdateSessionDto.description,
				daysActive: {
					create: createUpdateSessionDto.days.map((day) => ({
						day: day
					}))
				},
				workouts: {
					create: createUpdateSessionDto.workouts.map((workout) => ({
						exerciseId: workout.exerciseId,
						weightLbs: workout.weightLbs ?? null,
						reps: workout.reps ?? null,
						sets: workout.sets ?? null,
						durationSeconds: workout.durationSeconds ?? null,
						userId: createUpdateSessionDto.userId
					}))
				}
			},
			include: {
				daysActive: true,
				workouts: true
			}
		})

		return c.json(updatedSession)
	}
)

/**
 * GET /session/not-in-routine
 * Get sessions not assigned to any routine
 */
sessionRoute.get('/not-in-routine', requireUserSession, async (c) => {
	const currentUser = c.get('user')
	const sessions = await db.session.findMany({
		where: { userId: currentUser?.id, routineId: null },
		include: { daysActive: true }
	})

	return c.json(sessions)
})

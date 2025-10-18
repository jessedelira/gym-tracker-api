import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { z } from 'zod'

import db from '../../db/db.js'
import { requireUserSession } from '../../middleware/require-user-session-middleware.js'
import { AppError } from '../../utils/error-handler.js'
import { HTTP_STATUS } from '../../utils/http-status.enum.js'
import { CreateRoutineSchema } from './dto/create-routine.dto.js'
import { RoutineIdParamSchema } from './dto/routine-id-param.dto.js'
import { SessionRoutineActionSchema } from './dto/session-routine-action.dto.js'
import { UpdateRoutineSchema } from './dto/update-routine.dto.js'

// Route setup
export const routineRoute = new Hono().basePath('routine')

// Create routine
routineRoute.post(
	'/create',
	requireUserSession,
	zValidator('json', CreateRoutineSchema),
	async (c) => {
		const { name, description, userId } = c.req.valid('json')
		const created = await db.routine.create({
			data: { name, description, userId }
		})

		return c.json(created, HTTP_STATUS.CREATED)
	}
)

// Get routines by userId
routineRoute.get(
	'/list/:userId',
	requireUserSession,
	zValidator('param', z.object({ userId: z.string() })),
	async (c) => {
		const { userId } = c.req.valid('param')
		const routines = await db.routine.findMany({ where: { userId } })

		return c.json(routines, HTTP_STATUS.OK)
	}
)

// Get routine count for current user
routineRoute.get('/count', requireUserSession, async (c) => {
	const user = c.get('user')
	const count = await db.routine.count({ where: { userId: user.id } })

	return c.json({ count }, HTTP_STATUS.OK)
})

// Get active routine for current user
routineRoute.get('/active', requireUserSession, async (c) => {
	const user = c.get('user')
	const routine = await db.routine.findFirst({
		where: { userId: user.id, isActive: true }
	})

	if (!routine) throw new AppError('No active routine', HTTP_STATUS.NOT_FOUND)

	return c.json(routine, HTTP_STATUS.OK)
})

// Set a routine as active
routineRoute.post(
	'/set-active',
	requireUserSession,
	zValidator('param', RoutineIdParamSchema),
	async (c) => {
		const { routineId } = c.req.valid('param')

		// deactivate all routines
		await db.routine.updateMany({
			where: { isActive: true },
			data: { isActive: false }
		})

		// activate selected routine
		const routine = await db.routine.update({
			where: { id: routineId },
			data: { isActive: true }
		})

		return c.json(routine, HTTP_STATUS.OK)
	}
)

// Remove active routine for a user
routineRoute.post(
	'/remove-active',
	requireUserSession,
	zValidator('json', z.object({ userId: z.string() })),
	async (c) => {
		const { userId } = c.req.valid('json')
		const routines = await db.routine.updateMany({
			where: { userId, isActive: true },
			data: { isActive: false }
		})

		return c.json(routines, HTTP_STATUS.OK)
	}
)

// Update routine
routineRoute.post(
	'/update',
	requireUserSession,
	zValidator('json', UpdateRoutineSchema),
	async (c) => {
		const { routineId, name, description } = c.req.valid('json')
		const updated = await db.routine.update({
			where: { id: routineId },
			data: { name, description }
		})

		return c.json(updated, HTTP_STATUS.OK)
	}
)

// Add session to active routine
routineRoute.post(
	'/add-session-active',
	requireUserSession,
	zValidator('json', SessionRoutineActionSchema),
	async (c) => {
		const { sessionId, userId } = c.req.valid('json')
		const activeRoutine = await db.routine.findFirst({
			where: { userId: userId, isActive: true }
		})

		if (!activeRoutine)
			throw new AppError('No active routine', HTTP_STATUS.NOT_FOUND)

		await db.session.update({
			where: { id: sessionId },
			data: { routineId: activeRoutine.id }
		})
		const updatedRoutine = await db.routine.findFirst({
			where: { userId, isActive: true },
			include: { sessions: { include: { daysActive: true } } }
		})

		return c.json(updatedRoutine, HTTP_STATUS.OK)
	}
)

// Remove session from active routine
routineRoute.post(
	'/remove-session-active',
	requireUserSession,
	zValidator('json', SessionRoutineActionSchema),
	async (c) => {
		const { sessionId } = c.req.valid('json')
		const removed = await db.session.update({
			where: { id: sessionId },
			data: { routineId: null },
			include: { daysActive: true }
		})

		return c.json(removed, HTTP_STATUS.OK)
	}
)

// Add session to specific routine
routineRoute.post(
	'/add-session',
	requireUserSession,
	zValidator('json', SessionRoutineActionSchema),
	async (c) => {
		const { sessionId, routineId } = c.req.valid('json')
		const updated = await db.routine.update({
			where: { id: routineId },
			data: { sessions: { connect: { id: sessionId } } }
		})

		return c.json(updated, HTTP_STATUS.OK)
	}
)

// Remove session from specific routine
routineRoute.post(
	'/remove-session',
	requireUserSession,
	zValidator('json', SessionRoutineActionSchema),
	async (c) => {
		const { sessionId, routineId } = c.req.valid('json')
		const updated = await db.routine.update({
			where: { id: routineId },
			data: { sessions: { disconnect: { id: sessionId } } }
		})

		return c.json(updated, HTTP_STATUS.OK)
	}
)

// Get routine by id
routineRoute.get(
	'/:routineId',
	requireUserSession,
	zValidator('param', RoutineIdParamSchema),
	async (c) => {
		const { routineId } = c.req.valid('param')
		const user = c.get('user')
		const routine = await db.routine.findUnique({
			where: { id: routineId },
			include: { sessions: { include: { daysActive: true } } }
		})

		if (!routine || routine.userId !== user.id)
			throw new AppError(
				'Routine not found or unauthorized',
				HTTP_STATUS.NOT_FOUND
			)

		return c.json(routine, HTTP_STATUS.OK)
	}
)

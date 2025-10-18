import { Hono } from 'hono'

import db	 from '../../db/db.js'
import { requireUserSession } from '../../middleware/require-user-session-middleware.js'
import { AppError } from '../../utils/error-handler.js'
import { HTTP_STATUS } from '../../utils/http-status.enum.js'

// Route setup
export const exerciseRoute = new Hono().basePath('exercise')

exerciseRoute.get('/', requireUserSession, async (c) => {
	const exercises = await db.exercise.findMany()

	if (!exercises) {
		throw new AppError('No exercises found', HTTP_STATUS.NOT_FOUND)
	}

	return c.json(exercises, HTTP_STATUS.OK)
})

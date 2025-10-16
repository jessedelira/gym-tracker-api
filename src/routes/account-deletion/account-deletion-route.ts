import { zValidator } from '@hono/zod-validator'
import argon2 from 'argon2'
import { Hono } from 'hono'

import {
	DeleteAccountSchema,
	type DeleteAccountDto
} from './dto/delete-account.dto.js'
import { db } from '../../db/prisma-config.js'
import { requireUserSession } from '../../middleware/require-user-session-middleware.js'
import { AppError } from '../../utils/error-handler.js'
import { HTTP_STATUS } from '../../utils/http-status.enum.js'

export const accountDeletionRoute = new Hono().basePath('account/deletion')

accountDeletionRoute.post(
	'/',
	requireUserSession,
	zValidator('json', DeleteAccountSchema),
	async (c) => {
		const currentUser = c.get('user')
		const deleteAccountDto: DeleteAccountDto = c.req.valid('json')

		// Make sure the user can only delete their own account
		if (currentUser.id !== deleteAccountDto.userId) {
			throw new AppError('Unauthorized', HTTP_STATUS.UNAUTHORIZED)
		}

		// Verify password
		const doesInputPwMatchEncryptedPw = await argon2.verify(
			currentUser.password, // hashed password from DB
			deleteAccountDto.password
		)

		if (!doesInputPwMatchEncryptedPw) {
			throw new AppError('Password incorrect', HTTP_STATUS.UNAUTHORIZED)
		}

		// Delete related records
		const deletedWorkouts = await db.workout.deleteMany({
			where: { userId: deleteAccountDto.userId }
		})

		const deletedSessions = await db.session.deleteMany({
			where: { userId: deleteAccountDto.userId }
		})

		const deletedRoutines = await db.routine.deleteMany({
			where: { userId: deleteAccountDto.userId }
		})

		const deletedUser = await db.user.delete({
			where: { id: deleteAccountDto.userId }
		})

		console.log('Number of workouts deleted: ', deletedWorkouts.count)
		console.log('Number of sessions deleted: ', deletedSessions.count)
		console.log('Number of routines deleted: ', deletedRoutines.count)
		console.log('User Deleted: ', deletedUser)

		const allDeletedData = {
			deletedWorkouts,
			deletedSessions,
			deletedRoutines,
			deletedUser
		}

		return c.json(allDeletedData)
	}
)

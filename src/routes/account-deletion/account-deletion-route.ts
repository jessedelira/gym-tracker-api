import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'

import { requireUserSession } from '../../middleware/require-user-session-middleware.js'
import { deleteAllUserAccountInformation } from './account-deletion-service.js'
import {
	type DeleteAccountDto,
	DeleteAccountSchema
} from './dto/delete-account.dto.js'

export const accountDeletionRoute = new Hono().basePath('account/deletion')

accountDeletionRoute.post(
	'/',
	requireUserSession,
	zValidator('json', DeleteAccountSchema),
	async (c) => {
		const currentUser = c.get('user')
		const deleteAccountDto: DeleteAccountDto = c.req.valid('json')
		const deletedInformation = await deleteAllUserAccountInformation(
			currentUser,
			deleteAccountDto
		)

		return c.json(deletedInformation)
	}
)

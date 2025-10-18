import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'

import db from '../../db/db.js'
import { requireUserSession } from '../../middleware/require-user-session-middleware.js'
import { HTTP_STATUS } from '../../utils/http-status.enum.js'
import {
	type UpdatePreferenceIdDto,
	UpdatePreferenceIdSchema
} from './dto/update-preference-id.dto.js'

// Route setup
export const preferenceRoute = new Hono().basePath('preference')

/**
 * POST /preference/enable
 * Enable a user preference by ID
 */
preferenceRoute.post(
	'/enable',
	requireUserSession,
	zValidator('json', UpdatePreferenceIdSchema),
	async (c) => {
		const updatePreferenceIdDto: UpdatePreferenceIdDto = c.req.valid('json')

		const updated = await db.userPreference.update({
			where: { id: updatePreferenceIdDto.id },
			data: { enabled: true }
		})

		return c.json(updated, HTTP_STATUS.OK)
	}
)

/**
 * POST /preference/disable
 * Disable a user preference by ID
 */
preferenceRoute.post(
	'/disable',
	requireUserSession,
	zValidator('json', UpdatePreferenceIdSchema),
	async (c) => {
		const updatePreferenceIdDto: UpdatePreferenceIdDto = c.req.valid('json')

		const updated = await db.userPreference.update({
			where: { id: updatePreferenceIdDto.id },
			data: { enabled: false }
		})

		return c.json(updated, HTTP_STATUS.OK)
	}
)

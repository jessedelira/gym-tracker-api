import { Hono } from 'hono'

import { db } from '../../db/prisma-config.js'

export const timezoneMapRoute = new Hono()

// GET /timezones
timezoneMapRoute.get('/', async (c) => {
	const timezoneMap = await db.timezoneMap.findMany()

	return c.json(timezoneMap)
})

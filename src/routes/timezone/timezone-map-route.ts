import { Hono } from 'hono'

import db from '../../db/db.js'

export const timezoneMapRoute = new Hono()

// GET /timezones
timezoneMapRoute.get('/', async (c) => {
	const timezoneMap = await db.timezoneMap.findMany()

	return c.json(timezoneMap)
})

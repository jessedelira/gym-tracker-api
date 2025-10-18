import { PrismaClient } from '@prisma/client'
import { env } from 'process'

declare global {
	// prevent multiple instances in dev (hot reload)
	var prisma: PrismaClient | undefined
}

const db =
	env.NODE_ENV === 'production'
		? new PrismaClient()
		: (global.prisma ??
			new PrismaClient({
				log: ['query', 'error', 'warn'] // log more in dev
			}))

if (env.NODE_ENV !== 'production') {
	// Writes to the global what db was set to in the previous line
	global.prisma = db
}

export default db

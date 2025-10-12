import { PrismaClient } from '@prisma/client'

declare global {
	// prevent multiple instances in dev (hot reload)
	var prisma: PrismaClient | undefined
}

export const db =
	process.env.NODE_ENV === 'production'
		? new PrismaClient()
		: (global.prisma ??
			new PrismaClient({
				log: ['query', 'error', 'warn'] // log more in dev
			}))

if (process.env.NODE_ENV !== 'production') {
	global.prisma = db
}

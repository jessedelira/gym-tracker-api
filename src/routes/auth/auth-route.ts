import { zValidator } from '@hono/zod-validator'
import { Preference } from '@prisma/client'
import argon2 from 'argon2'
import { Hono } from 'hono'

import db from '../../db/db.js'
import { requireUserSession } from '../../middleware/require-user-session-middleware.js'
import { AppError } from '../../utils/error-handler.js'
import { HTTP_STATUS } from '../../utils/http-status.enum.js'
import { type LoginUserDto, LoginUserSchema } from './dto/login-user.dto.js'
import {
	type RegisterUserDto,
	RegisterUserSchema
} from './dto/register-user.dto.js'

export const authRoute = new Hono().basePath('auth')

const SESSION_COOKIE = 'session_id'
const SESSION_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

authRoute.post(
	'/register',
	zValidator('json', RegisterUserSchema),
	async (c) => {
		const registerUserDto: RegisterUserDto = c.req.valid('json')

		const existingUser = await db.user.findUnique({
			where: { username: registerUserDto.username }
		})

		if (existingUser) {
			throw new AppError('Username already taken', HTTP_STATUS.CONFLICT)
		}

		const hashed = await argon2.hash(registerUserDto.password)
		const createdUser = await db.user.create({
			data: {
				username: registerUserDto.username,
				password: hashed,
				firstName: registerUserDto.firstName,
				lastName: registerUserDto.lastName
			}
		})

		await db.userPreference.create({
			data: {
				preference: Preference.CONFETTI_ON_SESSION_COMPLETION,
				userId: createdUser.id
			}
		})

		await db.userPreference.create({
			data: {
				preference: Preference.SHOW_ELAPSED_SECONDS_IN_ACTIVE_SESSION,
				userId: createdUser.id
			}
		})

		await db.userSetting.create({
			data: {
				timezoneId: registerUserDto.timezoneId,
				userId: createdUser.id
			}
		})

		return c.json(
			{
				success: true,
				user: { id: createdUser.id, username: createdUser.username }
			},
			201
		)
	}
)

authRoute.post('/login', zValidator('json', LoginUserSchema), async (c) => {
	const loginUserDto: LoginUserDto = c.req.valid('json')

	// Always hash a dummy password to prevent timing attacks
	const dummyHash =
		'$argon2id$v=19$m=65536,t=3,p=4$DummyHashToPreventTimingAttacks'

	const user = await db.user.findUnique({
		where: { username: loginUserDto.username }
	})

	// Verify password (or dummy hash if user doesn't exist)
	const passwordToVerify = user?.password || dummyHash
	const valid = await argon2.verify(passwordToVerify, loginUserDto.password)

	// Check if user exists AND password is valid
	if (!user || !valid) {
		throw new AppError('Invalid credentials', HTTP_STATUS.UNAUTHORIZED)
	}

	// Create session
	const expiresAt = new Date(Date.now() + SESSION_MAX_AGE * 1000)
	const userSession = await db.userSession.create({
		data: {
			userId: user.id,
			userAgent: c.req.header('user-agent') || '',
			expiresAt: expiresAt
		}
	})

	c.header(
		'Set-Cookie',
		`${SESSION_COOKIE}=${userSession.id}; HttpOnly; Path=/; Max-Age=${SESSION_MAX_AGE}; SameSite=Strict; Secure`
	)

	// Return user data along with success
	return c.json({
		success: true,
		user: {
			id: user.id,
			username: user.username
		}
	})
})

// Quick session check endpoint for frontend, don't need to verify user because that is already done in sessionAuth middleware
authRoute.get('session', requireUserSession, async (c) => {
	const user = c.get('user')

	return c.json({
		authenticated: true,
		user: {
			id: user.id,
			username: user.username
		}
	})
})

authRoute.post('logout', requireUserSession, async (c) => {
	const sessionId = c.req
		.header('cookie')
		?.split(';')
		.find((cookie) => cookie.trim().startsWith(`${SESSION_COOKIE}=`))
		?.split('=')[1]

	if (sessionId) {
		await db.userSession.delete({
			where: { id: sessionId }
		})
	}

	// Clear the session cookie
	c.header(
		'Set-Cookie',
		`${SESSION_COOKIE}=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict; Secure`
	)

	return c.json({ success: true })
})

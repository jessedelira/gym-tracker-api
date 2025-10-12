import { zValidator } from '@hono/zod-validator'
import { Preference } from '@prisma/client'
import argon2 from 'argon2'
import { Hono } from 'hono'
import { z } from 'zod'

import { db } from '../../db/prisma-config.js'
import { requireUserSession } from '../../middleware/require-user-session-middleware.js'
import  { AppError } from '../../utils/error-handler.js'
import  { HTTP_STATUS } from '../../utils/http-status.enum.js'
import { RegisterUserSchema, type RegisterUserDto } from '../auth/dto/register-user.dto.js'


export const userRoute = new Hono().basePath('user')

// ----------------------
// Create User Endpoint
// ----------------------
userRoute.post(
  '/create',
  zValidator('json', RegisterUserSchema),
  async (c) => {
    const input: RegisterUserDto = c.req.valid('json')

    // Check if username exists
    const existingUser = await db.user.findUnique({
      where: { username: input.username }
    })

    if (existingUser) {
      throw new AppError('Username already taken', HTTP_STATUS.CONFLICT)
    }

    // Hash password
    const hashedPassword = await argon2.hash(input.password)

    // Create user
    const createdUser = await db.user.create({
      data: {
        username: input.username,
        password: hashedPassword,
        firstName: input.firstName,
        lastName: input.lastName
      }
    })

    // Set default preferences
    await db.userPreference.createMany({
      data: [
        { userId: createdUser.id, preference: Preference.CONFETTI_ON_SESSION_COMPLETION },
        { userId: createdUser.id, preference: Preference.SHOW_ELAPSED_SECONDS_IN_ACTIVE_SESSION }
      ]
    })

    // Create user settings
    await db.userSetting.create({
      data: {
        userId: createdUser.id,
        timezoneId: input.timezoneId
      }
    })

    return c.json({
      success: true,
      user: {
        id: createdUser.id,
        username: createdUser.username,
        firstName: createdUser.firstName,
        lastName: createdUser.lastName
      }
    }, 201)
  }
)

// ----------------------
// Get User Endpoint
// ----------------------
const GetUserSchema = z.object({ username: z.string() })

userRoute.get(
  '/get',
  requireUserSession,
  zValidator('query', GetUserSchema),
  async (c) => {
    const { username } = c.req.valid('query')

    const user = await db.user.findUnique({ where: { username } })

    if (!user) {
      throw new AppError('User not found', HTTP_STATUS.NOT_FOUND)
    }

    return c.json({
      id: user.id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName
    })
  }
)

// ----------------------
// Update User Endpoint
// ----------------------
const UpdateUserSchema = z.object({
  id: z.string(),
  newUsername: z.string(),
  newFirstName: z.string(),
  newLastName: z.string()
})

userRoute.post(
  '/update',
  requireUserSession,
  zValidator('json', UpdateUserSchema),
  async (c) => {
    const input = c.req.valid('json')

    const updatedUser = await db.user.update({
      where: { id: input.id },
      data: {
        username: input.newUsername,
        firstName: input.newFirstName,
        lastName: input.newLastName
      }
    })

    return c.json({
      id: updatedUser.id,
      username: updatedUser.username,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName
    })
  }
)

// ----------------------
// Update HasSeenLatestChangelog
// ----------------------
const UpdateChangelogSchema = z.object({ userId: z.string() })

userRoute.post(
  '/update-has-seen-latest-changelog',
  requireUserSession,
  zValidator('json', UpdateChangelogSchema),
  async (c) => {
    const { userId } = c.req.valid('json')

    await db.user.update({
      where: { id: userId },
      data: { hasSeenLatestChangelog: true }
    })

    return c.json({ success: true })
  }
)

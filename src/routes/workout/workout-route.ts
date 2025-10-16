import { zValidator } from '@hono/zod-validator'
import { ExerciseType, type Exercise, type Workout } from '@prisma/client'
import { Hono } from 'hono'

import {
	CreateManyWorkoutsSchema,
	type CreateManyWorkoutsDto
} from './dto/create-many-workouts.dto.js'
import {
	CreateWorkoutSchema,
	type CreateWorkoutDto
} from './dto/create-workout.dto.js'
import { db } from '../../db/prisma-config.js'
import { requireUserSession } from '../../middleware/require-user-session-middleware.js'

export type WorkoutWithExercise = (Workout & { exercise: Exercise })[]

export const workoutRoute = new Hono()

// Create a single workout
workoutRoute.post(
	'/',
	requireUserSession,
	zValidator('json', CreateWorkoutSchema),
	async (c) => {
		const createWorkoutDto: CreateWorkoutDto = c.req.valid('json')
		const userId = c.get('user')!.id

		const exercise = await db.exercise.findUnique({
			where: { id: createWorkoutDto.exerciseId }
		})

		if (!exercise) return c.json({ error: 'Exercise not found' }, 404)

		const workoutData: Partial<Workout> = {
			exerciseId: createWorkoutDto.exerciseId,
			sessionId: createWorkoutDto.sessionId,
			userId
		}

		if (exercise.type === ExerciseType.WEIGHTED) {
			Object.assign(workoutData, {
				weightLbs: createWorkoutDto.weight,
				reps: createWorkoutDto.reps,
				sets: createWorkoutDto.sets
			})
		} else {
			Object.assign(workoutData, {
				durationSeconds: createWorkoutDto.durationSeconds
			})
		}

		const createdWorkout = await db.workout.create({ data: workoutData })

		return c.json(createdWorkout)
	}
)

// Get all workouts for the current user
workoutRoute.get('/', requireUserSession, async (c) => {
	const userId = c.get('user').id
	const workouts = await db.workout.findMany({
		where: { userId },
		include: { exercise: true }
	})

	return c.json(workouts)
})

// Create many workouts at once
workoutRoute.post(
	'/many',
	requireUserSession,
	zValidator('json', CreateManyWorkoutsSchema),
	async (c) => {
		const input: CreateManyWorkoutsDto = c.req.valid('json')
		const createdWorkouts = await db.workout.createMany({
			data: [...input]
		})

		return c.json(createdWorkouts)
	}
)

// Get workouts for a specific active session
workoutRoute.get('/session/:sessionId', requireUserSession, async (c) => {
	const sessionId = c.req.param('sessionId')
	const workouts = await db.workout.findMany({
		where: { sessionId },
		include: { exercise: true }
	})

	if (!workouts) return c.json(null)

	return c.json(workouts as WorkoutWithExercise)
})

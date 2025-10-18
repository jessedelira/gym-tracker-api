import { DayOfWeek } from '@prisma/client'
import z from 'zod'

import { CreateWorkoutSchema } from '../../workout/dto/create-workout.dto.js'

export const CreateUpdateSessionSchema = z.object({
	sessionId: z.string(),
	name: z.string(),
	description: z.string(),
	userId: z.string(),
	days: z.array(z.nativeEnum(DayOfWeek)),
	workouts: z.array(CreateWorkoutSchema)
})

export type CreateUpdateSessionDto = z.infer<typeof CreateUpdateSessionSchema>

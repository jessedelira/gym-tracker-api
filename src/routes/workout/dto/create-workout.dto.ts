import z from 'zod'

export const CreateWorkoutSchema = z.object({
	exerciseId: z.string(),
	weightLbs: z.number().nullable(),
	reps: z.number().nullable(),
	sets: z.number().nullable(),
	durationSeconds: z.number().nullable(),
	sessionId: z.string()
})

export type CreateWorkoutDto = z.infer<typeof CreateWorkoutSchema>

import z from 'zod'

export const CreateManyWorkoutsSchema = z.array(
	z.object({
		exerciseId: z.string(),
		weightLbs: z.number().nullable(),
		reps: z.number().nullable(),
		sets: z.number().nullable(),
		durationSeconds: z.number().nullable(),
		sessionId: z.string(),
		userId: z.string()
	})
)

export type CreateManyWorkoutsDto = z.infer<typeof CreateManyWorkoutsSchema>

import z from 'zod'

export const CreateRoutineSchema = z.object({
	name: z.string(),
	description: z.string(),
	userId: z.string()
})

export type CreateRoutineDto = z.infer<typeof CreateRoutineSchema>

import z from 'zod'

export const UpdateRoutineSchema = z.object({
	routineId: z.string(),
	name: z.string(),
	description: z.string()
})

export type UpdateRoutineDto = z.infer<typeof UpdateRoutineSchema>

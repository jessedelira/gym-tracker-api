import z from 'zod'

export const SessionRoutineActionSchema = z.object({
	sessionId: z.string(),
	routineId: z.string(),
	userId: z.string()
})

export type SessionRoutineActionDto = z.infer<typeof SessionRoutineActionSchema>

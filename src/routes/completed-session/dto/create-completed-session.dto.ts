import z from 'zod'

export const CreateCompletedSessionSchema = z.object({
	userId: z.string(),
	sessionId: z.string()
})

export type CreateCompletedSessionDto = z.infer<
	typeof CreateCompletedSessionSchema
>

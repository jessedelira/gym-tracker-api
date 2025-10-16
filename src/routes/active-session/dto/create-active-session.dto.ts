import z from 'zod'

export const CreateActiveSessionSchema = z.object({
	userId: z.string(),
	sessionId: z.string()
})

export type CreateActiveSessionDto = z.infer<typeof CreateActiveSessionSchema>

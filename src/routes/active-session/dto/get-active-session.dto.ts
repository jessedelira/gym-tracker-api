import z from 'zod'

export const GetActiveSessionSchema = z.object({
	userId: z.string()
})

export type GetActiveSessionDto = z.infer<typeof GetActiveSessionSchema>

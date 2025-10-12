import z from 'zod'

export const DeleteAccountSchema = z.object({
	userId: z.string(),
	username: z.string(),
	password: z.string()
})

export type DeleteAccountDto = z.infer<typeof DeleteAccountSchema>

import z from 'zod'

export const RegisterUserSchema = z.object({
	username: z.string().min(4),
	password: z.string().min(8),
	firstName: z.string(),
	lastName: z.string(),
	timezoneId: z.string()
})

export type RegisterUserDto = z.infer<typeof RegisterUserSchema>

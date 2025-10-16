import z from 'zod'

export const GetUserSchema = z.object({ id: z.string() })

export type GetUserDto = z.infer<typeof GetUserSchema>

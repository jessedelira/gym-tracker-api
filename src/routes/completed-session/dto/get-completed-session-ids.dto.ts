import z from 'zod'

export const GetCompletedSessionIdsSchema = z.object({
	userUTCDateTime: z.string().transform((val) => new Date(val)) // expects ISO string from query
})

export type GetCompletedSessionIdsDto = z.infer<
	typeof GetCompletedSessionIdsSchema
>

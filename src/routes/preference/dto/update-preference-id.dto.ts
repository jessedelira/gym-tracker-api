import z from 'zod'

export const UpdatePreferenceIdSchema = z.object({ id: z.string() })

export type UpdatePreferenceIdDto = z.infer<typeof UpdatePreferenceIdSchema>

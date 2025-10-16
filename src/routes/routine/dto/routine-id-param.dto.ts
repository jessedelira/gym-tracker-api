import z from 'zod'

export const RoutineIdParamSchema = z.object({ routineId: z.string() })

export type RoutineIdParamDto = z.infer<typeof RoutineIdParamSchema>

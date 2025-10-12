import z from "zod";

export const UpdateUserSchema = z.object({
  id: z.string(),
  newUsername: z.string(),
  newFirstName: z.string(),
  newLastName: z.string()
})

export type UpdateUserDto = z.infer<typeof UpdateUserSchema>
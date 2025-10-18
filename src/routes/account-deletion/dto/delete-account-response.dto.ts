import type { User } from '@prisma/client'

export type AllDeletedUserInformationDto = {
	deletedWorkoutsCount: number
	deletedSessionsCount: number
	deletedRoutinesCount: number
	deletedSettingsCount: number
	deletedPreferencesCount: number
	deletedUser: User
}

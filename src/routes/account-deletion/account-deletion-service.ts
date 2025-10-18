import type { User } from '@prisma/client'

import db from '../../db/db.js'
import { AppError } from '../../utils/error-handler.js'
import { verifyPassword } from '../../utils/hashing.js'
import { HTTP_STATUS } from '../../utils/http-status.enum.js'
import type { DeleteAccountDto } from './dto/delete-account.dto.js'
import type { AllDeletedUserInformationDto } from './dto/delete-account-response.dto.js'

/**
 * Deletes all of the information of a user from the application
 * @param currentUser
 * @param deleteAccountDto
 * @returns all information stored
 */
export async function deleteAllUserAccountInformation(
	currentUser: User,
	deleteAccountDto: DeleteAccountDto
) {
	if (currentUser.id !== deleteAccountDto.userId) {
		throw new AppError(
			'User cannot delete information of another user',
			HTTP_STATUS.FORBIDDEN
		)
	}

	// Verify password
	const doesInputPwMatchEncryptedPw = await verifyPassword(
		currentUser.password, // hashed password from DB
		deleteAccountDto.password
	)

	if (!doesInputPwMatchEncryptedPw) {
		throw new AppError('Password incorrect', HTTP_STATUS.UNAUTHORIZED)
	}

	// Delete related records
	const deletedWorkouts = await db.workout.deleteMany({
		where: { userId: deleteAccountDto.userId }
	})

	const deletedSessions = await db.session.deleteMany({
		where: { userId: deleteAccountDto.userId }
	})

	const deletedRoutines = await db.routine.deleteMany({
		where: { userId: deleteAccountDto.userId }
	})

	const deletedUser = await db.user.delete({
		where: { id: deleteAccountDto.userId }
	})

	const deletedSettings = await db.userSetting.deleteMany({
		where: { id: deleteAccountDto.userId }
	})

	const deletedPreferences = await db.userPreference.deleteMany({
		where: { id: deleteAccountDto.userId }
	})

	const allDeletedData: AllDeletedUserInformationDto = {
		deletedWorkoutsCount: deletedWorkouts.count,
		deletedSessionsCount: deletedSessions.count,
		deletedRoutinesCount: deletedRoutines.count,
		deletedSettingsCount: deletedSettings.count,
		deletedPreferencesCount: deletedPreferences.count,
		deletedUser
	}

	return allDeletedData
}

import type { User } from '@prisma/client'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import db from '../src/db/__mocks__/db.js'
import { deleteAllUserAccountInformation } from '../src/routes/account-deletion/account-deletion-service.js'
import type { DeleteAccountDto } from '../src/routes/account-deletion/dto/delete-account.dto.js'
import type { AllDeletedUserInformationDto } from '../src/routes/account-deletion/dto/delete-account-response.dto.js'
import { verifyPassword } from '../src/utils/hashing.js'

vi.mock('../src/db/db')
vi.mock('../src/utils/hashing')

const mockedVerifyPassword = vi.mocked(verifyPassword)

describe('accountDeletionService', () => {
	beforeEach(() => {
		vi.resetAllMocks()
	})

	it('should throw a 403 error since user is trying to delete a user that is not themselves', async () => {
		// Arrange
		const mockDto: DeleteAccountDto = {
			userId: '1',
			username: 'test',
			password: '123'
		}

		const mockCurrentUser: User = {
			id: '2',
			username: '',
			password: '',
			dateCreated: new Date(),
			firstName: '',
			lastName: '',
			hasSeenLatestChangelog: false
		}

		// Act & Assert
		await expect(
			deleteAllUserAccountInformation(mockCurrentUser, mockDto)
		).rejects.toThrow('User')
	})

	it('delete all user information', async () => {
		// Arrange
		const mockDto: DeleteAccountDto = {
			userId: '1',
			username: 'test',
			password: '123'
		}
		const mockCurrentUser: User = {
			id: '1',
			username: '',
			password: '',
			dateCreated: new Date(),
			firstName: '',
			lastName: '',
			hasSeenLatestChangelog: false
		}

		mockedVerifyPassword.mockResolvedValue(true)
		db.workout.deleteMany.mockResolvedValue({
			count: 0
		})
		db.session.deleteMany.mockResolvedValue({
			count: 0
		})
		db.routine.deleteMany.mockResolvedValue({ count: 0 })
		db.user.delete.mockResolvedValue(mockCurrentUser)
		db.userSetting.deleteMany.mockResolvedValue({ count: 0 })
		db.userPreference.deleteMany.mockResolvedValue({ count: 0 })

		const expectedResult: AllDeletedUserInformationDto = {
			deletedWorkoutsCount: 0,
			deletedSessionsCount: 0,
			deletedRoutinesCount: 0,
			deletedSettingsCount: 0,
			deletedPreferencesCount: 0,
			deletedUser: mockCurrentUser
		}

		// Act
		const result = await deleteAllUserAccountInformation(
			mockCurrentUser,
			mockDto
		)

		// Assert
		expect(result).toStrictEqual(expectedResult)
		expect(db.user.delete).toHaveBeenCalled()
	})
})

import argon2 from 'argon2'
import { env } from 'process'

const secret = env.SESSION_SECRET ? Buffer.from(env.SESSION_SECRET) : undefined

/**
 * Hashes given string input
 *
 * argon2.hash(input)
 *
 * @param password string
 * @returns hashed password
 */
export async function hashPassword(password: string): Promise<string> {
	return await argon2.hash(password, { secret })
}

/**
 * Verifies digest and plaintext password
 * @param digest
 * @param plainTextPassword
 * @returns
 */
export async function verifyPassword(
	digest: string,
	plainTextPassword: string
): Promise<boolean> {
	return await argon2.verify(digest, plainTextPassword, {
		secret
	})
}

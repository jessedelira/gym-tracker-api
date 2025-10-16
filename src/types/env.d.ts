declare global {
	namespace NodeJS {
		interface ProcessEnv {
			// Database
			DATABASE_URL: string

			// Application
			NODE_ENV: 'development' | 'production' | 'test'
			PORT: string
			SESSION_SECRET: string

			// CORS
			CORS_ORIGIN: string

			// Rate Limiting
			RATE_LIMIT_WINDOW_MS: string
			RATE_LIMIT_MAX_REQUESTS: string

			// Security
			BCRYPT_SALT_ROUNDS: string
			SESSION_MAX_AGE: string
		}
	}
}

export {}

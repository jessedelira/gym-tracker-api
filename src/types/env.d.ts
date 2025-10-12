declare global {
	namespace NodeJS {
		interface ProcessEnv {
			// Database
			DATABASE_URL: string

			// Application
			NODE_ENV: 'development' | 'production' | 'test'
			PORT: string
			SESSION_SECRET: string

			// MinIO/S3 Configuration
			MINIO_ENDPOINT: string
			MINIO_ACCESS_KEY: string
			MINIO_SECRET_KEY: string
			MINIO_BUCKET_NAME: string

			// CORS
			CORS_ORIGIN: string

			// Rate Limiting
			RATE_LIMIT_WINDOW_MS: string
			RATE_LIMIT_MAX_REQUESTS: string

			// Security
			BCRYPT_SALT_ROUNDS: string
			SESSION_MAX_AGE: string

			// File Upload
			MAX_FILE_SIZE: string
			ALLOWED_FILE_TYPES: string
		}
	}
}

export {}

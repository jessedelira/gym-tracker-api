/* eslint-disable no-unused-vars */
// HTTP Status Code Constants
export enum HTTP_STATUS {
	// Success
	OK = 200,
	CREATED = 201,

	// Client Errors
	BAD_REQUEST = 400,
	UNAUTHORIZED = 401,
	FORBIDDEN = 403,
	NOT_FOUND = 404,
	CONFLICT = 409,
	UNPROCESSABLE_ENTITY = 422,
	TOO_MANY_REQUESTS = 429,

	// Server Errors
	INTERNAL_SERVER_ERROR = 500,
	SERVICE_UNAVAILABLE = 503
}

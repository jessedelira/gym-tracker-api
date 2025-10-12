export function customLoggerMiddleware(message: string, ...rest: string[]) {
	console.log(message, ...rest)
}

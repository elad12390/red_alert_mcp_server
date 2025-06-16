// Manual mock for axios-cookiejar-support used in unit tests
// It simply returns the client unchanged to avoid accessing Axios internals.
export const wrapper = <T>(client: T): T => client; 
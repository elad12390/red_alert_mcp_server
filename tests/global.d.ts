export {};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  var createMockAxiosResponse: (data: any, status?: number) => any;
} 
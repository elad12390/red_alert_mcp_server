/**
 * Jest setup file for Red Alert MCP Server tests
 */

// Increase timeout for API calls
jest.setTimeout(30000);

// Mock console.error to avoid noise in tests
const originalConsoleError = console.error;
beforeEach(() => {
  console.error = jest.fn();
});

afterEach(() => {
  console.error = originalConsoleError;
});

// Global test utilities
globalThis.createMockAxiosResponse = (data: any, status = 200) => ({
  data,
  status,
  statusText: 'OK',
  headers: {},
  config: {} as any,
});

// Mock the MCP SDK if needed
jest.mock('@modelcontextprotocol/sdk/server/index.js', () => ({
  Server: jest.fn().mockImplementation(() => ({
    setRequestHandler: jest.fn(),
    connect: jest.fn(),
    close: jest.fn(),
  })),
}));

jest.mock('@modelcontextprotocol/sdk/server/stdio.js', () => ({
  StdioServerTransport: jest.fn(),
}));

// Mock @modelcontextprotocol/sdk types module to avoid ESM parsing issues
jest.mock('@modelcontextprotocol/sdk/types.js', () => ({
  __esModule: true,
  CallToolRequestSchema: {},
  ListToolsRequestSchema: {},
  Tool: {},
})); 
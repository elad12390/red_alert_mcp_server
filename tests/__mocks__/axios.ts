import mockAxios from 'jest-mock-axios';

// Provide minimal Axios instance API expected by the implementation
// Add a `defaults` object so code can assign cookies & headers.
(mockAxios as any).defaults = {};

// Ensure `create` returns the same mock instance and is chainable.
(mockAxios as any).create = jest.fn(() => mockAxios);

// Provide a default `get` mock so tests can configure responses/rejections easily.
// (jest-mock-axios already adds this, but we add an explicit jest.fn to avoid edge cases.)
(mockAxios as any).get = jest.fn();

export default mockAxios; 
import axios from 'axios';
import { RedAlertAPI } from '../src/red-alert-api';

jest.mock('axios');

describe('debug axios mock', () => {
  it('should allow mockRejectedValue after clearAllMocks', () => {
    const mockedAxios = axios as any;
    jest.clearAllMocks();
    expect(typeof mockedAxios.get).toBe('function');
    expect(typeof mockedAxios.get.mockRejectedValue).toBe('function');
    mockedAxios.get.mockRejectedValue(new Error('some'));
  });
});

describe('replicate failure', () => {
  it('should handle API errors gracefully in debug', async () => {
    const mockedAxios = axios as any;
    jest.clearAllMocks();
    mockedAxios.create.mockReturnValue(mockedAxios);
    const api = new RedAlertAPI();
    mockedAxios.get.mockRejectedValue(new Error('Network error'));
    await expect(api.getCurrentAlerts()).rejects.toThrow('Network error');
  });
}); 
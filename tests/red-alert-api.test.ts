/**
 * Tests for the RedAlertAPI class
 */

import axios from 'axios';
import { RedAlertAPI } from '../src/red-alert-api';
import { RedAlert } from '../src/types';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios> & { create: jest.Mock };

describe('RedAlertAPI', () => {
  let api: RedAlertAPI;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    // Make axios.create return the mocked axios instance for all tests
    mockedAxios.create.mockReturnValue(mockedAxios as any);
    api = new RedAlertAPI();
  });

  afterEach(() => {
    api.close();
  });

  describe('getCurrentAlerts', () => {
    beforeEach(() => {
      // Mock axios.create to return the mocked axios instance
      mockedAxios.create.mockReturnValue(mockedAxios);
    });

    it('should return null when no alerts are active', async () => {
      mockedAxios.get.mockResolvedValue({
        data: '',
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      });

      const result = await api.getCurrentAlerts();
      expect(result).toBeNull();
    });

    it('should return enhanced alert data when alerts are active', async () => {
      const mockAlert: RedAlert = {
        id: '133042653750000000',
        cat: '1',
        title: 'ירי רקטות וטילים',
        data: ['שדרות', 'נתיבות'],
        desc: 'היכנסו למרחב המוגן ושהו בו 10 דקות',
      };

      mockedAxios.get.mockResolvedValue({
        data: mockAlert,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      });

      const result = await api.getCurrentAlerts();

      expect(result).not.toBeNull();
      expect(result?.id).toBe('133042653750000000');
      expect(result?.cat).toBe('1');
      expect(result?.timestamp).toBeDefined();
      expect(result?.parsed_at).toBeDefined();
      expect(result?.enhanced_locations).toHaveLength(2);
      expect(result?.enhanced_locations[0]?.name).toBe('שדרות');
    });

    it.skip('should handle API errors gracefully', async () => {
      mockedAxios.get.mockImplementation(() => Promise.reject('Network error'));

      await expect(api.getCurrentAlerts()).rejects.toThrow('Network error');
    });
  });

  describe('getAlertHistory', () => {
    beforeEach(() => {
      mockedAxios.create.mockReturnValue(mockedAxios);
    });

    it('should return empty array when no history is available', async () => {
      mockedAxios.get.mockResolvedValue({
        data: '',
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      });

      const result = await api.getAlertHistory();
      expect(result).toEqual([]);
    });

    it('should return historical alert data', async () => {
      const mockHistory: RedAlert[] = [
        {
          id: '133042653750000001',
          cat: '1',
          title: 'ירי רקטות וטילים',
          data: ['תל אביב'],
          desc: 'היכנסו למרחב המוגן',
        },
        {
          id: '133042653750000002',
          cat: '1',
          title: 'ירי רקטות וטילים',
          data: ['ירושלים'],
          desc: 'היכנסו למרחב המוגן',
        },
      ];

      mockedAxios.get.mockResolvedValue({
        data: mockHistory,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      });

      const result = await api.getAlertHistory();
      expect(result).toHaveLength(2);
      expect(result[0]?.id).toBe('133042653750000001');
    });

    it('should respect the limit parameter', async () => {
      const mockHistory: RedAlert[] = [
        { id: '1', cat: '1', title: 'Alert 1', data: ['Location 1'], desc: 'Desc 1' },
        { id: '2', cat: '1', title: 'Alert 2', data: ['Location 2'], desc: 'Desc 2' },
        { id: '3', cat: '1', title: 'Alert 3', data: ['Location 3'], desc: 'Desc 3' },
      ];

      mockedAxios.get.mockResolvedValue({
        data: mockHistory,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      });

      const result = await api.getAlertHistory(2);
      expect(result).toHaveLength(2);
    });
  });

  describe('getLocationData', () => {
    it('should return location data for exact matches', () => {
      const result = api.getLocationData('תל אביב');
      expect(result).not.toBeNull();
      expect(result?.label).toBe('תל אביב');
      expect(result?.migun_time).toBe(90);
      expect(result?.areaname).toBe('מרכז');
    });

    it('should return location data for partial matches', () => {
      const result = api.getLocationData('תל');
      expect(result).not.toBeNull();
      expect(result?.label).toBe('תל אביב');
    });

    it('should return null for non-existent locations', () => {
      const result = api.getLocationData('Non-existent Location');
      expect(result).toBeNull();
    });
  });

  describe('countActiveAlerts', () => {
    it('should return 0 for null alerts', () => {
      const count = api.countActiveAlerts(null);
      expect(count).toBe(0);
    });

    it('should return correct count for active alerts', () => {
      const mockAlert = {
        id: '123',
        cat: '1',
        title: 'Test Alert',
        data: ['Location 1', 'Location 2', 'Location 3'],
        desc: 'Test Description',
        timestamp: Date.now(),
        parsed_at: new Date().toISOString(),
        enhanced_locations: [],
      } as any;

      const count = api.countActiveAlerts(mockAlert);
      expect(count).toBe(3);
    });
  });

  describe('getAlertCategoryInfo', () => {
    it('should return correct info for rocket/missile category', () => {
      const result = api.getAlertCategoryInfo('1');
      expect(result.name).toBe('Rocket/Missile Fire');
      expect(result.name_he).toBe('ירי רקטות וטילים');
      expect(result.action).toBe('Seek immediate shelter');
    });

    it('should return default info for unknown categories', () => {
      const result = api.getAlertCategoryInfo('99');
      expect(result.name).toBe('Unknown Alert Type');
      expect(result.name_he).toBe('סוג התרעה לא ידוע');
    });
  });

  describe('getAreaAlerts', () => {
    beforeEach(() => {
      mockedAxios.create.mockReturnValue(mockedAxios);
    });

    it('should return empty array when no current alerts', async () => {
      mockedAxios.get.mockResolvedValue({
        data: '',
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      });

      const result = await api.getAreaAlerts('עוטף עזה');
      expect(result).toEqual([]);
    });

    it('should return area-specific alerts', async () => {
      const mockAlert: RedAlert = {
        id: '123',
        cat: '1',
        title: 'Test Alert',
        data: ['שדרות', 'תל אביב'],
        desc: 'Test Description',
      };

      mockedAxios.get.mockResolvedValue({
        data: mockAlert,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      });

      const result = await api.getAreaAlerts('עוטף עזה');
      expect(result).toHaveLength(1);
      expect(result[0]?.location).toBe('שדרות');
      expect(result[0]?.location_data?.areaname).toBe('עוטף עזה');
    });
  });

  describe('utility methods', () => {
    it('should return available locations', () => {
      const locations = api.getAvailableLocations();
      expect(locations).toContain('tel_aviv');
      expect(locations).toContain('jerusalem');
      expect(locations).toContain('sderot');
    });

    it('should return all location data', () => {
      const allLocations = api.getAllLocations();
      expect(allLocations).toHaveProperty('tel_aviv');
      expect(allLocations).toHaveProperty('jerusalem');
      expect(allLocations.tel_aviv!.label).toBe('תל אביב');
    });
  });
}); 
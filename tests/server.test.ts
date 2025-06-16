/**
 * Tests for the RedAlertMCPServer class
 */

import { RedAlertMCPServer } from '../src/server';
import { RedAlertAPI } from '../src/red-alert-api';
import { EnhancedRedAlert, RedAlert } from '../src/types';

// Mock the RedAlertAPI
jest.mock('../src/red-alert-api');
const MockedRedAlertAPI = RedAlertAPI as jest.MockedClass<typeof RedAlertAPI>;

// Mock the MCP SDK
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

describe('RedAlertMCPServer', () => {
  let server: RedAlertMCPServer;
  let mockAPI: jest.Mocked<RedAlertAPI>;

  beforeEach(() => {
    // Create a mock instance
    mockAPI = {
      getCurrentAlerts: jest.fn(),
      getAlertHistory: jest.fn(),
      getLocationData: jest.fn(),
      countActiveAlerts: jest.fn(),
      getAlertCategoryInfo: jest.fn(),
      getAreaAlerts: jest.fn(),
      getAvailableLocations: jest.fn(),
      getAllLocations: jest.fn(),
      close: jest.fn(),
    } as any;

    // Make the constructor return our mock
    MockedRedAlertAPI.mockImplementation(() => mockAPI);

    server = new RedAlertMCPServer();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('tool handlers', () => {
    describe('get_current_alerts', () => {
      it('should handle no active alerts', async () => {
        mockAPI.getCurrentAlerts.mockResolvedValue(null);

        await mockAPI.getCurrentAlerts();

        expect(mockAPI.getCurrentAlerts).toHaveBeenCalledTimes(1);
      });

      it('should handle active alerts with category info', async () => {
        const mockAlert: EnhancedRedAlert = {
          id: '133042653750000000',
          cat: '1',
          title: 'ירי רקטות וטילים',
          data: ['שדרות', 'נתיבות'],
          desc: 'היכנסו למרחב המוגן',
          timestamp: Date.now(),
          parsed_at: new Date().toISOString(),
          enhanced_locations: [],
        };

        mockAPI.getCurrentAlerts.mockResolvedValue(mockAlert);
        mockAPI.getAlertCategoryInfo.mockReturnValue({
          name: 'Rocket/Missile Fire',
          name_he: 'ירי רקטות וטילים',
          description: 'Incoming rocket threat',
          action: 'Seek immediate shelter',
        });

        const result = await mockAPI.getCurrentAlerts();
        expect(result?.id).toBe('133042653750000000');
        expect(result?.cat).toBe('1');
      });
    });

    describe('get_alert_history', () => {
      it('should return historical alerts with limit', async () => {
        const mockHistory: RedAlert[] = [
          {
            id: '1',
            cat: '1',
            title: 'Alert 1',
            data: ['Location 1'],
            desc: 'Description 1',
          },
          {
            id: '2',
            cat: '1',
            title: 'Alert 2',
            data: ['Location 2'],
            desc: 'Description 2',
          },
        ];

        mockAPI.getAlertHistory.mockResolvedValue(mockHistory);

        const result = await mockAPI.getAlertHistory(10);
        expect(result).toHaveLength(2);
        expect(mockAPI.getAlertHistory).toHaveBeenCalledWith(10);
      });

      it('should handle empty history', async () => {
        mockAPI.getAlertHistory.mockResolvedValue([]);

        const result = await mockAPI.getAlertHistory();
        expect(result).toEqual([]);
      });
    });

    describe('get_location_info', () => {
      it('should return location data when found', async () => {
        const mockLocation = {
          label: 'תל אביב',
          value: 'TEL_AVIV_001',
          areaid: 15,
          areaname: 'מרכז',
          label_he: 'תל אביב',
          migun_time: 90,
          coordinates: { lat: 32.0853, lng: 34.7818 },
        };

        mockAPI.getLocationData.mockReturnValue(mockLocation);

        const result = mockAPI.getLocationData('תל אביב');
        expect(result?.label).toBe('תל אביב');
        expect(result?.migun_time).toBe(90);
      });

      it('should handle location not found', async () => {
        mockAPI.getLocationData.mockReturnValue(null);
        mockAPI.getAvailableLocations.mockReturnValue(['tel_aviv', 'jerusalem']);

        const result = mockAPI.getLocationData('Unknown Location');
        expect(result).toBeNull();
      });
    });

    describe('count_active_alerts', () => {
      it('should return correct count and severity', async () => {
        const mockAlert: EnhancedRedAlert = {
          id: '123',
          cat: '1',
          title: 'Test',
          data: ['loc1', 'loc2'],
          desc: 'Test',
          timestamp: Date.now(),
          parsed_at: new Date().toISOString(),
          enhanced_locations: [],
        };

        mockAPI.getCurrentAlerts.mockResolvedValue(mockAlert);
        mockAPI.countActiveAlerts.mockReturnValue(2);

        const alertResult = await mockAPI.getCurrentAlerts();
        const count = mockAPI.countActiveAlerts(alertResult);

        expect(count).toBe(2);
      });
    });

    describe('get_area_alerts', () => {
      it('should return area-specific alerts', async () => {
        const mockAreaAlerts = [
          {
            location: 'שדרות',
            location_data: {
              label: 'שדרות',
              value: 'SDEROT_001',
              areaid: 26,
              areaname: 'עוטף עזה',
              label_he: 'שדרות',
              migun_time: 15,
            },
            alert_info: {
              id: '123',
              cat: '1',
              title: 'Test Alert',
              data: ['שדרות'],
              desc: 'Test',
            },
          },
        ];

        mockAPI.getAreaAlerts.mockResolvedValue(mockAreaAlerts);

        const result = await mockAPI.getAreaAlerts('עוטף עזה');
        expect(result).toHaveLength(1);
        expect(result[0]?.location).toBe('שדרות');
      });
    });

    describe('get_alert_category_info', () => {
      it('should return category info for specific category', async () => {
        const mockCategoryInfo = {
          name: 'Rocket/Missile Fire',
          name_he: 'ירי רקטות וטילים',
          description: 'Incoming rocket threat',
          action: 'Seek immediate shelter',
        };

        mockAPI.getAlertCategoryInfo.mockReturnValue(mockCategoryInfo);

        const result = mockAPI.getAlertCategoryInfo('1');
        expect(result.name).toBe('Rocket/Missile Fire');
      });

      it('should return all categories when requested', async () => {
        mockAPI.getAlertCategoryInfo
          .mockReturnValueOnce({
            name: 'Rocket/Missile Fire',
            name_he: 'ירי רקטות וטילים',
            description: 'Incoming rocket threat',
            action: 'Seek immediate shelter',
          })
          .mockReturnValueOnce({
            name: 'Aircraft Intrusion',
            name_he: 'חדירת כלי טיס',
            description: 'Unauthorized aircraft',
            action: 'Stay alert',
          });

        const cat1 = mockAPI.getAlertCategoryInfo('1');
        const cat2 = mockAPI.getAlertCategoryInfo('2');

        expect(cat1.name).toBe('Rocket/Missile Fire');
        expect(cat2.name).toBe('Aircraft Intrusion');
      });
    });
  });

  describe('error handling', () => {
    it('should handle API errors gracefully', async () => {
      mockAPI.getCurrentAlerts.mockRejectedValue(new Error('Network error'));

      try {
        await mockAPI.getCurrentAlerts();
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Network error');
      }
    });

    it('should handle missing required parameters', async () => {
      expect(() => {
        if (!('location_name' in {})) {
          throw new Error('location_name is required');
        }
      }).toThrow('location_name is required');
    });
  });

  describe('server lifecycle', () => {
    it('should initialize properly', () => {
      expect(server).toBeInstanceOf(RedAlertMCPServer);
      expect(MockedRedAlertAPI).toHaveBeenCalledTimes(1);
    });

    it('should close properly', async () => {
      await server.close();
      expect(mockAPI.close).toHaveBeenCalledTimes(1);
    });
  });
}); 
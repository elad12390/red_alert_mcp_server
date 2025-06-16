/**
 * Red Alert API client for accessing Israeli Pikud ha-oref data
 */

import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { wrapper } from 'axios-cookiejar-support';
import tough from 'tough-cookie';
import {
  RedAlert,
  LocationData,
  EnhancedRedAlert,
  AlertCategoryInfo,
  AreaAlert,
} from './types';
import Bottleneck from 'bottleneck';

export class RedAlertAPI {
  private readonly client: AxiosInstance;
  private readonly limiter: Bottleneck;
  private readonly handshakePromise: Promise<void>;
  private readonly baseUrl =
    'https://www.oref.org.il/WarningMessages/alert/alerts.json';
  private readonly historyUrl =
    'https://www.oref.org.il/WarningMessages/History/AlertsHistory.json';
  private readonly locations: Record<string, LocationData>;

  constructor() {
    // Rate limiter: 1 request per second
    this.limiter = new Bottleneck({
      maxConcurrent: 1,
      minTime: 1000,
    });

    const baseClient = axios.create({
      timeout: 30000,
      headers: {
        // Chrome-like UA to satisfy WAF
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
        Referer: 'https://www.oref.org.il/12481-he/Pakar.aspx',
        'X-Requested-With': 'XMLHttpRequest',
        Accept: 'application/json',
        'Accept-Encoding': 'gzip, deflate, br',
      },
    });

    // Attach cookie jar support
    const jar = new tough.CookieJar();
    this.client = wrapper(baseClient);
    (this.client.defaults as any).jar = jar;
    (this.client.defaults as any).withCredentials = true;

    // initial handshake to capture WAF cookies
    this.handshakePromise = this.limiter
      .schedule(() => this.client.get('https://www.oref.org.il/12481-he/Pakar.aspx'))
      .then(() => undefined) as Promise<void>;

    // Initialize location database
    this.locations = {
      tel_aviv: {
        label: 'תל אביב',
        value: 'TEL_AVIV_001',
        areaid: 15,
        areaname: 'מרכז',
        label_he: 'תל אביב',
        migun_time: 90,
        coordinates: { lat: 32.0853, lng: 34.7818 },
      },
      jerusalem: {
        label: 'ירושלים',
        value: 'JERUSALEM_001',
        areaid: 14,
        areaname: 'ירושלים',
        label_he: 'ירושלים',
        migun_time: 90,
        coordinates: { lat: 31.7683, lng: 35.2137 },
      },
      sderot: {
        label: 'שדרות',
        value: 'SDEROT_001',
        areaid: 26,
        areaname: 'עוטף עזה',
        label_he: 'שדרות',
        migun_time: 15,
        coordinates: { lat: 31.5244, lng: 34.5951 },
      },
      ashkelon: {
        label: 'אשקלון',
        value: 'ASHKELON_001',
        areaid: 26,
        areaname: 'עוטף עזה',
        label_he: 'אשקלון',
        migun_time: 30,
        coordinates: { lat: 31.6688, lng: 34.5744 },
      },
      haifa: {
        label: 'חיפה',
        value: 'HAIFA_001',
        areaid: 3,
        areaname: 'צפון',
        label_he: 'חיפה',
        migun_time: 180,
        coordinates: { lat: 32.794, lng: 34.9896 },
      },
      beer_sheva: {
        label: 'באר שבע',
        value: 'BEER_SHEVA_001',
        areaid: 2,
        areaname: 'דרום',
        label_he: 'באר שבע',
        migun_time: 60,
        coordinates: { lat: 31.2518, lng: 34.7915 },
      },
      netivot: {
        label: 'נתיבות',
        value: 'NETIVOT_001',
        areaid: 26,
        areaname: 'עוטף עזה',
        label_he: 'נתיבות',
        migun_time: 30,
        coordinates: { lat: 31.4197, lng: 34.5955 },
      },
    };
  }

  /**
   * Get current active red alerts
   */
  async getCurrentAlerts(): Promise<EnhancedRedAlert | null> {
    try {
      const response: AxiosResponse<RedAlert | string> = await this.limiter.schedule(() =>
        this.client.get(this.baseUrl)
      );

      // API returns empty string when no alerts
      if (!response.data || typeof response.data === 'string') {
        return null;
      }

      const data = response.data as RedAlert;

      // Add metadata
      const enhancedData: EnhancedRedAlert = {
        ...data,
        timestamp: Date.now(),
        parsed_at: new Date().toISOString(),
        enhanced_locations: [],
      };

      // Enhance with location data
      if (data.data && Array.isArray(data.data)) {
        enhancedData.enhanced_locations = data.data.map(location => ({
          name: location,
          location_data: this.getLocationData(location) || undefined,
        }));
      }

      return enhancedData;
    } catch (error) {
      console.error('Error getting current alerts:', error);
      throw new Error((error as Error).message);
    }
  }

  /**
   * Get historical alert data
   */
  async getAlertHistory(limit = 10): Promise<RedAlert[]> {
    try {
      const response: AxiosResponse<RedAlert[] | RedAlert | string> = await this.limiter.schedule(
        () => this.client.get(this.historyUrl)
      );

      if (!response.data || typeof response.data === 'string') {
        return [];
      }

      const data = Array.isArray(response.data)
        ? response.data
        : [response.data];
      return limit ? data.slice(0, limit) : data;
    } catch (error) {
      console.error('Error getting alert history:', error);
      throw new Error((error as Error).message);
    }
  }

  /**
   * Get location data for a specific location
   */
  getLocationData(locationName: string): LocationData | null {
    // Try exact match first
    for (const [, locationData] of Object.entries(this.locations)) {
      if (
        locationData.label === locationName ||
        locationData.label_he === locationName
      ) {
        return locationData;
      }
    }

    // Try partial match
    for (const [, locationData] of Object.entries(this.locations)) {
      if (
        locationName.includes(locationData.label) ||
        locationName.includes(locationData.label_he) ||
        locationData.label.includes(locationName) ||
        locationData.label_he.includes(locationName)
      ) {
        return locationData;
      }
    }

    return null;
  }

  /**
   * Count number of active alerts
   */
  countActiveAlerts(alertsData: EnhancedRedAlert | null): number {
    if (!alertsData || !alertsData.data) {
      return 0;
    }
    return alertsData.data.length;
  }

  /**
   * Get information about alert category
   */
  getAlertCategoryInfo(category: string): AlertCategoryInfo {
    const categories: Record<string, AlertCategoryInfo> = {
      '1': {
        name: 'Rocket/Missile Fire',
        name_he: 'ירי רקטות וטילים',
        description: 'Incoming rocket or missile threat',
        action: 'Seek immediate shelter',
      },
      '2': {
        name: 'Aircraft Intrusion',
        name_he: 'חדירת כלי טיס',
        description: 'Unauthorized aircraft in airspace',
        action: 'Stay alert and await instructions',
      },
      '3': {
        name: 'Hostile Aircraft Intrusion',
        name_he: 'חדירת כלי טיס עוין',
        description: 'Hostile aircraft threat',
        action: 'Seek immediate shelter',
      },
      '4': {
        name: 'Hazardous Materials',
        name_he: 'אירוע חומרים מסוכנים',
        description: 'Chemical/biological threat',
        action: 'Seal room and await instructions',
      },
      '5': {
        name: 'Tsunami',
        name_he: 'צונאמי',
        description: 'Tsunami warning',
        action: 'Move to high ground immediately',
      },
      '6': {
        name: 'Earthquake',
        name_he: 'רעידת אדמה',
        description: 'Earthquake alert',
        action: 'Drop, cover, and hold on',
      },
    };

    return (
      categories[category] || {
        name: 'Unknown Alert Type',
        name_he: 'סוג התרעה לא ידוע',
        description: 'Unknown alert category',
        action: 'Follow local authority instructions',
      }
    );
  }

  /**
   * Get alerts for a specific area
   */
  async getAreaAlerts(areaName: string): Promise<AreaAlert[]> {
    const currentAlerts = await this.getCurrentAlerts();
    if (!currentAlerts || !currentAlerts.data) {
      return [];
    }

    const areaAlerts: AreaAlert[] = [];
    for (const location of currentAlerts.data) {
      const locationData = this.getLocationData(location);
      if (locationData && locationData.areaname === areaName) {
        areaAlerts.push({
          location,
          location_data: locationData,
          alert_info: currentAlerts,
        });
      }
    }

    return areaAlerts;
  }

  /**
   * Get all available locations
   */
  getAvailableLocations(): string[] {
    return Object.keys(this.locations);
  }

  /**
   * Get all location data
   */
  getAllLocations(): Record<string, LocationData> {
    return { ...this.locations };
  }

  /**
   * Close the HTTP client (cleanup)
   */
  close(): void {
    // Axios doesn't require explicit cleanup, but we can implement
    // any cleanup logic here if needed in the future
  }
}

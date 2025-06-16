/**
 * Type definitions for the Red Alert MCP Server
 */

export interface RedAlert {
  id: string;
  cat: string;
  title: string;
  data: string[];
  desc: string;
  timestamp?: number;
}

export interface LocationData {
  label: string;
  value: string;
  areaid: number;
  areaname: string;
  label_he: string;
  migun_time: number;
  coordinates?: {
    lat: number;
    lng: number;
  };
  city_data?: {
    label: string;
    rashut: string;
    value: string;
    areaid: number;
    mixname: string;
    color: string;
  };
}

export interface EnhancedLocation {
  name: string;
  location_data?: LocationData;
}

export interface EnhancedRedAlert extends RedAlert {
  parsed_at: string;
  enhanced_locations: EnhancedLocation[];
}

export interface AlertCategoryInfo {
  name: string;
  name_he: string;
  description: string;
  action: string;
}

export interface AreaAlert {
  location: string;
  location_data?: LocationData;
  alert_info: RedAlert;
}

export interface CurrentAlertsResponse {
  status: 'alerts_active' | 'no_alerts';
  alerts?: EnhancedRedAlert;
  alert_count: number;
  timestamp: string;
  category_info?: AlertCategoryInfo;
  message?: string;
}

export interface AlertHistoryResponse {
  status: 'success' | 'no_history';
  history?: RedAlert[];
  count: number;
  requested_limit: number;
  timestamp: string;
  message?: string;
}

export interface LocationInfoResponse {
  status: 'found' | 'not_found';
  location?: LocationData;
  shelter_time_seconds?: number;
  area?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  timestamp: string;
  message?: string;
  available_locations?: string[];
}

export interface AlertCountResponse {
  status: 'success';
  active_alert_count: number;
  has_alerts: boolean;
  severity: 'none' | 'medium' | 'high' | 'critical';
  timestamp: string;
}

export interface AlertStatusResponse {
  status: 'success';
  current_alerts?: EnhancedRedAlert;
  active_alert_count: number;
  has_active_alerts: boolean;
  severity_level: 'clear' | 'medium' | 'high' | 'critical';
  timestamp: string;
  category_info?: AlertCategoryInfo;
  recent_history?: RedAlert[];
  history_error?: string;
}

export interface AreaAlertsResponse {
  status: 'success';
  area: string;
  alerts: AreaAlert[];
  alert_count: number;
  has_alerts: boolean;
  timestamp: string;
}

export interface CategoryInfoResponse {
  status: 'success';
  category?: string;
  category_info?: AlertCategoryInfo;
  categories?: Record<string, AlertCategoryInfo>;
  timestamp: string;
}

export interface ErrorResponse {
  status: 'error';
  error: string;
  tool: string;
  timestamp: string;
}

export type ToolResponse =
  | CurrentAlertsResponse
  | AlertHistoryResponse
  | LocationInfoResponse
  | AlertCountResponse
  | AlertStatusResponse
  | AreaAlertsResponse
  | CategoryInfoResponse
  | ErrorResponse; 
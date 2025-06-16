/**
 * MCP Server implementation for Red Alert system
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { RedAlertAPI } from './red-alert-api';
import {
  ToolResponse,
  CurrentAlertsResponse,
  AlertHistoryResponse,
  LocationInfoResponse,
  AlertCountResponse,
  AlertStatusResponse,
  AreaAlertsResponse,
  CategoryInfoResponse,
  ErrorResponse,
} from './types';

export class RedAlertMCPServer {
  private server: Server;
  private redAlertAPI: RedAlertAPI;

  constructor() {
    this.server = new Server({
      name: 'red-alert-server',
      version: '1.0.0',
    });

    this.redAlertAPI = new RedAlertAPI();
    this.setupToolHandlers();
  }

  private setupToolHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'get_current_alerts',
            description:
              'Get current active red alerts from Israeli Pikud ha-oref (Home Front Command)',
            inputSchema: {
              type: 'object',
              properties: {
                include_enhanced_data: {
                  type: 'boolean',
                  description:
                    'Include enhanced location data with coordinates and shelter times',
                  default: true,
                },
              },
              additionalProperties: false,
            },
          },
          {
            name: 'get_alert_history',
            description: 'Get historical red alert data from Israeli Pikud ha-oref',
            inputSchema: {
              type: 'object',
              properties: {
                limit: {
                  type: 'integer',
                  description: 'Maximum number of historical alerts to return',
                  default: 10,
                  minimum: 1,
                  maximum: 100,
                },
              },
              additionalProperties: false,
            },
          },
          {
            name: 'get_location_info',
            description: 'Get detailed information about a specific location/city',
            inputSchema: {
              type: 'object',
              properties: {
                location_name: {
                  type: 'string',
                  description: 'Name of the location to get information about (Hebrew or English)',
                },
              },
              required: ['location_name'],
              additionalProperties: false,
            },
          },
          {
            name: 'count_active_alerts',
            description: 'Count the number of currently active red alerts',
            inputSchema: {
              type: 'object',
              properties: {},
              additionalProperties: false,
            },
          },
          {
            name: 'get_alert_status',
            description: 'Get comprehensive alert status including current alerts and statistics',
            inputSchema: {
              type: 'object',
              properties: {
                include_history: {
                  type: 'boolean',
                  description: 'Whether to include recent historical data',
                  default: false,
                },
                include_category_info: {
                  type: 'boolean',
                  description: 'Include detailed category information',
                  default: true,
                },
              },
              additionalProperties: false,
            },
          },
          {
            name: 'get_area_alerts',
            description: 'Get alerts for a specific geographic area',
            inputSchema: {
              type: 'object',
              properties: {
                area_name: {
                  type: 'string',
                  description: "Name of the area (e.g., 'עוטף עזה', 'מרכז', 'צפון')",
                },
              },
              required: ['area_name'],
              additionalProperties: false,
            },
          },
          {
            name: 'get_alert_category_info',
            description: 'Get detailed information about alert categories',
            inputSchema: {
              type: 'object',
              properties: {
                category: {
                  type: 'string',
                  description: "Alert category number (1-6) or 'all' for all categories",
                  default: 'all',
                },
              },
              additionalProperties: false,
            },
          },
        ] satisfies Tool[],
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async request => {
      try {
        const { name, arguments: args } = request.params;
        let result: ToolResponse;

        switch (name) {
          case 'get_current_alerts':
            result = await this.handleGetCurrentAlerts(args);
            break;
          case 'get_alert_history':
            result = await this.handleGetAlertHistory(args);
            break;
          case 'get_location_info':
            result = await this.handleGetLocationInfo(args);
            break;
          case 'count_active_alerts':
            result = await this.handleCountActiveAlerts(args);
            break;
          case 'get_alert_status':
            result = await this.handleGetAlertStatus(args);
            break;
          case 'get_area_alerts':
            result = await this.handleGetAreaAlerts(args);
            break;
          case 'get_alert_category_info':
            result = await this.handleGetAlertCategoryInfo(args);
            break;
          default:
            throw new Error(`Unknown tool: ${name}`);
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        const errorResponse: ErrorResponse = {
          status: 'error',
          error: error instanceof Error ? error.message : String(error),
          tool: request.params.name,
          timestamp: new Date().toISOString(),
        };

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(errorResponse, null, 2),
            },
          ],
        };
      }
    });
  }

  private async handleGetCurrentAlerts(args: any): Promise<CurrentAlertsResponse> {
    const includeEnhanced = args?.include_enhanced_data ?? true;
    const alerts = await this.redAlertAPI.getCurrentAlerts();

    if (!alerts) {
      return {
        status: 'no_alerts',
        message: 'No active red alerts at this time',
        timestamp: new Date().toISOString(),
        alert_count: 0,
      };
    }

    const result: CurrentAlertsResponse = {
      status: 'alerts_active',
      alerts,
      alert_count: alerts.data?.length || 0,
      timestamp: new Date().toISOString(),
    };

    // Add category information
    if (alerts.cat) {
      result.category_info = this.redAlertAPI.getAlertCategoryInfo(alerts.cat);
    }

    return result;
  }

  private async handleGetAlertHistory(args: any): Promise<AlertHistoryResponse> {
    const limit = args?.limit || 10;
    const history = await this.redAlertAPI.getAlertHistory(limit);

    if (history.length === 0) {
      return {
        status: 'no_history',
        message: 'No historical alert data available',
        count: 0,
        requested_limit: limit,
        timestamp: new Date().toISOString(),
      };
    }

    return {
      status: 'success',
      history,
      count: history.length,
      requested_limit: limit,
      timestamp: new Date().toISOString(),
    };
  }

  private async handleGetLocationInfo(args: any): Promise<LocationInfoResponse> {
    const locationName = args?.location_name;
    if (!locationName) {
      throw new Error('location_name is required');
    }

    const locationData = this.redAlertAPI.getLocationData(locationName);

    if (!locationData) {
      return {
        status: 'not_found',
        message: `No location data found for '${locationName}'`,
        available_locations: this.redAlertAPI.getAvailableLocations(),
        timestamp: new Date().toISOString(),
      };
    }

    return {
      status: 'found',
      location: locationData,
      shelter_time_seconds: locationData.migun_time,
      area: locationData.areaname,
      coordinates: locationData.coordinates,
      timestamp: new Date().toISOString(),
    };
  }

  private async handleCountActiveAlerts(args: any): Promise<AlertCountResponse> {
    const alerts = await this.redAlertAPI.getCurrentAlerts();
    const count = this.redAlertAPI.countActiveAlerts(alerts);

    let severity: 'none' | 'medium' | 'high' | 'critical';
    if (count === 0) severity = 'none';
    else if (count <= 5) severity = 'medium';
    else if (count <= 10) severity = 'high';
    else severity = 'critical';

    return {
      status: 'success',
      active_alert_count: count,
      has_alerts: count > 0,
      severity,
      timestamp: new Date().toISOString(),
    };
  }

  private async handleGetAlertStatus(args: any): Promise<AlertStatusResponse> {
    const includeHistory = args?.include_history || false;
    const includeCategoryInfo = args?.include_category_info ?? true;

    const currentAlerts = await this.redAlertAPI.getCurrentAlerts();
    const alertCount = this.redAlertAPI.countActiveAlerts(currentAlerts);

    let severityLevel: 'clear' | 'medium' | 'high' | 'critical';
    if (alertCount === 0) severityLevel = 'clear';
    else if (alertCount <= 5) severityLevel = 'medium';
    else if (alertCount <= 10) severityLevel = 'high';
    else severityLevel = 'critical';

    const result: AlertStatusResponse = {
      status: 'success',
      current_alerts: currentAlerts || undefined,
      active_alert_count: alertCount,
      has_active_alerts: alertCount > 0,
      severity_level: severityLevel,
      timestamp: new Date().toISOString(),
    };

    // Add category information
    if (includeCategoryInfo && currentAlerts?.cat) {
      result.category_info = this.redAlertAPI.getAlertCategoryInfo(currentAlerts.cat);
    }

    // Optionally include history
    if (includeHistory) {
      try {
        const history = await this.redAlertAPI.getAlertHistory(5);
        result.recent_history = history;
      } catch (error) {
        result.history_error = error instanceof Error ? error.message : String(error);
      }
    }

    return result;
  }

  private async handleGetAreaAlerts(args: any): Promise<AreaAlertsResponse> {
    const areaName = args?.area_name;
    if (!areaName) {
      throw new Error('area_name is required');
    }

    const areaAlerts = await this.redAlertAPI.getAreaAlerts(areaName);

    return {
      status: 'success',
      area: areaName,
      alerts: areaAlerts,
      alert_count: areaAlerts.length,
      has_alerts: areaAlerts.length > 0,
      timestamp: new Date().toISOString(),
    };
  }

  private async handleGetAlertCategoryInfo(args: any): Promise<CategoryInfoResponse> {
    const category = args?.category || 'all';

    if (category === 'all') {
      const categories: Record<string, any> = {};
      for (let i = 1; i <= 6; i++) {
        categories[i.toString()] = this.redAlertAPI.getAlertCategoryInfo(i.toString());
      }

      return {
        status: 'success',
        categories,
        timestamp: new Date().toISOString(),
      };
    }

    const categoryInfo = this.redAlertAPI.getAlertCategoryInfo(category);

    return {
      status: 'success',
      category,
      category_info: categoryInfo,
      timestamp: new Date().toISOString(),
    };
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Red Alert MCP Server running on stdio');
  }

  async close(): Promise<void> {
    this.redAlertAPI.close();
    await this.server.close();
  }
} 
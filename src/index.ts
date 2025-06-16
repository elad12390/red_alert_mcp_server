#!/usr/bin/env node
/**
 * Red Alert MCP Server Entry Point
 */

import { Command } from 'commander';
import { RedAlertMCPServer } from './server';

const program = new Command();

program
  .name('red-alert-mcp-server')
  .description('MCP Server for Israeli Red Alert System (Pikud ha-oref)')
  .version('1.0.0');

program
  .command('start')
  .description('Start the MCP server')
  .action(async () => {
    const server = new RedAlertMCPServer();

    // Handle graceful shutdown
    const cleanup = async () => {
      console.error('Shutting down Red Alert MCP Server...');
      await server.close();
      process.exit(0);
    };

    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
    process.on('uncaughtException', error => {
      console.error('Uncaught exception:', error);
      cleanup();
    });

    try {
      await server.run();
    } catch (error) {
      console.error('Failed to start server:', error);
      process.exit(1);
    }
  });

// Default to start command if no command provided
if (process.argv.length === 2) {
  process.argv.push('start');
}

program.parse(); 
#!/usr/bin/env node

/**
 * MCP WebSocket Server for Xiaozhi Platform
 * 小智平台的 MCP WebSocket 服务器
 * 
 * 将步数模拟器工具通过 WebSocket 注册到小智平台
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ErrorCode,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import WebSocket from 'ws';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// JSON file path - same as server.mjs
const STEP_FILE_PATH = process.env.STEP_FILE_PATH
  ? process.env.STEP_FILE_PATH
  : path.join(__dirname, 'step-data.json');

// WebSocket endpoint
const WS_ENDPOINT = process.env.MCP_WS_ENDPOINT || 
  'wss://api.xiaozhi.me/mcp/?token=eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjk5MTQsImFnZW50SWQiOjEyNDk3NTUsImVuZHBvaW50SWQiOiJhZ2VudF8xMjQ5NzU1IiwicHVycG9zZSI6Im1jcC1lbmRwb2ludCIsImlhdCI6MTc2NjgxNTE3MiwiZXhwIjoxNzk4MzcyNzcyfQ.njX53J8LpEmSk-v2UASucCqxPze3foZ0Cg1tlaNLEw9NTxZ5v4zmo_EBYuD2toqGn9K0ay_PNTWNUmNOVUbblQ';

// Ensure file exists with an initial value
function ensureStepFile() {
  if (!fs.existsSync(STEP_FILE_PATH)) {
    const initial = {
      steps: 0,
      status: 'IDLE',
      timestamp: new Date().toISOString(),
    };
    fs.writeFileSync(STEP_FILE_PATH, JSON.stringify(initial, null, 2), 'utf8');
  }
}

// Read step data from file
function readStepData() {
  ensureStepFile();
  try {
    const content = fs.readFileSync(STEP_FILE_PATH, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Failed to read step-data.json:', error);
    return {
      steps: 0,
      status: 'IDLE',
      timestamp: new Date().toISOString(),
    };
  }
}

// Write step data to file
function writeStepData(data) {
  try {
    fs.writeFileSync(STEP_FILE_PATH, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Failed to write step-data.json:', error);
    return false;
  }
}

// Create MCP server
const server = new Server(
  {
    name: 'step-simulator',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'get_steps',
        description: '获取当前步数数据。返回当前步数、活动状态和时间戳。',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'update_steps',
        description: '更新步数。可以增加或设置步数，并更新活动状态。',
        inputSchema: {
          type: 'object',
          properties: {
            steps: {
              type: 'number',
              description: '新的步数值。如果提供，将直接设置为该值。',
            },
            add: {
              type: 'number',
              description: '要增加的步数（可以是负数来减少步数）。',
            },
            status: {
              type: 'string',
              enum: ['IDLE', 'WALKING', 'RUNNING'],
              description: '活动状态：IDLE（静止）、WALKING（行走中）、RUNNING（跑步中）',
            },
          },
        },
      },
      {
        name: 'reset_steps',
        description: '重置步数为 0，并更新状态为 IDLE。',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'get_step_status',
        description: '获取步数状态信息，包括当前步数、状态、时间戳，以及计算的距离（公里）和消耗的卡路里（千卡）。',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'get_steps': {
        const data = readStepData();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(data, null, 2),
            },
          ],
        };
      }

      case 'update_steps': {
        const currentData = readStepData();
        let newSteps = currentData.steps;
        let newStatus = currentData.status;

        if (args?.steps !== undefined) {
          newSteps = Number(args.steps);
        } else if (args?.add !== undefined) {
          newSteps = currentData.steps + Number(args.add);
        }

        if (args?.status) {
          newStatus = args.status;
        }

        if (newSteps < 0) {
          newSteps = 0;
        }

        const updatedData = {
          steps: newSteps,
          status: newStatus,
          timestamp: new Date().toISOString(),
        };

        const success = writeStepData(updatedData);

        if (!success) {
          throw new McpError(
            ErrorCode.InternalError,
            'Failed to write step data to file'
          );
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                data: updatedData,
                message: `步数已更新为 ${updatedData.steps}，状态：${updatedData.status}`,
              }, null, 2),
            },
          ],
        };
      }

      case 'reset_steps': {
        const resetData = {
          steps: 0,
          status: 'IDLE',
          timestamp: new Date().toISOString(),
        };

        const success = writeStepData(resetData);

        if (!success) {
          throw new McpError(
            ErrorCode.InternalError,
            'Failed to write step data to file'
          );
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                data: resetData,
                message: '步数已重置为 0',
              }, null, 2),
            },
          ],
        };
      }

      case 'get_step_status': {
        const data = readStepData();
        const distance = (data.steps * 0.0007).toFixed(2);
        const calories = Math.floor(data.steps * 0.04);

        const statusInfo = {
          steps: data.steps,
          status: data.status,
          timestamp: data.timestamp,
          distance: parseFloat(distance),
          distanceUnit: 'km',
          calories,
          caloriesUnit: 'kcal',
        };

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(statusInfo, null, 2),
            },
          ],
        };
      }

      default:
        throw new McpError(
          ErrorCode.MethodNotFound,
          `Unknown tool: ${name}`
        );
    }
  } catch (error) {
    if (error instanceof McpError) {
      throw error;
    }
    throw new McpError(
      ErrorCode.InternalError,
      `Error executing tool ${name}: ${error.message}`
    );
  }
});

// WebSocket Transport for MCP
class WebSocketTransport {
  constructor(ws) {
    this.ws = ws;
    this.messageHandlers = [];
    this.requestId = 0;
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.ws.on('open', () => {
        console.log('WebSocket connected to Xiaozhi platform');
        resolve();
      });

      this.ws.on('message', async (data) => {
        try {
          const message = JSON.parse(data.toString());
          await this.handleMessage(message);
        } catch (error) {
          console.error('Failed to parse message:', error);
        }
      });

      this.ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        reject(error);
      });

      this.ws.on('close', () => {
        console.log('WebSocket closed, attempting to reconnect in 5 seconds...');
        setTimeout(() => {
          this.reconnect();
        }, 5000);
      });
    });
  }

  async handleMessage(message) {
    // Handle JSON-RPC messages
    if (message.jsonrpc === '2.0') {
      // Forward to server message handler
      for (const handler of this.messageHandlers) {
        await handler(message);
      }
    }
  }

  async send(message) {
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not open, message not sent');
    }
  }

  reconnect() {
    console.log('Reconnecting...');
    const newWs = new WebSocket(WS_ENDPOINT);
    this.ws = newWs;
    this.connect().then(() => {
      this.initialize();
    });
  }

  onMessage(handler) {
    this.messageHandlers.push(handler);
  }

  getNextRequestId() {
    return ++this.requestId;
  }

  async initialize() {
    // Send initialize request
    const initMessage = {
      jsonrpc: '2.0',
      id: this.getNextRequestId(),
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: {},
        },
        clientInfo: {
          name: 'xiaozhi-platform',
          version: '1.0.0',
        },
      },
    };

    await this.send(initMessage);
    console.log('Initialize request sent');
  }
}

// Start server with WebSocket
async function main() {
  console.log(`Connecting to Xiaozhi platform...`);
  console.log(`Endpoint: ${WS_ENDPOINT.substring(0, 50)}...`);
  
  const ws = new WebSocket(WS_ENDPOINT);
  const transport = new WebSocketTransport(ws);

  // Handle incoming messages from platform
  transport.onMessage(async (message) => {
    // Process MCP protocol messages
    if (message.method) {
      // Handle requests from the platform
      try {
        // Convert message to MCP request format
        const request = {
          method: message.method,
          params: message.params || {},
        };

        let response;
        
        // Handle different request types
        if (message.method === 'tools/list') {
          const listResponse = await server.handleRequest({
            method: 'tools/list',
            params: {},
          });
          response = listResponse;
        } else if (message.method === 'tools/call') {
          const callResponse = await server.handleRequest({
            method: 'tools/call',
            params: message.params,
          });
          response = callResponse;
        } else if (message.method === 'initialize') {
          // Respond to initialize
          response = {
            protocolVersion: '2024-11-05',
            capabilities: {
              tools: {},
            },
            serverInfo: {
              name: 'step-simulator',
              version: '1.0.0',
            },
          };
        }

        if (response && message.id !== undefined) {
          await transport.send({
            jsonrpc: '2.0',
            id: message.id,
            result: response,
          });
        }
      } catch (error) {
        console.error('Error handling request:', error);
        if (message.id !== undefined) {
          await transport.send({
            jsonrpc: '2.0',
            id: message.id,
            error: {
              code: error.code || -32603,
              message: error.message || 'Internal error',
            },
          });
        }
      }
    } else if (message.result && message.method === 'initialize') {
      // Initialize response received, send initialized notification
      await transport.send({
        jsonrpc: '2.0',
        method: 'notifications/initialized',
      });
      console.log('MCP server initialized and connected to Xiaozhi platform');
      console.log('Available tools: get_steps, update_steps, reset_steps, get_step_status');
    }
  });

  await transport.connect();
  await transport.initialize();
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});


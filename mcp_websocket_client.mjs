#!/usr/bin/env node

/**
 * MCP WebSocket Client for Xiaozhi Platform
 * 小智平台的 MCP WebSocket 客户端
 * 
 * 将步数模拟器工具注册到小智的 WebSocket 端点
 */

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

// Tool implementations
const tools = {
  get_steps: async () => {
    const data = readStepData();
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  },

  update_steps: async (args) => {
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
      throw new Error('Failed to write step data to file');
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
  },

  reset_steps: async () => {
    const resetData = {
      steps: 0,
      status: 'IDLE',
      timestamp: new Date().toISOString(),
    };

    const success = writeStepData(resetData);

    if (!success) {
      throw new Error('Failed to write step data to file');
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
  },

  get_step_status: async () => {
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
  },
};

// Tool definitions
const toolDefinitions = [
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
];

// MCP message handler
class MCPClient {
  constructor(wsEndpoint) {
    this.wsEndpoint = wsEndpoint;
    this.ws = null;
    this.requestId = 0;
    this.pendingRequests = new Map();
  }

  connect() {
    return new Promise((resolve, reject) => {
      console.log(`Connecting to ${this.wsEndpoint}...`);
      
      this.ws = new WebSocket(this.wsEndpoint);

      this.ws.on('open', () => {
        console.log('WebSocket connected');
        this.initialize().then(resolve).catch(reject);
      });

      this.ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleMessage(message);
        } catch (error) {
          console.error('Failed to parse message:', error);
        }
      });

      this.ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        reject(error);
      });

      this.ws.on('close', () => {
        console.log('WebSocket closed');
        // Reconnect after 5 seconds
        setTimeout(() => {
          console.log('Attempting to reconnect...');
          this.connect();
        }, 5000);
      });
    });
  }

  async initialize() {
    // Send initialize request
    const initRequest = {
      jsonrpc: '2.0',
      id: this.getNextRequestId(),
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: {},
        },
        clientInfo: {
          name: 'step-simulator-mcp-client',
          version: '1.0.0',
        },
      },
    };

    return this.sendRequest(initRequest).then(() => {
      // Send initialized notification
      this.sendNotification({
        jsonrpc: '2.0',
        method: 'notifications/initialized',
      });

      // Register tools
      this.registerTools();
    });
  }

  registerTools() {
    // Send tools/list request to register tools
    const listRequest = {
      jsonrpc: '2.0',
      id: this.getNextRequestId(),
      method: 'tools/list',
      params: {},
    };

    this.sendRequest(listRequest).then((response) => {
      console.log('Tools registered:', toolDefinitions.map(t => t.name).join(', '));
    });
  }

  handleMessage(message) {
    // Handle responses
    if (message.id && this.pendingRequests.has(message.id)) {
      const { resolve, reject } = this.pendingRequests.get(message.id);
      this.pendingRequests.delete(message.id);

      if (message.error) {
        reject(new Error(message.error.message || 'Request failed'));
      } else {
        resolve(message.result);
      }
    }

    // Handle tool calls
    if (message.method === 'tools/call') {
      this.handleToolCall(message);
    }
  }

  async handleToolCall(message) {
    const { name, arguments: args } = message.params;
    const requestId = message.id;

    try {
      if (!tools[name]) {
        throw new Error(`Unknown tool: ${name}`);
      }

      const result = await tools[name](args);

      this.sendResponse(requestId, result);
    } catch (error) {
      this.sendError(requestId, error);
    }
  }

  sendRequest(request) {
    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        reject(new Error('WebSocket is not connected'));
        return;
      }

      this.pendingRequests.set(request.id, { resolve, reject });
      this.ws.send(JSON.stringify(request));
    });
  }

  sendNotification(notification) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }
    this.ws.send(JSON.stringify(notification));
  }

  sendResponse(requestId, result) {
    const response = {
      jsonrpc: '2.0',
      id: requestId,
      result,
    };
    this.sendNotification(response);
  }

  sendError(requestId, error) {
    const response = {
      jsonrpc: '2.0',
      id: requestId,
      error: {
        code: -32603,
        message: error.message || 'Internal error',
      },
    };
    this.sendNotification(response);
  }

  getNextRequestId() {
    return ++this.requestId;
  }
}

// Start client
async function main() {
  const client = new MCPClient(WS_ENDPOINT);
  
  try {
    await client.connect();
    console.log('MCP client started and connected to Xiaozhi platform');
    console.log('Registered tools:', toolDefinitions.map(t => t.name).join(', '));
  } catch (error) {
    console.error('Failed to start MCP client:', error);
    process.exit(1);
  }
}

main();


#!/usr/bin/env node

/**
 * MCP Server for Step Simulator
 * 步数模拟器的 MCP 服务器
 * 
 * 参考: https://github.com/78/mcp-calculator
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ErrorCode,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// JSON file path - same as server.mjs
const STEP_FILE_PATH = process.env.STEP_FILE_PATH
  ? process.env.STEP_FILE_PATH
  : path.join(__dirname, 'step-data.json');

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

        // Handle direct step setting
        if (args?.steps !== undefined) {
          newSteps = Number(args.steps);
        }
        // Handle step addition/subtraction
        else if (args?.add !== undefined) {
          newSteps = currentData.steps + Number(args.add);
        }

        // Handle status update
        if (args?.status) {
          newStatus = args.status;
        }

        // Ensure steps is non-negative
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
        const distance = (data.steps * 0.0007).toFixed(2); // km
        const calories = Math.floor(data.steps * 0.04); // kcal

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

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Step Simulator MCP server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});


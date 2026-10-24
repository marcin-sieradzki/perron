#!/usr/bin/env node
// Runs the Perron MCP server over stdio: `npx @mylder/perron-mcp`.
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { createServer } from './server.ts'

await createServer().connect(new StdioServerTransport())

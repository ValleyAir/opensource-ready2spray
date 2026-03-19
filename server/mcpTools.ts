import { ClaudeTool } from './claude';

/**
 * Define MCP tools available to Claude for function calling
 * These tools allow Claude to interact with your connected MCP servers
 */
export const mcpTools: ClaudeTool[] = [
  // Database operations
  {
    name: 'get_jobs',
    description: 'Retrieve spray jobs from the database. Can filter by status, customer, date range.',
    input_schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['pending', 'in_progress', 'completed', 'cancelled'],
          description: 'Filter jobs by status',
        },
        customerId: {
          type: 'number',
          description: 'Filter jobs by customer ID',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of jobs to return (default: 10)',
        },
      },
    },
  },
  {
    name: 'create_job',
    description: 'Create a new spray job in the system',
    input_schema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Job title/name',
        },
        customerId: {
          type: 'number',
          description: 'Customer ID for this job',
        },
        location: {
          type: 'string',
          description: 'Job location address',
        },
        scheduledStart: {
          type: 'string',
          description: 'Scheduled start date (ISO 8601 format)',
        },
        notes: {
          type: 'string',
          description: 'Additional notes or instructions',
        },
      },
      required: ['title', 'customerId', 'location'],
    },
  },
  {
    name: 'get_customers',
    description: 'Retrieve customers from the database',
    input_schema: {
      type: 'object',
      properties: {
        search: {
          type: 'string',
          description: 'Search customers by name',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of customers to return (default: 10)',
        },
      },
    },
  },
  {
    name: 'create_customer',
    description: 'Create a new customer in the system',
    input_schema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Customer name',
        },
        email: {
          type: 'string',
          description: 'Customer email address',
        },
        phone: {
          type: 'string',
          description: 'Customer phone number',
        },
        address: {
          type: 'string',
          description: 'Customer address',
        },
      },
      required: ['name'],
    },
  },
  // Weather information
  {
    name: 'get_weather',
    description: 'Get current weather conditions for a location to help schedule spray jobs',
    input_schema: {
      type: 'object',
      properties: {
        location: {
          type: 'string',
          description: 'Location (city, state or coordinates)',
        },
      },
      required: ['location'],
    },
  },
  // MCP tool placeholders - these would call actual MCP servers
  {
    name: 'send_email',
    description: 'Send an email via Gmail MCP integration',
    input_schema: {
      type: 'object',
      properties: {
        to: {
          type: 'string',
          description: 'Recipient email address',
        },
        subject: {
          type: 'string',
          description: 'Email subject',
        },
        body: {
          type: 'string',
          description: 'Email body content',
        },
      },
      required: ['to', 'subject', 'body'],
    },
  },
  {
    name: 'create_calendar_event',
    description: 'Create a calendar event via Google Calendar MCP integration',
    input_schema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Event title',
        },
        start: {
          type: 'string',
          description: 'Start time (ISO 8601 format)',
        },
        end: {
          type: 'string',
          description: 'End time (ISO 8601 format)',
        },
        description: {
          type: 'string',
          description: 'Event description',
        },
      },
      required: ['title', 'start', 'end'],
    },
  },
];

/**
 * Execute MCP tool calls from Claude
 */
export async function executeMCPTool(toolName: string, toolInput: any, context: { organizationId: number; userId: number }) {
  console.log(`[MCP] Executing tool: ${toolName}`, toolInput);

  // Import database functions
  const { getDb } = await import('./db');
  const db = await getDb();

  if (!db) {
    throw new Error('Database not available');
  }

  try {
    switch (toolName) {
      case 'get_jobs': {
        const { getJobsByOrgId } = await import('./db');
        const jobs = await getJobsByOrgId(context.organizationId);
        
        let filtered = jobs;
        if (toolInput.status) {
          filtered = filtered.filter((j: any) => j.status === toolInput.status);
        }
        if (toolInput.customerId) {
          filtered = filtered.filter((j: any) => j.customerId === toolInput.customerId);
        }
        if (toolInput.limit) {
          filtered = filtered.slice(0, toolInput.limit);
        }
        
        return { success: true, data: filtered };
      }

      case 'create_job': {
        const { createJob } = await import('./db');
        const jobId = await createJob({
          ...toolInput,
          organizationId: context.organizationId,
          status: 'pending',
        });
        return { success: true, jobId };
      }

      case 'get_customers': {
        const { getCustomersByOrgId } = await import('./db');
        const customers = await getCustomersByOrgId(context.organizationId);
        
        let filtered = customers;
        if (toolInput.search) {
          const search = toolInput.search.toLowerCase();
          filtered = filtered.filter((c: any) => 
            c.name?.toLowerCase().includes(search)
          );
        }
        if (toolInput.limit) {
          filtered = filtered.slice(0, toolInput.limit);
        }
        
        return { success: true, data: filtered };
      }

      case 'create_customer': {
        const { createCustomer } = await import('./db');
        const customerId = await createCustomer({
          ...toolInput,
          organizationId: context.organizationId,
        });
        return { success: true, customerId };
      }

      case 'get_weather': {
        // Placeholder - would integrate with weather API
        return {
          success: true,
          data: {
            location: toolInput.location,
            temperature: 72,
            conditions: 'Partly cloudy',
            windSpeed: 8,
            humidity: 65,
            message: 'Good conditions for spraying',
          },
        };
      }

      case 'send_email':
      case 'create_calendar_event': {
        // Placeholder for actual MCP integration
        return {
          success: true,
          message: `${toolName} would be executed via MCP server`,
          input: toolInput,
        };
      }

      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  } catch (error: any) {
    console.error(`[MCP] Error executing tool ${toolName}:`, error);
    return {
      success: false,
      error: error.message,
    };
  }
}

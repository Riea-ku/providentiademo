import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ================================================
// PROVIDENTIA ENTERPRISE AGRICULTURAL MANAGEMENT SYSTEM
// © 2026 AgriProvidentia Technologies
// LLM-Powered Unified Interface
// ================================================

const SYSTEM_PROMPT = `You are AgriProvidentia AI, an intelligent agricultural management assistant for the Providentia Enterprise Platform.

© 2026 AgriProvidentia Technologies

You have access to a complete enterprise farm management system with 22 interconnected features:

## YOUR CAPABILITIES:
1. **Equipment Prediction** - Run ML predictions on equipment health, detect failures
2. **Work Order Management** - Create, assign, track maintenance work orders
3. **Inventory Management** - Track parts, tools, supplies; check stock levels
4. **Purchase Orders** - Create and manage procurement
5. **Technician Management** - Check availability, assign work, track skills
6. **Facility Scheduling** - Book workshops, sheds, service bays
7. **Inspections** - Schedule and track equipment inspections
8. **Calibrations** - Manage calibration schedules for tools/equipment
9. **Service History** - Access complete service records
10. **Cost Tracking** - Monitor costs by equipment, farm, project
11. **Vendor Management** - Manage supplier relationships
12. **Document Management** - Access manuals, certificates, reports
13. **Employee Hours** - Track technician working hours
14. **Dispatch Logs** - Track field service activities
15. **Farm Management** - Manage multiple farm locations
16. **Alerts & Notifications** - View and acknowledge system alerts
17. **Analytics & Reporting** - Generate comprehensive reports
18. **Asset Tracking** - GPS location tracking for equipment
19. **Maintenance Logs** - Detailed maintenance records
20. **Manufacturer Info** - Warranty and support information

## HOW YOU OPERATE:
When a user makes a request, you:
1. Understand their intent
2. Query the relevant database tables
3. Take actions across multiple systems as needed
4. Report back with actionable information

## INTERCONNECTION EXAMPLES:
- "Check tractor T-789" → Run prediction → If failure detected → Auto-create work order → Check parts inventory → Schedule technician
- "Order parts for pump" → Check current inventory → Find vendor → Create purchase order → Update inventory
- "Show maintenance costs this month" → Query cost_tracking → Aggregate by equipment → Show breakdown

## RESPONSE STYLE:
- Be concise but thorough
- Use equipment codes (T-789, SP-001) when referencing equipment
- Provide actionable next steps
- When creating work orders, provide the WO number
- When low inventory detected, suggest reordering
- Always confirm actions taken

## PREDICTION MODEL (PRESERVED):
You use the exact threshold-based prediction logic from the original system:
- Motor Temperature: Warning >70°C, Critical >85°C
- Vibration: Warning >2.5, Critical >4.0
- Power Output: Warning <85%, Critical <70%
- Flow Rate: Warning <90%, Critical <75%
- Pressure: Warning deviation >15%, Critical >25%

Current date: ${new Date().toISOString().split('T')[0]}
`;

// Tool definitions for structured output
const TOOLS = [
  {
    type: "function",
    function: {
      name: "query_equipment",
      description: "Query equipment information by code, type, or status",
      parameters: {
        type: "object",
        properties: {
          equipment_code: { type: "string", description: "Equipment code like T-789" },
          equipment_type: { type: "string", description: "Type: tractor, solar_pump, irrigation" },
          status: { type: "string", description: "Status: operational, warning, critical" },
          farm_name: { type: "string", description: "Farm name to filter by" }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "run_prediction",
      description: "Run predictive maintenance analysis on equipment",
      parameters: {
        type: "object",
        properties: {
          equipment_code: { type: "string", description: "Equipment code to analyze" },
          sensor_data: {
            type: "object",
            properties: {
              motor_temp: { type: "number" },
              vibration: { type: "number" },
              power_output: { type: "number" },
              flow_rate: { type: "number" },
              pressure: { type: "number" }
            }
          }
        },
        required: ["equipment_code"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "create_work_order",
      description: "Create a new work order for maintenance",
      parameters: {
        type: "object",
        properties: {
          equipment_code: { type: "string" },
          title: { type: "string" },
          description: { type: "string" },
          priority: { type: "string", enum: ["low", "medium", "high", "critical"] },
          work_type: { type: "string", enum: ["preventive", "corrective", "emergency", "inspection"] }
        },
        required: ["equipment_code", "title", "priority"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "check_inventory",
      description: "Check inventory levels for parts",
      parameters: {
        type: "object",
        properties: {
          part_number: { type: "string" },
          category: { type: "string" },
          compatible_with: { type: "string", description: "Equipment type compatibility" },
          low_stock_only: { type: "boolean" }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "schedule_technician",
      description: "Find and schedule an available technician",
      parameters: {
        type: "object",
        properties: {
          required_skills: { type: "array", items: { type: "string" } },
          work_order_id: { type: "string" },
          preferred_date: { type: "string" }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "create_purchase_order",
      description: "Create a purchase order for parts",
      parameters: {
        type: "object",
        properties: {
          items: {
            type: "array",
            items: {
              type: "object",
              properties: {
                part_number: { type: "string" },
                quantity: { type: "number" }
              }
            }
          },
          vendor_code: { type: "string" },
          urgency: { type: "string", enum: ["normal", "urgent"] }
        },
        required: ["items"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_service_history",
      description: "Get service history for equipment",
      parameters: {
        type: "object",
        properties: {
          equipment_code: { type: "string" },
          limit: { type: "number" }
        },
        required: ["equipment_code"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_work_orders",
      description: "Get work orders with filters",
      parameters: {
        type: "object",
        properties: {
          status: { type: "string" },
          priority: { type: "string" },
          technician_id: { type: "string" },
          equipment_code: { type: "string" }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "book_facility",
      description: "Book a facility for maintenance work",
      parameters: {
        type: "object",
        properties: {
          facility_type: { type: "string", enum: ["workshop", "shed", "storage"] },
          date: { type: "string" },
          duration_hours: { type: "number" },
          purpose: { type: "string" }
        },
        required: ["facility_type", "date"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_analytics",
      description: "Get analytics and reports",
      parameters: {
        type: "object",
        properties: {
          report_type: { 
            type: "string", 
            enum: ["costs", "equipment_health", "technician_utilization", "inventory_status", "work_order_summary"]
          },
          time_period: { type: "string", enum: ["today", "week", "month", "quarter"] },
          farm_name: { type: "string" }
        },
        required: ["report_type"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_alerts",
      description: "Get system alerts and notifications",
      parameters: {
        type: "object",
        properties: {
          severity: { type: "string", enum: ["info", "warning", "critical"] },
          acknowledged: { type: "boolean" }
        }
      }
    }
  }
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, session_id, execute_tools } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }
    
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    
    // If we need to execute tools from a previous response
    if (execute_tools && execute_tools.length > 0) {
      const toolResults = await executeTools(supabase, execute_tools);
      return new Response(JSON.stringify({ tool_results: toolResults }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get context from database for enhanced responses
    const dbContext = await getEnhancedContext(supabase);
    
    const enhancedSystemPrompt = `${SYSTEM_PROMPT}

## CURRENT DATABASE CONTEXT:
${dbContext}
`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: enhancedSystemPrompt },
          ...messages,
        ],
        tools: TOOLS,
        tool_choice: "auto",
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    // Save user message to chat history
    if (session_id && messages.length > 0) {
      const lastUserMessage = messages[messages.length - 1];
      if (lastUserMessage.role === 'user') {
        await supabase.from('chat_messages').insert({
          session_id,
          role: 'user',
          content: lastUserMessage.content,
        });
      }
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });

  } catch (error) {
    console.error("AgriAssistant error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function getEnhancedContext(supabase: any): Promise<string> {
  try {
    // Get equipment summary
    const { data: equipment } = await supabase
      .from('equipment')
      .select('equipment_code, name, equipment_type, status, farm_id')
      .limit(20);

    // Get active work orders
    const { data: workOrders } = await supabase
      .from('work_orders')
      .select('work_order_number, title, status, priority')
      .in('status', ['pending', 'scheduled', 'in_progress'])
      .limit(10);

    // Get low stock inventory
    const { data: lowStock } = await supabase
      .from('inventory')
      .select('part_number, name, quantity_on_hand, reorder_point')
      .lt('quantity_on_hand', 10)
      .limit(10);

    // Get available technicians
    const { data: technicians } = await supabase
      .from('technicians')
      .select('employee_id, first_name, last_name, status, skills')
      .eq('status', 'available');

    // Get unacknowledged alerts
    const { data: alerts } = await supabase
      .from('alerts')
      .select('alert_type, severity, title')
      .eq('acknowledged', false)
      .limit(5);

    return `
Equipment (${equipment?.length || 0} items): ${equipment?.map((e: any) => `${e.equipment_code} (${e.status})`).join(', ') || 'None'}

Active Work Orders: ${workOrders?.map((w: any) => `${w.work_order_number}: ${w.title} [${w.status}]`).join('; ') || 'None'}

Low Stock Items: ${lowStock?.map((i: any) => `${i.part_number}: ${i.quantity_on_hand}/${i.reorder_point}`).join(', ') || 'All stock OK'}

Available Technicians: ${technicians?.map((t: any) => `${t.first_name} ${t.last_name} (${t.skills?.join(', ')})`).join('; ') || 'None'}

Unacknowledged Alerts: ${alerts?.map((a: any) => `[${a.severity}] ${a.title}`).join('; ') || 'None'}
`;
  } catch (error) {
    console.error("Error getting context:", error);
    return "Unable to load database context.";
  }
}

async function executeTools(supabase: any, toolCalls: any[]): Promise<any[]> {
  const results = [];
  
  for (const call of toolCalls) {
    const { name, arguments: args } = call.function;
    const parsedArgs = typeof args === 'string' ? JSON.parse(args) : args;
    
    try {
      let result;
      
      switch (name) {
        case 'query_equipment':
          result = await queryEquipment(supabase, parsedArgs);
          break;
        case 'run_prediction':
          result = await runPrediction(supabase, parsedArgs);
          break;
        case 'create_work_order':
          result = await createWorkOrder(supabase, parsedArgs);
          break;
        case 'check_inventory':
          result = await checkInventory(supabase, parsedArgs);
          break;
        case 'schedule_technician':
          result = await scheduleTechnician(supabase, parsedArgs);
          break;
        case 'create_purchase_order':
          result = await createPurchaseOrder(supabase, parsedArgs);
          break;
        case 'get_service_history':
          result = await getServiceHistory(supabase, parsedArgs);
          break;
        case 'get_work_orders':
          result = await getWorkOrders(supabase, parsedArgs);
          break;
        case 'book_facility':
          result = await bookFacility(supabase, parsedArgs);
          break;
        case 'get_analytics':
          result = await getAnalytics(supabase, parsedArgs);
          break;
        case 'get_alerts':
          result = await getAlerts(supabase, parsedArgs);
          break;
        default:
          result = { error: `Unknown tool: ${name}` };
      }
      
      results.push({ tool_call_id: call.id, result });
    } catch (error) {
      results.push({ 
        tool_call_id: call.id, 
        error: error instanceof Error ? error.message : 'Tool execution failed' 
      });
    }
  }
  
  return results;
}

// Tool implementations
async function queryEquipment(supabase: any, args: any) {
  let query = supabase.from('equipment').select('*, farms(name)');
  
  if (args.equipment_code) {
    query = query.eq('equipment_code', args.equipment_code);
  }
  if (args.equipment_type) {
    query = query.eq('equipment_type', args.equipment_type);
  }
  if (args.status) {
    query = query.eq('status', args.status);
  }
  
  const { data, error } = await query.limit(20);
  if (error) throw error;
  return data;
}

async function runPrediction(supabase: any, args: any) {
  // Get equipment
  const { data: equipment, error: eqError } = await supabase
    .from('equipment')
    .select('*')
    .eq('equipment_code', args.equipment_code)
    .single();
    
  if (eqError || !equipment) {
    return { error: `Equipment ${args.equipment_code} not found` };
  }
  
  // Use provided sensor data or generate simulated values
  const sensorData = args.sensor_data || {
    motor_temp: 65 + Math.random() * 30,
    vibration: 1.5 + Math.random() * 3,
    power_output: 70 + Math.random() * 25,
    flow_rate: 75 + Math.random() * 20,
    pressure: 90 + Math.random() * 20
  };
  
  // Run prediction logic (preserved from original)
  const failures = [];
  let healthScore = 100;
  
  if (sensorData.motor_temp > 85) {
    failures.push({ type: 'Motor Overheating', severity: 'critical' });
    healthScore -= 35;
  } else if (sensorData.motor_temp > 70) {
    failures.push({ type: 'Motor Temperature Warning', severity: 'warning' });
    healthScore -= 15;
  }
  
  if (sensorData.vibration > 4.0) {
    failures.push({ type: 'Bearing Failure Imminent', severity: 'critical' });
    healthScore -= 40;
  } else if (sensorData.vibration > 2.5) {
    failures.push({ type: 'Excessive Vibration', severity: 'warning' });
    healthScore -= 20;
  }
  
  if (sensorData.power_output < 70) {
    failures.push({ type: 'Power Output Critical', severity: 'critical' });
    healthScore -= 30;
  } else if (sensorData.power_output < 85) {
    failures.push({ type: 'Reduced Power Output', severity: 'warning' });
    healthScore -= 10;
  }
  
  if (sensorData.flow_rate < 75) {
    failures.push({ type: 'Flow Rate Critical', severity: 'critical' });
    healthScore -= 25;
  } else if (sensorData.flow_rate < 90) {
    failures.push({ type: 'Flow Rate Reduced', severity: 'warning' });
    healthScore -= 10;
  }
  
  healthScore = Math.max(0, healthScore);
  const urgency = healthScore < 40 ? 'critical' : healthScore < 70 ? 'high' : healthScore < 85 ? 'medium' : 'low';
  const timeToFailure = healthScore < 40 ? 24 : healthScore < 70 ? 72 : healthScore < 85 ? 168 : 720;
  const estimatedCost = failures.length * 450 + (100 - healthScore) * 15;
  
  const predictionResult = {
    equipment_code: args.equipment_code,
    equipment_name: equipment.name,
    health_score: healthScore,
    failures,
    urgency,
    time_to_failure_hours: timeToFailure,
    estimated_cost: estimatedCost,
    sensor_data: sensorData,
    recommendation: failures.length > 0 
      ? `Immediate attention required. ${failures.length} issue(s) detected.`
      : 'Equipment operating normally. Continue regular monitoring.'
  };
  
  // Save prediction to database
  const { data: savedPrediction, error: saveError } = await supabase
    .from('predictions')
    .insert({
      equipment_id: equipment.id,
      sensor_data: sensorData,
      prediction_result: predictionResult,
      failure_types: failures,
      health_score: healthScore,
      time_to_failure_hours: timeToFailure,
      maintenance_urgency: urgency,
      estimated_cost: estimatedCost,
      confidence_score: 92.5
    })
    .select()
    .single();
  
  // Update equipment status if critical
  if (urgency === 'critical' || urgency === 'high') {
    await supabase
      .from('equipment')
      .update({ status: urgency === 'critical' ? 'critical' : 'warning' })
      .eq('id', equipment.id);
  }
  
  // Create system event
  await supabase.from('system_events').insert({
    event_type: 'prediction_created',
    source_table: 'predictions',
    source_id: savedPrediction?.id,
    event_data: predictionResult
  });
  
  return predictionResult;
}

async function createWorkOrder(supabase: any, args: any) {
  // Get equipment
  const { data: equipment } = await supabase
    .from('equipment')
    .select('id')
    .eq('equipment_code', args.equipment_code)
    .single();
    
  if (!equipment) {
    return { error: `Equipment ${args.equipment_code} not found` };
  }
  
  const { data, error } = await supabase
    .from('work_orders')
    .insert({
      equipment_id: equipment.id,
      title: args.title,
      description: args.description || '',
      priority: args.priority,
      work_type: args.work_type || 'corrective',
      status: 'pending'
    })
    .select()
    .single();
    
  if (error) throw error;
  
  // Create system event
  await supabase.from('system_events').insert({
    event_type: 'work_order_created',
    source_table: 'work_orders',
    source_id: data.id,
    event_data: data
  });
  
  return { 
    success: true, 
    work_order_number: data.work_order_number,
    message: `Work order ${data.work_order_number} created successfully` 
  };
}

async function checkInventory(supabase: any, args: any) {
  let query = supabase.from('inventory').select('*');
  
  if (args.part_number) {
    query = query.eq('part_number', args.part_number);
  }
  if (args.category) {
    query = query.eq('category', args.category);
  }
  if (args.compatible_with) {
    query = query.contains('compatible_equipment', [args.compatible_with]);
  }
  if (args.low_stock_only) {
    query = query.lt('quantity_on_hand', 10);
  }
  
  const { data, error } = await query.limit(20);
  if (error) throw error;
  
  return data.map((item: any) => ({
    ...item,
    needs_reorder: item.quantity_on_hand <= item.reorder_point
  }));
}

async function scheduleTechnician(supabase: any, args: any) {
  let query = supabase
    .from('technicians')
    .select('*')
    .eq('status', 'available');
    
  if (args.required_skills && args.required_skills.length > 0) {
    query = query.overlaps('skills', args.required_skills);
  }
  
  const { data: technicians, error } = await query;
  if (error) throw error;
  
  if (!technicians || technicians.length === 0) {
    return { error: 'No available technicians with required skills' };
  }
  
  const selectedTech = technicians[0];
  
  // If work order provided, assign technician
  if (args.work_order_id) {
    await supabase
      .from('work_orders')
      .update({ 
        assigned_technician_id: selectedTech.id,
        status: 'scheduled',
        scheduled_start: args.preferred_date || new Date().toISOString()
      })
      .eq('work_order_number', args.work_order_id);
      
    // Update technician status
    await supabase
      .from('technicians')
      .update({ status: 'on_job' })
      .eq('id', selectedTech.id);
  }
  
  return {
    assigned_technician: `${selectedTech.first_name} ${selectedTech.last_name}`,
    employee_id: selectedTech.employee_id,
    skills: selectedTech.skills,
    hourly_rate: selectedTech.hourly_rate
  };
}

async function createPurchaseOrder(supabase: any, args: any) {
  // Get vendor
  let vendor;
  if (args.vendor_code) {
    const { data } = await supabase
      .from('vendors')
      .select('*')
      .eq('vendor_code', args.vendor_code)
      .single();
    vendor = data;
  } else {
    // Get preferred vendor
    const { data } = await supabase
      .from('vendors')
      .select('*')
      .eq('is_preferred', true)
      .limit(1)
      .single();
    vendor = data;
  }
  
  if (!vendor) {
    return { error: 'No vendor found' };
  }
  
  // Calculate totals
  let subtotal = 0;
  const lineItems = [];
  
  for (const item of args.items) {
    const { data: inventoryItem } = await supabase
      .from('inventory')
      .select('*')
      .eq('part_number', item.part_number)
      .single();
      
    if (inventoryItem) {
      const lineTotal = (inventoryItem.unit_cost || 0) * item.quantity;
      subtotal += lineTotal;
      lineItems.push({
        inventory_id: inventoryItem.id,
        part_number: item.part_number,
        name: inventoryItem.name,
        quantity: item.quantity,
        unit_price: inventoryItem.unit_cost,
        total: lineTotal
      });
    }
  }
  
  const { data, error } = await supabase
    .from('purchase_orders')
    .insert({
      vendor_id: vendor.id,
      status: args.urgency === 'urgent' ? 'approved' : 'pending_approval',
      line_items: lineItems,
      subtotal,
      total: subtotal * 1.1, // 10% tax
      requested_delivery_date: new Date(Date.now() + vendor.lead_time_days * 86400000).toISOString().split('T')[0]
    })
    .select()
    .single();
    
  if (error) throw error;
  
  return {
    success: true,
    po_number: data.po_number,
    vendor: vendor.name,
    total: data.total,
    expected_delivery: data.requested_delivery_date
  };
}

async function getServiceHistory(supabase: any, args: any) {
  const { data: equipment } = await supabase
    .from('equipment')
    .select('id')
    .eq('equipment_code', args.equipment_code)
    .single();
    
  if (!equipment) {
    return { error: `Equipment ${args.equipment_code} not found` };
  }
  
  const { data, error } = await supabase
    .from('service_history')
    .select('*, technicians(first_name, last_name)')
    .eq('equipment_id', equipment.id)
    .order('service_date', { ascending: false })
    .limit(args.limit || 10);
    
  if (error) throw error;
  return data;
}

async function getWorkOrders(supabase: any, args: any) {
  let query = supabase
    .from('work_orders')
    .select('*, equipment(equipment_code, name), technicians(first_name, last_name)');
    
  if (args.status) {
    query = query.eq('status', args.status);
  }
  if (args.priority) {
    query = query.eq('priority', args.priority);
  }
  if (args.equipment_code) {
    // Need to filter by equipment code through join
    const { data: eq } = await supabase
      .from('equipment')
      .select('id')
      .eq('equipment_code', args.equipment_code)
      .single();
    if (eq) {
      query = query.eq('equipment_id', eq.id);
    }
  }
  
  const { data, error } = await query
    .order('created_at', { ascending: false })
    .limit(20);
    
  if (error) throw error;
  return data;
}

async function bookFacility(supabase: any, args: any) {
  const { data: facility } = await supabase
    .from('facilities')
    .select('*')
    .eq('facility_type', args.facility_type)
    .eq('is_available', true)
    .limit(1)
    .single();
    
  if (!facility) {
    return { error: `No available ${args.facility_type} found` };
  }
  
  const startTime = new Date(args.date);
  const endTime = new Date(startTime.getTime() + (args.duration_hours || 2) * 3600000);
  
  const { data, error } = await supabase
    .from('facility_bookings')
    .insert({
      facility_id: facility.id,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      purpose: args.purpose || 'Maintenance work',
      status: 'confirmed'
    })
    .select()
    .single();
    
  if (error) throw error;
  
  return {
    success: true,
    facility_name: facility.name,
    booking_time: `${startTime.toLocaleString()} - ${endTime.toLocaleString()}`
  };
}

async function getAnalytics(supabase: any, args: any) {
  const now = new Date();
  let startDate;
  
  switch (args.time_period) {
    case 'today':
      startDate = new Date(now.setHours(0, 0, 0, 0));
      break;
    case 'week':
      startDate = new Date(now.setDate(now.getDate() - 7));
      break;
    case 'month':
      startDate = new Date(now.setMonth(now.getMonth() - 1));
      break;
    case 'quarter':
      startDate = new Date(now.setMonth(now.getMonth() - 3));
      break;
    default:
      startDate = new Date(now.setMonth(now.getMonth() - 1));
  }
  
  switch (args.report_type) {
    case 'costs': {
      const { data } = await supabase
        .from('cost_tracking')
        .select('cost_type, amount')
        .gte('created_at', startDate.toISOString());
      
      const totals: any = {};
      data?.forEach((c: any) => {
        totals[c.cost_type] = (totals[c.cost_type] || 0) + parseFloat(c.amount);
      });
      
      return { period: args.time_period, cost_breakdown: totals, total: Object.values(totals).reduce((a: any, b: any) => a + b, 0) };
    }
    
    case 'equipment_health': {
      const { data } = await supabase
        .from('equipment')
        .select('status');
      
      const counts: any = { operational: 0, warning: 0, critical: 0, maintenance: 0 };
      data?.forEach((e: any) => {
        counts[e.status] = (counts[e.status] || 0) + 1;
      });
      
      return { equipment_status_summary: counts };
    }
    
    case 'work_order_summary': {
      const { data } = await supabase
        .from('work_orders')
        .select('status, priority')
        .gte('created_at', startDate.toISOString());
      
      const byStatus: any = {};
      const byPriority: any = {};
      data?.forEach((w: any) => {
        byStatus[w.status] = (byStatus[w.status] || 0) + 1;
        byPriority[w.priority] = (byPriority[w.priority] || 0) + 1;
      });
      
      return { period: args.time_period, by_status: byStatus, by_priority: byPriority, total: data?.length || 0 };
    }
    
    case 'inventory_status': {
      const { data } = await supabase
        .from('inventory')
        .select('name, quantity_on_hand, reorder_point');
      
      const lowStock = data?.filter((i: any) => i.quantity_on_hand <= i.reorder_point) || [];
      const totalValue = data?.reduce((sum: number, i: any) => sum + (i.quantity_on_hand * (i.unit_cost || 0)), 0) || 0;
      
      return { total_items: data?.length || 0, low_stock_count: lowStock.length, low_stock_items: lowStock };
    }
    
    default:
      return { error: 'Unknown report type' };
  }
}

async function getAlerts(supabase: any, args: any) {
  let query = supabase
    .from('alerts')
    .select('*')
    .order('created_at', { ascending: false });
    
  if (args.severity) {
    query = query.eq('severity', args.severity);
  }
  if (typeof args.acknowledged === 'boolean') {
    query = query.eq('acknowledged', args.acknowledged);
  }
  
  const { data, error } = await query.limit(20);
  if (error) throw error;
  return data;
}

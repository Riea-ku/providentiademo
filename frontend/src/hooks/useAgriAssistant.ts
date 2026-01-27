import { useState, useCallback, useRef } from 'react';
import { ChatMessage } from '@/types/enterprise';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_BACKEND_URL;

// Format tool results into human-readable format
function formatToolResults(toolCalls: any[], toolResults: any[]): string {
  const formatted: string[] = [];
  
  for (let i = 0; i < toolCalls.length; i++) {
    const tc = toolCalls[i];
    const result = toolResults[i]?.result;
    
    if (!result) continue;
    
    const functionName = tc.function.name;
    
    // Format based on function type
    switch (functionName) {
      case 'query_equipment':
        formatted.push(formatEquipmentResult(result));
        break;
      case 'run_prediction':
        formatted.push(formatPredictionResult(result));
        break;
      case 'check_inventory':
        formatted.push(formatInventoryResult(result));
        break;
      case 'get_work_orders':
        formatted.push(formatWorkOrdersResult(result));
        break;
      case 'get_analytics':
        formatted.push(formatAnalyticsResult(result));
        break;
      case 'get_alerts':
        formatted.push(formatAlertsResult(result));
        break;
      case 'create_work_order':
        formatted.push(formatCreateWorkOrderResult(result));
        break;
      case 'schedule_technician':
        formatted.push(formatTechnicianResult(result));
        break;
      case 'create_purchase_order':
        formatted.push(formatPurchaseOrderResult(result));
        break;
      default:
        // Fallback: show minimal info
        if (result.success) {
          formatted.push(`[+] Action completed successfully`);
        } else if (result.error) {
          formatted.push(`[X] ${result.error}`);
        }
    }
  }
  
  return formatted.join('\n\n');
}

function formatEquipmentResult(data: any): string {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return '[i] No equipment found matching your criteria.';
  }
  
  const lines: string[] = ['**Equipment Status Report**\n'];
  
  const operational = data.filter((e: any) => e.status === 'operational').length;
  const warning = data.filter((e: any) => e.status === 'warning').length;
  const critical = data.filter((e: any) => e.status === 'critical').length;
  
  lines.push(`**${data.length} equipment found:**`);
  if (operational > 0) lines.push(`[*] ${operational} operational`);
  if (warning > 0) lines.push(`[!] ${warning} needs attention`);
  if (critical > 0) lines.push(`[X] ${critical} critical`);
  lines.push('');
  
  data.slice(0, 5).forEach((eq: any) => {
    const symbol = eq.status === 'operational' ? '[*]' : eq.status === 'warning' ? '[!]' : '[X]';
    const hours = eq.current_operating_hours ? `${Number(eq.current_operating_hours).toLocaleString()} hours` : 'N/A';
    lines.push(`${symbol} **${eq.equipment_code}** - ${eq.name}`);
    lines.push(`   Type: ${eq.equipment_type} | Hours: ${hours}`);
    if (eq.farms?.name) lines.push(`   Farm: ${eq.farms.name}`);
  });
  
  if (data.length > 5) {
    lines.push(`\n...and ${data.length - 5} more items`);
  }
  
  return lines.join('\n');
}

function formatPredictionResult(data: any): string {
  if (data.error) {
    return `[X] ${data.error}`;
  }
  
  const lines: string[] = ['**Equipment Health Prediction**\n'];
  
  const healthSymbol = data.health_score >= 85 ? '[*]' : data.health_score >= 60 ? '[!]' : '[X]';
  const urgencyText = data.urgency === 'critical' ? 'CRITICAL' : data.urgency === 'high' ? 'HIGH' : data.urgency === 'medium' ? 'MEDIUM' : 'LOW';
  
  lines.push(`${healthSymbol} **${data.equipment_code}** - ${data.equipment_name}`);
  lines.push(`**Health Score:** ${data.health_score}%`);
  lines.push(`**Urgency:** ${urgencyText}`);
  
  if (data.failures && data.failures.length > 0) {
    lines.push('\n**Detected Issues:**');
    data.failures.forEach((f: any) => {
      const symbol = f.severity === 'critical' ? '[X]' : '[!]';
      lines.push(`${symbol} ${f.type}`);
    });
  }
  
  if (data.time_to_failure_hours) {
    const hours = data.time_to_failure_hours;
    const timeStr = hours < 24 ? `${hours} hours` : hours < 168 ? `${Math.round(hours / 24)} days` : `${Math.round(hours / 168)} weeks`;
    lines.push(`\n**Estimated time to failure:** ${timeStr}`);
  }
  
  if (data.estimated_cost) {
    lines.push(`**Estimated repair cost:** $${Number(data.estimated_cost).toLocaleString()}`);
  }
  
  lines.push(`\n**Recommendation:** ${data.recommendation}`);
  
  return lines.join('\n');
}

function formatInventoryResult(data: any): string {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return '[*] All inventory levels are adequate.';
  }
  
  const lines: string[] = ['**Inventory Status**\n'];
  
  const needsReorder = data.filter((i: any) => i.needs_reorder);
  
  if (needsReorder.length > 0) {
    lines.push(`[!] **${needsReorder.length} items need reordering:**\n`);
    needsReorder.slice(0, 8).forEach((item: any) => {
      lines.push(`[!] **${item.part_number}** - ${item.name}`);
      lines.push(`   Stock: ${item.quantity_on_hand} (Reorder at: ${item.reorder_point})`);
      if (item.unit_cost) lines.push(`   Unit cost: $${Number(item.unit_cost).toFixed(2)}`);
    });
  } else {
    lines.push(`[*] ${data.length} items checked - all stock levels OK`);
  }
  
  return lines.join('\n');
}

function formatWorkOrdersResult(data: any): string {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return '[*] No active work orders found.';
  }
  
  const lines: string[] = ['**Work Orders**\n'];
  lines.push(`**${data.length} orders found:**\n`);
  
  data.slice(0, 6).forEach((wo: any) => {
    const prioritySymbol = wo.priority === 'critical' ? '[X]' : wo.priority === 'high' ? '[!]' : '[~]';
    lines.push(`${prioritySymbol} **${wo.work_order_number}** - ${wo.title}`);
    lines.push(`   Status: ${wo.status} | Priority: ${wo.priority.toUpperCase()}`);
    if (wo.equipment?.equipment_code) {
      lines.push(`   Equipment: ${wo.equipment.equipment_code}`);
    }
    if (wo.technicians) {
      lines.push(`   Assigned: ${wo.technicians.first_name} ${wo.technicians.last_name}`);
    }
    lines.push('');
  });
  
  return lines.join('\n');
}

function formatAnalyticsResult(data: any): string {
  const lines: string[] = ['**Analytics Report**\n'];
  
  if (data.cost_breakdown) {
    lines.push('**Cost Breakdown:**');
    Object.entries(data.cost_breakdown).forEach(([type, amount]: [string, any]) => {
      lines.push(`[i] ${type}: $${Number(amount).toLocaleString()}`);
    });
    if (data.total) {
      lines.push(`\n**Total:** $${Number(data.total).toLocaleString()}`);
    }
  }
  
  if (data.equipment_status_summary) {
    lines.push('**Equipment Health Summary:**');
    const summary = data.equipment_status_summary;
    if (summary.operational) lines.push(`[*] Operational: ${summary.operational}`);
    if (summary.warning) lines.push(`[!] Warning: ${summary.warning}`);
    if (summary.critical) lines.push(`[X] Critical: ${summary.critical}`);
    if (summary.maintenance) lines.push(`[~] In Maintenance: ${summary.maintenance}`);
  }
  
  if (data.by_status) {
    lines.push('**Work Order Summary:**');
    Object.entries(data.by_status).forEach(([status, count]: [string, any]) => {
      lines.push(`[i] ${status}: ${count}`);
    });
  }
  
  return lines.join('\n');
}

function formatAlertsResult(data: any): string {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return '[*] No alerts to display.';
  }
  
  const lines: string[] = ['**System Alerts**\n'];
  
  data.forEach((alert: any) => {
    const symbol = alert.severity === 'critical' ? '[X]' : alert.severity === 'warning' ? '[!]' : '[i]';
    lines.push(`${symbol} **${alert.title}**`);
    lines.push(`   ${alert.message}`);
    lines.push('');
  });
  
  return lines.join('\n');
}

function formatCreateWorkOrderResult(data: any): string {
  if (data.error) {
    return `[X] Failed to create work order: ${data.error}`;
  }
  
  return `[+] **Work Order Created Successfully**\n\nOrder Number: **${data.work_order_number}**\n\n${data.message}\n\n[>] Next: Assign a technician or add parts to this order.`;
}

function formatTechnicianResult(data: any): string {
  if (data.error) {
    return `[!] ${data.error}`;
  }
  
  const lines: string[] = ['[+] **Technician Scheduled**\n'];
  lines.push(`**Assigned:** ${data.assigned_technician}`);
  lines.push(`**Employee ID:** ${data.employee_id}`);
  if (data.skills) lines.push(`**Skills:** ${data.skills.join(', ')}`);
  if (data.hourly_rate) lines.push(`**Rate:** $${data.hourly_rate}/hour`);
  
  return lines.join('\n');
}

function formatPurchaseOrderResult(data: any): string {
  if (data.error) {
    return `[X] Failed to create PO: ${data.error}`;
  }
  
  const lines: string[] = ['[+] **Purchase Order Created**\n'];
  lines.push(`**PO Number:** ${data.po_number}`);
  lines.push(`**Vendor:** ${data.vendor}`);
  lines.push(`**Total:** $${Number(data.total).toLocaleString()}`);
  if (data.expected_delivery) lines.push(`**Expected Delivery:** ${data.expected_delivery}`);
  
  return lines.join('\n');
}

export function useAgriAssistant() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => crypto.randomUUID());
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (userInput: string) => {
    if (!userInput.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: userInput.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    abortControllerRef.current = new AbortController();

    try {
      // Use Historical Chatbot endpoint instead of Supabase
      const response = await fetch(`${API_URL}/api/chatbot/historical`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userInput.trim(),
          session_id: sessionId,
          context: null,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.content) {
        const assistantMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: data.content,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error('Invalid response format');
      }

    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        return;
      }
      console.error('Chat error:', error);
      toast.error('Failed to send message. Please try again.');
      
      setMessages(prev => prev.filter(m => m.role !== 'assistant' || m.content !== ''));
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [messages, isLoading, sessionId]);

  const cancelRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsLoading(false);
    }
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    isLoading,
    sendMessage,
    cancelRequest,
    clearMessages,
    sessionId,
  };
}

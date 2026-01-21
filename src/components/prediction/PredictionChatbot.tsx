import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquare, Send, Bot, User, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { PredictionResult, EquipmentType, SensorData, EQUIPMENT_CONFIG } from '@/types/equipment';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface PredictionChatbotProps {
  predictionResult: PredictionResult | null;
  equipmentType: EquipmentType;
  sensorData: SensorData;
}

// Format chatbot response for human-friendly output
function formatChatbotResponse(content: string): string {
  // Remove any raw JSON patterns
  const jsonPattern = /\{[\s\S]*?"[^"]+"\s*:[\s\S]*?\}/g;
  let formatted = content.replace(jsonPattern, (match) => {
    try {
      const parsed = JSON.parse(match);
      if (parsed.health_score !== undefined) {
        return `Health Score: ${parsed.health_score}%`;
      }
      return '';
    } catch {
      return match;
    }
  });
  
  // Replace technical terms with plain language
  formatted = formatted
    .replace(/operational/gi, '[*] Operational')
    .replace(/warning/gi, '[!] Warning')
    .replace(/critical/gi, '[X] Critical')
    .replace(/failure_/gi, '')
    .replace(/_/g, ' ');
  
  return formatted;
}

// Quick questions for users
const QUICK_QUESTIONS = [
  "What's wrong with my equipment?",
  "How urgent is this repair?",
  "What will it cost to fix?",
  "What should I do next?",
  "Can I keep using it safely?",
];

export function PredictionChatbot({ predictionResult, equipmentType, sensorData }: PredictionChatbotProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => crypto.randomUUID());
  const scrollRef = useRef<HTMLDivElement>(null);
  const config = EQUIPMENT_CONFIG[equipmentType];

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Generate initial context message when prediction changes
  useEffect(() => {
    if (predictionResult) {
      const contextMessage = generateContextMessage(predictionResult, equipmentType, sensorData);
      setMessages([{
        id: crypto.randomUUID(),
        role: 'assistant',
        content: contextMessage,
        timestamp: new Date(),
      }]);
    }
  }, [predictionResult, equipmentType, sensorData]);

  function generateContextMessage(result: PredictionResult, eqType: EquipmentType, sensors: SensorData): string {
    const equipName = EQUIPMENT_CONFIG[eqType].name;
    const statusSymbol = result.prediction === 'HEALTHY' ? '[*]' : result.prediction === 'WARNING' ? '[!]' : '[X]';
    
    let message = `**${statusSymbol} ${equipName} Analysis Complete**\n\n`;
    
    if (result.prediction === 'HEALTHY') {
      message += `Your ${equipName.toLowerCase()} is operating normally.\n\n`;
      message += `**Health Score:** ${(result.confidence * 100).toFixed(0)}%\n`;
      message += `**Status:** All sensors within normal range\n\n`;
      message += `[i] Continue regular operations and scheduled maintenance.\n\n`;
      message += `Ask me anything about your equipment or maintenance schedule.`;
    } else {
      message += `**Health Score:** ${(result.confidence * 100).toFixed(0)}%\n`;
      message += `**Urgency:** ${result.maintenance_urgency.toUpperCase()}\n`;
      message += `**Time to Failure:** ${result.time_to_failure}\n\n`;
      
      if (result.detected_failures.length > 0) {
        message += `**Issues Detected:**\n`;
        result.detected_failures.forEach((failure) => {
          const symbol = failure.issue === 'HIGH' ? '[X]' : '[!]';
          message += `${symbol} ${failure.message}\n`;
        });
        message += '\n';
      }
      
      if (result.cost_estimate) {
        message += `**Estimated Repair Cost:** $${result.cost_estimate.total_cost.toLocaleString()}\n\n`;
      }
      
      message += `[>] Ask me questions like:\n`;
      message += `- "What's causing this problem?"\n`;
      message += `- "How do I fix this?"\n`;
      message += `- "Is it safe to keep running?"`;
    }
    
    return message;
  }

  async function sendMessage(messageText: string) {
    if (!messageText.trim() || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Build context for the AI
      const predictionContext = predictionResult ? {
        equipment_type: equipmentType,
        equipment_name: config.name,
        prediction: predictionResult.prediction,
        confidence: predictionResult.confidence,
        failure_probability: predictionResult.failure_probability,
        time_to_failure: predictionResult.time_to_failure,
        maintenance_urgency: predictionResult.maintenance_urgency,
        detected_failures: predictionResult.detected_failures,
        cost_estimate: predictionResult.cost_estimate,
        sensor_readings: sensorData,
      } : null;

      const systemContext = `You are a helpful equipment maintenance assistant for Providentia. 
You are explaining a predictive maintenance analysis result to a farmer.

Current prediction context:
${JSON.stringify(predictionContext, null, 2)}

CRITICAL RULES:
1. NEVER show raw JSON or technical database fields
2. Use plain, farmer-friendly language
3. Use these symbols (NOT emojis):
   - [*] for healthy/good
   - [!] for warning
   - [X] for critical/urgent
   - [>] for recommended actions
   - [i] for information
4. Format numbers with commas (1,234 not 1234)
5. Always be helpful and suggest next steps
6. If asked about costs, give estimates based on the prediction data
7. Explain technical issues in simple terms

Answer the user's question concisely and helpfully.`;

      const { data, error } = await supabase.functions.invoke('agri-assistant', {
        body: {
          messages: [
            { role: 'system', content: systemContext },
            ...messages.map(m => ({ role: m.role, content: m.content })),
            { role: 'user', content: messageText },
          ],
          session_id: sessionId,
        },
      });

      let responseContent = '';

      if (error) {
        console.error('Chat error:', error);
        responseContent = generateLocalResponse(messageText, predictionResult, equipmentType, sensorData);
      } else if (data && typeof data === 'object' && 'error' in data) {
        responseContent = generateLocalResponse(messageText, predictionResult, equipmentType, sensorData);
      } else {
        // Handle streaming response
        if (data instanceof ReadableStream) {
          const reader = data.getReader();
          const decoder = new TextDecoder();
          
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const jsonStr = line.slice(6);
                if (jsonStr === '[DONE]') continue;
                
                try {
                  const parsed = JSON.parse(jsonStr);
                  const content = parsed.choices?.[0]?.delta?.content;
                  if (content) {
                    responseContent += content;
                  }
                } catch {
                  // Ignore parse errors for partial JSON
                }
              }
            }
          }
        } else {
          responseContent = generateLocalResponse(messageText, predictionResult, equipmentType, sensorData);
        }
      }

      const formattedResponse = formatChatbotResponse(responseContent || generateLocalResponse(messageText, predictionResult, equipmentType, sensorData));

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: formattedResponse,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      console.error('Chat error:', err);
      const fallbackResponse = generateLocalResponse(messageText, predictionResult, equipmentType, sensorData);
      
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: fallbackResponse,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } finally {
      setIsLoading(false);
    }
  }

  function generateLocalResponse(question: string, result: PredictionResult | null, eqType: EquipmentType, sensors: SensorData): string {
    const q = question.toLowerCase();
    const equipName = EQUIPMENT_CONFIG[eqType].name;
    
    if (!result) {
      return `[i] Please run a prediction first to get analysis of your ${equipName.toLowerCase()}. Click "Run Prediction" above to start.`;
    }

    // What's wrong questions
    if (q.includes("what's wrong") || q.includes("whats wrong") || q.includes("problem") || q.includes("issue")) {
      if (result.prediction === 'HEALTHY') {
        return `[*] **Good News!**\n\nYour ${equipName.toLowerCase()} is operating normally. All sensor readings are within acceptable ranges.\n\n[i] No immediate action required. Continue with regular maintenance schedule.`;
      }
      
      let response = `[${result.prediction === 'WARNING' ? '!' : 'X'}] **Issues Found:**\n\n`;
      result.detected_failures.forEach((failure) => {
        response += `**${failure.sensor.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:**\n`;
        response += `Current: ${failure.value} | Normal: ${failure.normal_range}\n`;
        response += `[>] ${failure.message}\n\n`;
      });
      
      return response;
    }

    // Urgency questions
    if (q.includes('urgent') || q.includes('hurry') || q.includes('how soon') || q.includes('quickly')) {
      const urgencyMap: Record<string, string> = {
        critical: '[X] **CRITICAL - Act Now**\n\nYou should stop using this equipment immediately and schedule emergency maintenance today. Continued use risks complete breakdown and safety hazards.',
        high: '[!] **HIGH URGENCY**\n\nSchedule maintenance within 1-3 days. Monitor closely and reduce workload if possible.',
        medium: '[!] **MEDIUM URGENCY**\n\nSchedule maintenance within 1-2 weeks. Equipment can still operate but should be monitored.',
        low: '[*] **LOW URGENCY**\n\nInclude in next scheduled maintenance. No immediate action required.',
      };
      
      return urgencyMap[result.maintenance_urgency] + `\n\n**Time to potential failure:** ${result.time_to_failure}`;
    }

    // Cost questions
    if (q.includes('cost') || q.includes('price') || q.includes('expensive') || q.includes('money') || q.includes('pay')) {
      if (!result.cost_estimate) {
        return `[i] Based on the detected issues, estimated repair cost is around $${Math.round((1 - result.confidence) * 2500)}.\n\n**Note:** Actual costs may vary based on parts availability and labor rates in your area.`;
      }
      
      return `**Repair Cost Estimate:**\n\n` +
        `[>] Labor: ${result.cost_estimate.labor_hours} hours\n` +
        `[>] Parts: $${result.cost_estimate.parts_cost.toLocaleString()}\n` +
        `[>] **Total: $${result.cost_estimate.total_cost.toLocaleString()}**\n\n` +
        `${result.cost_estimate.description}\n\n` +
        `[!] **Compare:** Emergency repair after failure could cost 2-3x more ($${(result.cost_estimate.total_cost * 2.5).toLocaleString()}).`;
    }

    // Safety questions
    if (q.includes('safe') || q.includes('keep using') || q.includes('continue') || q.includes('still use')) {
      if (result.prediction === 'HEALTHY') {
        return `[*] **Yes, Safe to Use**\n\nYour equipment is operating within normal parameters. Continue regular operations with standard safety precautions.`;
      } else if (result.maintenance_urgency === 'critical') {
        return `[X] **NOT RECOMMENDED**\n\nContinued use poses safety risks and may cause:\n` +
          `- Complete equipment failure\n` +
          `- Damage to other components\n` +
          `- Potential safety hazards\n\n` +
          `[>] Stop operation and arrange immediate maintenance.`;
      } else {
        return `[!] **Use with Caution**\n\nYou can continue limited operation but:\n` +
          `- Reduce workload by 30-50%\n` +
          `- Monitor readings more frequently\n` +
          `- Schedule maintenance soon\n\n` +
          `**Time until recommended service:** ${result.time_to_failure}`;
      }
    }

    // What to do questions
    if (q.includes('what should') || q.includes('next step') || q.includes('recommend') || q.includes('do next') || q.includes('fix')) {
      if (result.prediction === 'HEALTHY') {
        return `[*] **Recommended Actions:**\n\n` +
          `1. Continue regular operations\n` +
          `2. Follow scheduled maintenance plan\n` +
          `3. Run prediction again in 30 days\n\n` +
          `[i] Your ${equipName.toLowerCase()} is in good condition!`;
      }
      
      let steps = `[>] **Recommended Actions:**\n\n`;
      
      if (result.maintenance_urgency === 'critical') {
        steps += `1. **STOP** using equipment immediately\n`;
        steps += `2. Create emergency work order\n`;
        steps += `3. Check parts availability\n`;
        steps += `4. Schedule technician today\n`;
      } else if (result.maintenance_urgency === 'high') {
        steps += `1. Reduce equipment workload\n`;
        steps += `2. Create maintenance work order\n`;
        steps += `3. Order replacement parts\n`;
        steps += `4. Schedule service within 3 days\n`;
      } else {
        steps += `1. Continue monitoring readings\n`;
        steps += `2. Schedule preventive maintenance\n`;
        steps += `3. Check parts inventory\n`;
        steps += `4. Plan service for next 1-2 weeks\n`;
      }
      
      steps += `\n[i] Estimated repair time: ${result.cost_estimate?.labor_hours || 2}-${(result.cost_estimate?.labor_hours || 2) + 2} hours`;
      
      return steps;
    }

    // Cause questions
    if (q.includes('cause') || q.includes('why') || q.includes('reason') || q.includes('happening')) {
      if (result.prediction === 'HEALTHY') {
        return `[*] No issues detected. Your ${equipName.toLowerCase()} is operating normally.`;
      }
      
      let response = `**Likely Causes:**\n\n`;
      
      result.detected_failures.forEach((failure) => {
        if (failure.issue === 'HIGH') {
          response += `[X] **High ${failure.sensor.replace(/_/g, ' ')}:**\n`;
          response += `- Possible wear or damage\n`;
          response += `- May indicate component reaching end of life\n`;
          response += `- Could be caused by overload or harsh conditions\n\n`;
        } else {
          response += `[!] **Low ${failure.sensor.replace(/_/g, ' ')}:**\n`;
          response += `- Possible blockage or restriction\n`;
          response += `- May indicate leak or seal failure\n`;
          response += `- Could be worn components reducing efficiency\n\n`;
        }
      });
      
      response += `[i] A technician inspection will confirm the exact cause.`;
      
      return response;
    }

    // Default helpful response
    return `[i] I'm here to help explain your ${equipName.toLowerCase()} analysis.\n\n` +
      `**You can ask me:**\n` +
      `- "What's wrong with my equipment?"\n` +
      `- "How urgent is this?"\n` +
      `- "What will it cost to fix?"\n` +
      `- "Is it safe to keep using?"\n` +
      `- "What should I do next?"\n\n` +
      `Current status: ${result.prediction === 'HEALTHY' ? '[*] Healthy' : result.prediction === 'WARNING' ? '[!] Needs Attention' : '[X] Critical'}`;
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Equipment Analysis Chat
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
            Online
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Messages Area */}
        <ScrollArea className="h-[350px] pr-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.length === 0 && !predictionResult && (
              <div className="text-center py-8 text-muted-foreground">
                <Bot className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">Run a prediction to start the conversation</p>
                <p className="text-xs mt-1">I'll explain what's happening with your equipment</p>
              </div>
            )}
            
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3",
                  message.role === 'user' ? "justify-end" : "justify-start"
                )}
              >
                {message.role === 'assistant' && (
                  <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[85%] rounded-lg px-4 py-3 text-sm",
                    message.role === 'user'
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  )}
                >
                  <div className="whitespace-pre-wrap">{message.content}</div>
                  <div className={cn(
                    "text-[10px] mt-1.5",
                    message.role === 'user' ? "text-primary-foreground/70" : "text-muted-foreground"
                  )}>
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>
                {message.role === 'user' && (
                  <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            ))}
            
            {isLoading && (
              <div className="flex gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div className="bg-muted rounded-lg px-4 py-3">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Quick Questions */}
        {predictionResult && messages.length <= 2 && (
          <div className="flex flex-wrap gap-2">
            {QUICK_QUESTIONS.map((question) => (
              <Button
                key={question}
                variant="outline"
                size="sm"
                className="text-xs h-7"
                onClick={() => sendMessage(question)}
                disabled={isLoading}
              >
                {question}
              </Button>
            ))}
          </div>
        )}

        {/* Input Area */}
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about your equipment..."
            disabled={isLoading || !predictionResult}
            className="flex-1"
          />
          <Button
            onClick={() => sendMessage(input)}
            disabled={isLoading || !input.trim() || !predictionResult}
            size="icon"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

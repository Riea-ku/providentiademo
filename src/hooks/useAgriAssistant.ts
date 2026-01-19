import { useState, useCallback, useRef } from 'react';
import { ChatMessage } from '@/types/enterprise';
import { toast } from 'sonner';

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/agri-assistant`;

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

    // Create abort controller for this request
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content,
          })),
          session_id: sessionId,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        if (response.status === 429) {
          toast.error('Rate limit exceeded. Please wait a moment and try again.');
          throw new Error('Rate limit exceeded');
        }
        if (response.status === 402) {
          toast.error('AI credits exhausted. Please add funds to continue.');
          throw new Error('Credits exhausted');
        }
        throw new Error(`Request failed: ${response.status}`);
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      // Stream the response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';
      let toolCalls: any[] = [];

      // Add placeholder assistant message
      const assistantId = crypto.randomUUID();
      setMessages(prev => [
        ...prev,
        {
          id: assistantId,
          role: 'assistant',
          content: '',
          timestamp: new Date(),
        },
      ]);

      let textBuffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });

        // Process line by line
        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed.choices?.[0]?.delta;

            if (delta?.content) {
              assistantContent += delta.content;
              setMessages(prev =>
                prev.map(m =>
                  m.id === assistantId ? { ...m, content: assistantContent } : m
                )
              );
            }

            // Handle tool calls
            if (delta?.tool_calls) {
              for (const tc of delta.tool_calls) {
                if (tc.index !== undefined) {
                  if (!toolCalls[tc.index]) {
                    toolCalls[tc.index] = {
                      id: tc.id || '',
                      type: 'function',
                      function: { name: '', arguments: '' },
                    };
                  }
                  if (tc.id) toolCalls[tc.index].id = tc.id;
                  if (tc.function?.name) {
                    toolCalls[tc.index].function.name = tc.function.name;
                  }
                  if (tc.function?.arguments) {
                    toolCalls[tc.index].function.arguments += tc.function.arguments;
                  }
                }
              }
            }
          } catch {
            // Incomplete JSON, put back and wait for more
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }

      // If there were tool calls, execute them and continue
      if (toolCalls.length > 0) {
        const toolResponse = await fetch(CHAT_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            execute_tools: toolCalls,
          }),
        });

        if (toolResponse.ok) {
          const toolResults = await toolResponse.json();
          
          // Format tool results as readable text
          const resultsText = toolCalls.map((tc, i) => {
            const result = toolResults.tool_results?.[i]?.result;
            return `**${tc.function.name}**: ${JSON.stringify(result, null, 2)}`;
          }).join('\n\n');

          // Append tool results to assistant message
          if (resultsText) {
            assistantContent += `\n\n📊 **Action Results:**\n${resultsText}`;
            setMessages(prev =>
              prev.map(m =>
                m.id === assistantId
                  ? { ...m, content: assistantContent, tool_calls: toolCalls }
                  : m
              )
            );
          }
        }
      }

      // Finalize the message
      setMessages(prev =>
        prev.map(m =>
          m.id === assistantId
            ? { ...m, content: assistantContent || 'I processed your request.', tool_calls: toolCalls.length > 0 ? toolCalls : undefined }
            : m
        )
      );

    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        return;
      }
      console.error('Chat error:', error);
      toast.error('Failed to send message. Please try again.');
      
      // Remove the failed message placeholder
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

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { MessageSquare, Send, Loader2, FileText, ExternalLink } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

const API_URL = import.meta.env.VITE_BACKEND_URL;

interface Message {
  role: 'user' | 'assistant';
  content: string;
  citations?: Array<{ report_id: string; title: string; type: string }>;
  historical_references?: Array<{ report_id: string; title: string; relevance: number }>;
  timestamp: Date;
}

interface HistoricalChatProps {
  sessionId?: string;
  initialContext?: any;
  onCitationClick?: (reportId: string) => void;
}

export function HistoricalChat({
  sessionId: providedSessionId,
  initialContext,
  onCitationClick,
}: HistoricalChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(providedSessionId || uuidv4());
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/chatbot/historical`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          session_id: sessionId,
          context: initialContext,
        }),
      });

      const data = await response.json();

      if (data.success) {
        const assistantMessage: Message = {
          role: 'assistant',
          content: data.content,
          citations: data.citations,
          historical_references: data.historical_references,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        throw new Error(data.error || 'Failed to get response');
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="flex flex-col h-[600px]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Historical AI Assistant
          <Badge variant="outline" className="ml-auto">
            Session: {sessionId.slice(0, 8)}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col overflow-hidden p-0">
        <ScrollArea className="flex-1 px-4" ref={scrollRef}>
          <div className="space-y-4 py-4">
            {messages.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Ask me anything about historical reports and system data</p>
                <p className="text-xs mt-2">I have access to all historical reports and can provide insights</p>
              </div>
            )}

            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>

                  {message.citations && message.citations.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-border/50">
                      <p className="text-xs font-medium mb-2">Citations:</p>
                      {message.citations.map((citation, idx) => (
                        <button
                          key={idx}
                          onClick={() => onCitationClick?.(citation.report_id)}
                          className="flex items-center gap-1 text-xs text-blue-600 hover:underline mb-1"
                        >
                          <FileText className="h-3 w-3" />
                          {citation.title}
                        </button>
                      ))}
                    </div>
                  )}

                  {message.historical_references && message.historical_references.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-border/50">
                      <p className="text-xs font-medium mb-2">Related Reports:</p>
                      {message.historical_references.map((ref, idx) => (
                        <button
                          key={idx}
                          onClick={() => onCitationClick?.(ref.report_id)}
                          className="flex items-center justify-between gap-2 text-xs mb-1 w-full"
                        >
                          <span className="truncate">{ref.title}</span>
                          <Badge variant="outline" className="text-xs">
                            {(ref.relevance * 100).toFixed(0)}%
                          </Badge>
                        </button>
                      ))}
                    </div>
                  )}

                  <p className="text-xs opacity-50 mt-2">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg p-3">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <Separator />

        <div className="p-4">
          <div className="flex gap-2">
            <Input
              placeholder="Ask about historical reports, patterns, or insights..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              disabled={loading}
            />
            <Button onClick={sendMessage} disabled={loading || !input.trim()}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

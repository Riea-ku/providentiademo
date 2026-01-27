import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Send,
  Bot,
  User,
  FileText,
  Calendar,
  TrendingUp,
  Loader2,
  ExternalLink
} from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  citations?: any[];
  historical_references?: any;
  timestamp: Date;
}

interface HistoricalChatProps {
  initialContext?: any;
  sessionId?: string;
  onCitationClick?: (citation: any) => void;
}

const HistoricalChat: React.FC<HistoricalChatProps> = ({ 
  initialContext, 
  sessionId = `session-${Date.now()}`,
  onCitationClick 
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCitations, setShowCitations] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const backend_url = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8001';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || loading) return;

    const userMessage: Message = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setLoading(true);

    try {
      const response = await fetch(`${backend_url}/api/historical/chatbot/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: inputMessage,
          session_id: sessionId,
          context: initialContext
        })
      });

      const data = await response.json();

      if (data.success) {
        const aiMessage: Message = {
          role: 'assistant',
          content: data.content,
          citations: data.citations || [],
          historical_references: data.historical_references,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, aiMessage]);
      } else {
        throw new Error(data.error || 'Failed to get response');
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: 'I apologize, but I encountered an error. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getCitationIcon = (type: string) => {
    switch (type) {
      case 'report':
        return <FileText className="w-3 h-3" />;
      case 'event':
        return <Calendar className="w-3 h-3" />;
      default:
        return <TrendingUp className="w-3 h-3" />;
    }
  };

  return (
    <Card className="flex flex-col h-[600px]">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-primary" />
            Historical AI Assistant
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {messages.length} messages
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCitations(!showCitations)}
            >
              {showCitations ? 'Hide' : 'Show'} Citations
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Bot className="w-16 h-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Ask About Historical Data</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              I can help you understand patterns, find relevant reports, and provide insights 
              based on historical data. Try asking about failures, equipment, or trends.
            </p>
            <div className="mt-4 space-y-2 text-xs text-muted-foreground">
              <p>💡 Example: "What patterns do you see in bearing failures?"</p>
              <p>💡 Example: "Show me reports about pump-001"</p>
              <p>💡 Example: "What was the most expensive failure?"</p>
            </div>
          </div>
        )}

        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {message.role === 'assistant' && (
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-primary" />
                </div>
              </div>
            )}

            <div className={`flex-1 max-w-[80%] ${message.role === 'user' ? 'order-first' : ''}`}>
              <div
                className={`p-3 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground ml-auto'
                    : 'bg-muted'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                
                {/* Historical References Badge */}
                {message.role === 'assistant' && message.historical_references && (
                  <div className="mt-2 pt-2 border-t border-border/50">
                    <div className="flex flex-wrap gap-1 text-xs">
                      {message.historical_references.reports_used > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          <FileText className="w-3 h-3 mr-1" />
                          {message.historical_references.reports_used} reports
                        </Badge>
                      )}
                      {message.historical_references.events_used > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          <Calendar className="w-3 h-3 mr-1" />
                          {message.historical_references.events_used} events
                        </Badge>
                      )}
                      {message.historical_references.patterns_analyzed && (
                        <Badge variant="secondary" className="text-xs">
                          <TrendingUp className="w-3 h-3 mr-1" />
                          Patterns analyzed
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Citations */}
              {message.role === 'assistant' && 
               showCitations && 
               message.citations && 
               message.citations.length > 0 && (
                <div className="mt-2 space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground mb-1">Sources:</p>
                  {message.citations.map((citation, cidx) => (
                    <div
                      key={cidx}
                      className="text-xs p-2 rounded bg-muted/50 border border-border hover:bg-muted transition-colors cursor-pointer"
                      onClick={() => onCitationClick && onCitationClick(citation)}
                    >
                      <div className="flex items-center gap-2">
                        {getCitationIcon(citation.type)}
                        <span className="font-medium">
                          {citation.type === 'report' 
                            ? citation.title 
                            : `${citation.event_type} event`}
                        </span>
                        {citation.relevance_score && (
                          <Badge variant="outline" className="text-xs ml-auto">
                            {citation.relevance_score.toFixed(1)}
                          </Badge>
                        )}
                      </div>
                      {citation.summary && (
                        <p className="text-muted-foreground mt-1 line-clamp-1">
                          {citation.summary}
                        </p>
                      )}
                      {citation.timestamp && (
                        <p className="text-muted-foreground mt-1">
                          {new Date(citation.timestamp).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <p className="text-xs text-muted-foreground mt-1">
                {message.timestamp.toLocaleTimeString()}
              </p>
            </div>

            {message.role === 'user' && (
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                  <User className="w-5 h-5 text-primary-foreground" />
                </div>
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 justify-start">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Bot className="w-5 h-5 text-primary" />
              </div>
            </div>
            <div className="flex-1 max-w-[80%]">
              <div className="p-3 rounded-lg bg-muted">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <p className="text-sm text-muted-foreground">Analyzing historical data...</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </CardContent>

      <div className="border-t p-4">
        <div className="flex gap-2">
          <Input
            placeholder="Ask about historical data, patterns, or specific reports..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={loading}
          />
          <Button onClick={sendMessage} disabled={loading || !inputMessage.trim()}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default HistoricalChat;

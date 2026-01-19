import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Trash2, Sparkles, Bot, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAgriAssistant } from '@/hooks/useAgriAssistant';
import { QUICK_ACTIONS } from '@/types/enterprise';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';

export function AgriChatbot() {
  const { messages, isLoading, sendMessage, clearMessages } = useAgriAssistant();
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      sendMessage(input);
      setInput('');
    }
  };

  const handleQuickAction = (prompt: string) => {
    if (!isLoading) {
      sendMessage(prompt);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="flex flex-col h-full bg-card rounded-xl border border-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Bot className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="font-semibold text-foreground">AgriProvidentia AI</h2>
            <p className="text-xs text-muted-foreground">Your intelligent farm assistant</p>
          </div>
        </div>
        {messages.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearMessages}
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="space-y-6">
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Welcome to AgriProvidentia AI
              </h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                I'm your intelligent farm assistant. Ask me about equipment health, maintenance, 
                inventory, work orders, or anything else about your farm operations.
              </p>
            </div>

            {/* Quick Actions Grid */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-muted-foreground text-center">Quick Actions</p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                {QUICK_ACTIONS.map((action) => (
                  <button
                    key={action.id}
                    onClick={() => handleQuickAction(action.prompt)}
                    className="flex flex-col items-center gap-2 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-transparent hover:border-primary/20"
                    disabled={isLoading}
                  >
                    <span className="text-2xl">{action.icon}</span>
                    <span className="text-xs font-medium text-foreground text-center">{action.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Example Prompts */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground text-center">Try asking:</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {[
                  "Check tractor T-789 and tell me if it needs maintenance",
                  "Show me all critical equipment issues",
                  "Create a work order for solar pump SP-001",
                  "What parts are low in stock?",
                ].map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => handleQuickAction(prompt)}
                    className="text-xs px-3 py-1.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                    disabled={isLoading}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'flex gap-3',
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-primary-foreground" />
                  </div>
                )}
                <div
                  className={cn(
                    'max-w-[80%] rounded-xl px-4 py-3',
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-foreground'
                  )}
                >
                  {message.role === 'assistant' ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown
                        components={{
                          pre: ({ children }) => (
                            <pre className="bg-background/50 rounded-lg p-3 overflow-x-auto text-xs">
                              {children}
                            </pre>
                          ),
                          code: ({ children }) => (
                            <code className="bg-background/50 rounded px-1 py-0.5 text-xs">
                              {children}
                            </code>
                          ),
                        }}
                      >
                        {message.content || '...'}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  )}
                  <p className="text-[10px] opacity-60 mt-1">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                {message.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-secondary-foreground" />
                  </div>
                )}
              </div>
            ))}
            {isLoading && messages[messages.length - 1]?.role === 'user' && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-primary-foreground" />
                </div>
                <div className="bg-muted rounded-xl px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-border bg-muted/30">
        <div className="flex gap-2">
          <Textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me about your equipment, maintenance, inventory..."
            className="min-h-[44px] max-h-32 resize-none bg-background"
            disabled={isLoading}
          />
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || isLoading}
            className="h-11 w-11 flex-shrink-0"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-2 text-center">
          © 2026 AgriProvidentia Technologies • Press Enter to send, Shift+Enter for new line
        </p>
      </form>
    </div>
  );
}

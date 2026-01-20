import React, { useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/dashboard/Header';
import { EnterpriseDashboard } from '@/components/dashboard/EnterpriseDashboard';
import { AgriChatbot } from '@/components/chat/AgriChatbot';
import { MessageSquare, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Index = () => {
  const [activeView, setActiveView] = useState<'dashboard' | 'chat'>('chat');

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 ml-16 md:ml-64">
        <Header />
        
        {/* View Toggle */}
        <div className="px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Button
              variant={activeView === 'chat' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveView('chat')}
              className="gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              AI Assistant
            </Button>
            <Button
              variant={activeView === 'dashboard' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveView('dashboard')}
              className="gap-2"
            >
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </Button>
          </div>
        </div>

        <div className="p-6">
          {activeView === 'chat' ? (
            <div className="h-[calc(100vh-200px)]">
              <AgriChatbot />
            </div>
          ) : (
            <EnterpriseDashboard />
          )}
        </div>

        {/* Footer */}
        <footer className="px-6 py-4 border-t border-border text-center text-xs text-muted-foreground">
          [C] 2026 Providentia Technologies | Providentia Enterprise Platform v3.0
        </footer>
      </main>
    </div>
  );
};

export default Index;

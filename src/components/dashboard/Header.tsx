import { Activity, Bell, Settings, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface HeaderProps {
  alertCount?: number;
}

export function Header({ alertCount = 0 }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between px-4 md:px-8">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Activity className="h-8 w-8 text-primary animate-pulse-glow" />
            <div className="absolute -inset-1 bg-primary/20 blur-lg rounded-full" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-bold tracking-wider bg-gradient-to-r from-primary via-foreground to-primary bg-clip-text text-transparent">
              PROVIDENTIA
            </h1>
            <span className="text-[10px] tracking-[0.2em] text-muted-foreground uppercase">
              Predictive Maintenance
            </span>
          </div>
        </div>
        
        {/* Search */}
        <div className="hidden md:flex relative max-w-md flex-1 mx-8">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search equipment, farms..."
            className="pl-10 bg-secondary/50 border-border/50 focus:bg-secondary"
          />
        </div>
        
        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            {alertCount > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
              >
                {alertCount > 9 ? '9+' : alertCount}
              </Badge>
            )}
          </Button>
          <Button variant="ghost" size="icon">
            <Settings className="h-5 w-5" />
          </Button>
          <div className="hidden md:flex items-center gap-2 ml-2 pl-4 border-l border-border/50">
            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-sm font-semibold text-primary">FM</span>
            </div>
            <span className="text-sm font-medium">Farm Manager</span>
          </div>
        </div>
      </div>
    </header>
  );
}
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Activity,
  LayoutDashboard,
  Tractor,
  Building2,
  Wrench,
  Package,
  BarChart3,
  MessageSquare,
  FileText,
  Settings,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Brain,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface NavItem {
  title: string;
  icon: React.ReactNode;
  href: string;
  badge?: number;
}

const mainNavItems: NavItem[] = [
  { title: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5" />, href: '/' },
  { title: 'Predictions', icon: <Activity className="h-5 w-5" />, href: '/predictions' },
  { title: 'AI Analytics', icon: <Brain className="h-5 w-5" />, href: '/analytics-enhanced' },
  { title: 'AI Simulation', icon: <Brain className="h-5 w-5" />, href: '/ai-analytics-simulation' },
  { title: 'Historical Intel', icon: <History className="h-5 w-5" />, href: '/historical-intelligence' },
  { title: 'Report History', icon: <FileText className="h-5 w-5" />, href: '/report-history' },
  { title: 'Equipment', icon: <Tractor className="h-5 w-5" />, href: '/equipment' },
  { title: 'Farms', icon: <Building2 className="h-5 w-5" />, href: '/farms' },
  { title: 'Work Orders', icon: <Wrench className="h-5 w-5" />, href: '/work-orders', badge: 8 },
  { title: 'Inventory', icon: <Package className="h-5 w-5" />, href: '/inventory' },
  { title: 'Analytics', icon: <BarChart3 className="h-5 w-5" />, href: '/analytics' },
];

const secondaryNavItems: NavItem[] = [
  { title: 'Chatbot', icon: <MessageSquare className="h-5 w-5" />, href: '/chatbot' },
  { title: 'Reports', icon: <FileText className="h-5 w-5" />, href: '/reports' },
  { title: 'Settings', icon: <Settings className="h-5 w-5" />, href: '/settings' },
  { title: 'Help', icon: <HelpCircle className="h-5 w-5" />, href: '/help' },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  
  const NavLink = ({ item }: { item: NavItem }) => {
    const isActive = location.pathname === item.href;
    
    const content = (
      <Link
        to={item.href}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
          "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
          isActive && "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg shadow-primary/20",
          !isActive && "text-sidebar-foreground/70"
        )}
      >
        {item.icon}
        {!collapsed && (
          <>
            <span className="flex-1 text-sm font-medium">{item.title}</span>
            {item.badge && (
              <span className="h-5 min-w-5 px-1.5 rounded-full bg-destructive text-destructive-foreground text-xs font-medium flex items-center justify-center">
                {item.badge}
              </span>
            )}
          </>
        )}
      </Link>
    );
    
    if (collapsed) {
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent side="right" className="flex items-center gap-2">
            {item.title}
            {item.badge && (
              <span className="h-5 min-w-5 px-1.5 rounded-full bg-destructive text-destructive-foreground text-xs font-medium flex items-center justify-center">
                {item.badge}
              </span>
            )}
          </TooltipContent>
        </Tooltip>
      );
    }
    
    return content;
  };
  
  return (
    <aside className={cn(
      "sticky top-0 h-screen border-r border-sidebar-border bg-sidebar flex flex-col transition-all duration-300",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Header */}
      <div className={cn(
        "h-16 border-b border-sidebar-border flex items-center px-4",
        collapsed ? "justify-center" : "justify-between"
      )}>
        {!collapsed && (
          <div className="flex items-center gap-2">
            <Activity className="h-6 w-6 text-sidebar-primary" />
            <span className="font-bold text-sidebar-foreground tracking-wide">PROVIDENTIA</span>
          </div>
        )}
        {collapsed && <Activity className="h-6 w-6 text-sidebar-primary" />}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "h-8 w-8 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent",
            collapsed && "absolute -right-3 top-5 rounded-full border border-sidebar-border bg-sidebar shadow-lg"
          )}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {!collapsed && (
          <p className="px-3 text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider mb-3">
            Main Menu
          </p>
        )}
        {mainNavItems.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}
        
        {!collapsed && (
          <p className="px-3 pt-6 text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider mb-3">
            Support
          </p>
        )}
        {collapsed && <div className="h-4" />}
        {secondaryNavItems.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}
      </nav>
      
      {/* Footer */}
      <div className={cn(
        "p-3 border-t border-sidebar-border",
        collapsed && "flex justify-center"
      )}>
        {!collapsed ? (
          <div className="px-3 py-2 rounded-lg bg-sidebar-accent/50">
            <p className="text-xs text-sidebar-foreground/70">Enterprise Edition</p>
            <p className="text-sm font-semibold text-sidebar-foreground">v2.1.0</p>
          </div>
        ) : (
          <div className="h-8 w-8 rounded-full bg-sidebar-accent/50 flex items-center justify-center text-xs font-bold text-sidebar-foreground">
            2.1
          </div>
        )}
      </div>
    </aside>
  );
}
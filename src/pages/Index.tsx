import { Header } from '@/components/dashboard/Header';
import { QuickStats } from '@/components/dashboard/QuickStats';
import { SystemStatus } from '@/components/dashboard/SystemStatus';
import { PredictionPanel } from '@/components/prediction/PredictionPanel';
import { EquipmentOverview } from '@/components/dashboard/EquipmentOverview';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { EquipmentHealthChart } from '@/components/charts/EquipmentHealthChart';
import { PredictionTrendChart } from '@/components/charts/PredictionTrend';
import { Sidebar } from '@/components/Sidebar';

const Index = () => {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      
      <main className="flex-1 overflow-x-hidden">
        <Header alertCount={6} />
        
        <div className="container py-6 px-4 md:px-8 space-y-6">
          {/* Hero Section */}
          <div className="text-center mb-8 animate-fade-in">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-3">
              <span className="bg-gradient-to-r from-primary via-foreground to-primary bg-clip-text text-transparent">
                AgriProvidentia
              </span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Royal Agricultural Intelligence • Predictive Maintenance Sovereignty • Elite Equipment Oversight
            </p>
          </div>
          
          {/* Stats Row */}
          <QuickStats />
          
          {/* System Status */}
          <SystemStatus />
          
          {/* Prediction Panel */}
          <section className="animate-fade-in" style={{ animationDelay: '200ms' }}>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              Equipment Prediction
            </h2>
            <PredictionPanel />
          </section>
          
          {/* Charts and Equipment Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in" style={{ animationDelay: '300ms' }}>
            <div className="lg:col-span-2 space-y-6">
              <PredictionTrendChart />
              <EquipmentOverview />
            </div>
            <div className="space-y-6">
              <EquipmentHealthChart />
              <RecentActivity />
            </div>
          </div>
          
          {/* Footer */}
          <footer className="pt-8 pb-4 text-center text-sm text-muted-foreground border-t border-border/30">
            <p>
              © 2024 AgriProvidentia Enterprise • Predictive Maintenance AI System
            </p>
            <p className="mt-1 text-xs">
              Powered by Machine Learning • Real-time Sensor Analytics • Smart Agriculture
            </p>
          </footer>
        </div>
      </main>
    </div>
  );
};

export default Index;
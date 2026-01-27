import React, { useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/dashboard/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AICreationDialog } from '@/components/ai/AICreationDialog';
import { Tractor, Building2, Wrench, Package, Sparkles, Plus } from 'lucide-react';

const AICreationDemo = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<{ type: string; subtype?: string } | null>(null);
  const [createdItems, setCreatedItems] = useState<any[]>([]);

  const handleAddClick = (entityType: string, subtype?: string) => {
    setSelectedEntity({ type: entityType, subtype });
    setDialogOpen(true);
  };

  const handleComplete = (data: any) => {
    setCreatedItems(prev => [...prev, data]);
  };

  const features = [
    {
      icon: <Building2 className="h-8 w-8 text-blue-600" />,
      title: 'Add Farm',
      description: 'AI asks about farm type, size, crops, and creates it for you',
      entityType: 'farms',
      examples: ['Crop Farm', 'Livestock Farm', 'Mixed Farm']
    },
    {
      icon: <Tractor className="h-8 w-8 text-green-600" />,
      title: 'Add Equipment',
      description: 'Describe your equipment and AI handles all the details',
      entityType: 'equipment',
      examples: ['Tractor', 'Solar Pump', 'Irrigation System']
    },
    {
      icon: <Wrench className="h-8 w-8 text-orange-600" />,
      title: 'Create Work Order',
      description: 'Tell AI about the issue, it creates and assigns automatically',
      entityType: 'work_orders',
      examples: ['Emergency Repair', 'Preventive Maintenance', 'Predictive']
    },
    {
      icon: <Package className="h-8 w-8 text-purple-600" />,
      title: 'Add Inventory',
      description: 'AI asks about parts, tools, or consumables and sets reorder points',
      entityType: 'inventory',
      examples: ['Spare Parts', 'Tools', 'Consumables']
    }
  ];

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="AI Conversational Creation" />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Hero */}
            <Card className="border-2 border-teal-400 bg-gradient-to-br from-teal-600 to-teal-800 dark:from-teal-700 dark:to-teal-900 text-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl text-white">
                  <Sparkles className="h-6 w-6 text-teal-200" />
                  No More Forms - Just Conversations
                </CardTitle>
                <CardDescription className="text-base text-teal-100">
                  Click any "Add" button below and have a natural conversation with AI. 
                  It asks intelligent questions, suggests optimal configurations, and creates everything automatically.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Features */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {features.map((feature) => (
                <Card key={feature.title} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      {feature.icon}
                      <div className="flex-1">
                        <CardTitle className="text-lg">{feature.title}</CardTitle>
                        <CardDescription className="text-sm mt-1">
                          {feature.description}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <p className="text-xs text-muted-foreground font-medium">Examples:</p>
                      <div className="flex flex-wrap gap-2">
                        {feature.examples.map((example) => (
                          <Button
                            key={example}
                            variant="outline"
                            size="sm"
                            onClick={() => handleAddClick(feature.entityType)}
                            className="text-xs"
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            {example}
                          </Button>
                        ))}
                      </div>
                      <Button
                        className="w-full mt-4"
                        onClick={() => handleAddClick(feature.entityType)}
                      >
                        <Sparkles className="h-4 w-4 mr-2" />
                        Start AI Conversation
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Created Items */}
            {createdItems.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Recently Created ({createdItems.length})</CardTitle>
                  <CardDescription>Items created through AI conversations</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {createdItems.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{item.name || item.title || 'New Item'}</p>
                          <p className="text-xs text-muted-foreground">
                            ID: {item.id?.slice(0, 8)} • Created just now
                          </p>
                        </div>
                        <Button variant="ghost" size="sm">View</Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>

      {selectedEntity && (
        <AICreationDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          entityType={selectedEntity.type}
          subtype={selectedEntity.subtype}
          onComplete={handleComplete}
        />
      )}
    </div>
  );
};

export default AICreationDemo;

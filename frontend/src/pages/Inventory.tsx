import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/dashboard/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { 
  Package, 
  AlertTriangle, 
  TrendingDown, 
  Search,
  Plus,
  RefreshCw,
  MessageSquare,
  Send,
  Loader2,
  BarChart3,
  ShoppingCart
} from 'lucide-react';

interface InventoryItem {
  id: string;
  name: string;
  part_number: string;
  category: string | null;
  quantity_on_hand: number;
  quantity_reserved: number;
  quantity_available: number | null;
  reorder_point: number;
  unit_cost: number | null;
  location_bin: string | null;
  barcode: string | null;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const STATUS_SYMBOLS = {
  in_stock: '[*]',
  low_stock: '[!]',
  out_of_stock: '[X]',
  reserved: '[#]'
};

const Inventory = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [stats, setStats] = useState({
    totalItems: 0,
    lowStockItems: 0,
    outOfStock: 0,
    totalValue: 0
  });

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .order('name');
      
      if (error) throw error;
      
      const items = data || [];
      setInventory(items);
      
      // Calculate stats
      const lowStock = items.filter(i => i.quantity_on_hand <= i.reorder_point && i.quantity_on_hand > 0);
      const outOfStock = items.filter(i => i.quantity_on_hand === 0);
      const totalValue = items.reduce((sum, i) => sum + (i.quantity_on_hand * (i.unit_cost || 0)), 0);
      
      setStats({
        totalItems: items.length,
        lowStockItems: lowStock.length,
        outOfStock: outOfStock.length,
        totalValue
      });
    } catch (error) {
      console.error('Error fetching inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStockStatus = (item: InventoryItem) => {
    if (item.quantity_on_hand === 0) return { status: 'out_of_stock', label: 'Out of Stock', color: 'destructive' };
    if (item.quantity_on_hand <= item.reorder_point) return { status: 'low_stock', label: 'Low Stock', color: 'warning' };
    return { status: 'in_stock', label: 'In Stock', color: 'success' };
  };

  const handleChatSubmit = async () => {
    if (!chatInput.trim() || chatLoading) return;
    
    const userMessage = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setChatLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('agri-assistant', {
        body: {
          messages: [
            ...chatMessages.map(m => ({ role: m.role, content: m.content })),
            { role: 'user', content: `[INVENTORY CONTEXT] ${userMessage}` }
          ],
          session_id: crypto.randomUUID()
        }
      });
      
      if (error) throw error;
      
      const responseText = typeof data === 'string' ? data : data?.response || 'I can help you manage inventory. Try asking about stock levels, reorder needs, or part availability.';
      setChatMessages(prev => [...prev, { role: 'assistant', content: responseText }]);
    } catch (error) {
      console.error('Chat error:', error);
      setChatMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'I apologize, but I encountered an error. Please try again or ask about specific inventory items.' 
      }]);
    } finally {
      setChatLoading(false);
    }
  };

  const filteredInventory = inventory.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.part_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.category && item.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 ml-16 md:ml-64">
        <Header />
        
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Inventory Management</h1>
              <p className="text-muted-foreground">Track parts, supplies, and stock levels</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={fetchInventory}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Package className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Items</p>
                    <p className="text-2xl font-bold">{stats.totalItems}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-500/10 rounded-lg">
                    <TrendingDown className="w-5 h-5 text-yellow-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Low Stock</p>
                    <p className="text-2xl font-bold text-yellow-500">{stats.lowStockItems}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-destructive/10 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-destructive" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Out of Stock</p>
                    <p className="text-2xl font-bold text-destructive">{stats.outOfStock}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500/10 rounded-lg">
                    <BarChart3 className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Value</p>
                    <p className="text-2xl font-bold">${stats.totalValue.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Inventory List */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Parts & Supplies</CardTitle>
                    <div className="relative w-64">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Search inventory..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : filteredInventory.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No inventory items found</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredInventory.map((item) => {
                        const stockStatus = getStockStatus(item);
                        return (
                          <div 
                            key={item.id} 
                            className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center gap-4">
                              <div className="p-2 bg-muted rounded-lg">
                                <Package className="w-5 h-5 text-muted-foreground" />
                              </div>
                              <div>
                                <p className="font-medium">{item.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {item.part_number} {item.location_bin && `| Bin: ${item.location_bin}`}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <p className="font-mono font-medium">
                                  {STATUS_SYMBOLS[stockStatus.status as keyof typeof STATUS_SYMBOLS]} {item.quantity_on_hand}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Reorder at: {item.reorder_point}
                                </p>
                              </div>
                              <Badge variant={stockStatus.color === 'success' ? 'default' : stockStatus.color === 'warning' ? 'secondary' : 'destructive'}>
                                {stockStatus.label}
                              </Badge>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Inventory Assistant Chat */}
            <Card className="h-[600px] flex flex-col">
              <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Inventory Assistant
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto p-4">
                {chatMessages.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingCart className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground mb-4">Ask me about inventory</p>
                    <div className="space-y-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full text-left justify-start"
                        onClick={() => setChatInput('What items need to be reordered?')}
                      >
                        {'[>]'} What items need to be reordered?
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full text-left justify-start"
                        onClick={() => setChatInput('Show me low stock alerts')}
                      >
                        {'[>]'} Show me low stock alerts
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full text-left justify-start"
                        onClick={() => setChatInput('Calculate total inventory value')}
                      >
                        {'[>]'} Calculate total inventory value
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {chatMessages.map((msg, idx) => (
                      <div 
                        key={idx} 
                        className={`p-3 rounded-lg ${
                          msg.role === 'user' 
                            ? 'bg-primary text-primary-foreground ml-8' 
                            : 'bg-muted mr-8'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    ))}
                    {chatLoading && (
                      <div className="bg-muted p-3 rounded-lg mr-8">
                        <Loader2 className="w-4 h-4 animate-spin" />
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Ask about inventory..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleChatSubmit())}
                    className="min-h-[40px] max-h-[100px] resize-none"
                    rows={1}
                  />
                  <Button onClick={handleChatSubmit} disabled={chatLoading || !chatInput.trim()}>
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
        
        <footer className="px-6 py-4 border-t border-border text-center text-xs text-muted-foreground">
          [C] 2026 Vida Technologies | Vida Enterprise Platform v3.0
        </footer>
      </main>
    </div>
  );
};

export default Inventory;

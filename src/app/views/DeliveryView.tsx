import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { getOrders, getDeliveryPersonnel, updateDeliveryStatus, updateOrder, Order, DeliveryPerson } from '../store/mockData';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Switch } from '../components/ui/switch';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { LogOut, Package, CheckCircle, XCircle, Truck } from 'lucide-react';
import { toast } from 'sonner';

export const DeliveryView = () => {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const [isActive, setIsActive] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [deliveryPerson, setDeliveryPerson] = useState<DeliveryPerson | null>(null);

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'delivery') { navigate('/login'); return; }
    getOrders().then(setOrders).catch(console.error);
    getDeliveryPersonnel()
      .then(dp => {
        // Match by email since delivery_personnel has its own auto-increment separate from users
        const me = dp.find(d => d.email === currentUser?.email);
        if (me) {
          setDeliveryPerson(me);
          setIsActive(me.status === 'active');
        }
      })
      .catch(console.error);
  }, [currentUser?.id]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleStatusToggle = async (checked: boolean) => {
    if (!currentUser) return;

    setIsActive(checked);
    try {
      await updateDeliveryStatus(deliveryPerson!.id, checked ? 'active' : 'offline');
      setDeliveryPerson(prev => prev ? { ...prev, status: checked ? 'active' : 'offline' } : prev);
      toast.success(
        checked
          ? '✅ You are now ACTIVE and available for deliveries'
          : '⏸️ You are now OFFLINE'
      );
    } catch {
      setIsActive(!checked);
      toast.error('Failed to update status.');
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: 'in-transit' | 'delivered') => {
    try {
      await updateOrder(orderId, { status: newStatus });
      const updated = await getOrders();
      setOrders(updated);
      if (newStatus === 'delivered') {
        setDeliveryPerson(prev => prev ? { ...prev, currentOrders: Math.max(0, prev.currentOrders - 1) } : prev);
      }
      const order = orders.find(o => o.id === orderId);
      if (order) {
        toast.success(
          newStatus === 'delivered'
            ? `✅ Order #${orderId} marked as delivered. Email sent to ${order.customerEmail}`
            : `🚚 Order #${orderId} is now in transit`
        );
      }
    } catch {
      toast.error('Failed to update order status.');
    }
  };

  const myOrders = orders.filter(
    order => deliveryPerson && String(order.deliveryPersonId) === String(deliveryPerson.id)
  );

  const activeOrders = myOrders.filter(o => o.status === 'assigned' || o.status === 'in-transit');
  const completedOrders = myOrders.filter(o => o.status === 'delivered');

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending:      'bg-yellow-400/20 text-yellow-300 border border-yellow-400/30',
      assigned:     'bg-cyan-400/20 text-cyan-300 border border-cyan-400/30',
      'in-transit': 'bg-purple-400/20 text-purple-300 border border-purple-400/30',
      delivered:    'bg-green-400/20 text-green-300 border border-green-400/30',
      cancelled:    'bg-red-400/20 text-red-300 border border-red-400/30',
    };
    return colors[status] || 'bg-white/10 text-white/60';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-cyan-950 to-blue-950 text-white">
      {/* glowing blobs */}
      <div className="fixed -top-32 -left-32 w-96 h-96 bg-cyan-500 opacity-20 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed -bottom-32 -right-32 w-96 h-96 bg-blue-500 opacity-20 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 border-b border-white/10 bg-white/5 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-extrabold">
              Delivery<span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">Hub</span>
              <span className="ml-2 text-base font-normal text-white/50">Delivery Dashboard</span>
            </h1>
            <p className="text-sm text-white/50">Welcome, {currentUser?.name}</p>
          </div>
          <Button
            variant="outline"
            onClick={handleLogout}
            className="border-white/20 bg-white/10 text-white hover:bg-white/20"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        {/* Status Card */}
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-6 mb-6 shadow-xl">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-lg font-bold">Delivery Status</h2>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
              isActive ? 'bg-green-400/20 text-green-300 border border-green-400/30' : 'bg-white/10 text-white/50 border border-white/20'
            }`}>
              {isActive ? 'ACTIVE' : 'OFFLINE'}
            </span>
          </div>
          <p className="text-sm text-white/50 mb-4">Toggle your availability to receive delivery assignments</p>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="status-toggle" className="text-sm text-white/80">
                Set yourself as {isActive ? 'Offline' : 'Active'}
              </Label>
              <p className="text-xs text-white/40">
                {isActive
                  ? 'You will receive new delivery assignments and email notifications'
                  : 'You will not receive new delivery assignments'}
              </p>
            </div>
            <Switch
              id="status-toggle"
              checked={isActive}
              onCheckedChange={handleStatusToggle}
              className="data-[state=checked]:bg-green-500"
            />
          </div>

          <div className="grid grid-cols-3 gap-4 mt-6">
            {[
              { label: 'Active Deliveries', value: deliveryPerson?.currentOrders || 0, color: 'text-cyan-400' },
              { label: 'In Progress',       value: activeOrders.length,                color: 'text-purple-400' },
              { label: 'Completed',         value: completedOrders.length,             color: 'text-green-400' },
            ].map(({ label, value, color }) => (
              <div key={label} className="text-center rounded-xl bg-white/5 border border-white/10 py-4">
                <p className={`text-3xl font-extrabold ${color}`}>{value}</p>
                <p className="text-xs text-white/50 mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Orders Tabs */}
        <Tabs defaultValue="active">
          <TabsList className="bg-white/5 border border-white/10 backdrop-blur-md">
            <TabsTrigger value="active" className="data-[state=active]:bg-cyan-500/30 data-[state=active]:text-cyan-300 text-white/60">
              <Truck className="h-4 w-4 mr-2" />
              Active Orders ({activeOrders.length})
            </TabsTrigger>
            <TabsTrigger value="completed" className="data-[state=active]:bg-green-500/30 data-[state=active]:text-green-300 text-white/60">
              <CheckCircle className="h-4 w-4 mr-2" />
              Completed ({completedOrders.length})
            </TabsTrigger>
            <TabsTrigger value="all" className="data-[state=active]:bg-blue-500/30 data-[state=active]:text-blue-300 text-white/60">
              <Package className="h-4 w-4 mr-2" />
              All Orders ({myOrders.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="mt-6">
            {activeOrders.length === 0 ? (
              <div className="text-center py-16 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md">
                <Truck className="h-16 w-16 mx-auto text-white/20 mb-4" />
                <p className="text-white/50">No active deliveries</p>
                {!isActive && (
                  <p className="text-sm text-white/30 mt-2">
                    Set yourself as active to receive delivery assignments
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {activeOrders.map(order => (
                  <div key={order.id} className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-6 shadow-lg">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-bold text-lg">Order #{order.id}</h3>
                        <p className="text-sm text-white/50">Customer: {order.customerName}</p>
                        <p className="text-xs text-white/30 mt-1">{new Date(order.createdAt).toLocaleString()}</p>
                      </div>
                      <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-semibold text-white/70 mb-2">Order Items</h4>
                        <div className="space-y-1">
                          {order.products.map((product, idx) => (
                            <div key={idx} className="flex justify-between text-sm text-white/70">
                              <span>{product.productName} x {product.quantity}</span>
                              <span>₹{(product.price * product.quantity).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                        <div className="border-t border-white/10 mt-2 pt-2 flex justify-between font-bold">
                          <span>Total</span>
                          <span className="text-cyan-400">₹{order.totalAmount.toFixed(2)}</span>
                        </div>
                      </div>
                      <div className="bg-cyan-500/10 border border-cyan-400/20 p-4 rounded-xl">
                        <h4 className="text-sm font-semibold text-cyan-300 mb-2">Delivery Address</h4>
                        <p className="text-sm text-white/70">{order.address}</p>
                        <p className="text-sm text-white/50 mt-1"><strong>Contact:</strong> {order.customerEmail}</p>
                      </div>
                      <div className="flex gap-2">
                        {order.status === 'assigned' && (
                          <Button
                            onClick={() => handleUpdateOrderStatus(order.id, 'in-transit')}
                            className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 border-0 font-semibold"
                          >
                            <Truck className="h-4 w-4 mr-2" />
                            Start Delivery
                          </Button>
                        )}
                        {order.status === 'in-transit' && (
                          <Button
                            onClick={() => handleUpdateOrderStatus(order.id, 'delivered')}
                            className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 border-0 font-semibold"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Mark as Delivered
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed" className="mt-6">
            {completedOrders.length === 0 ? (
              <div className="text-center py-16 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md">
                <Package className="h-16 w-16 mx-auto text-white/20 mb-4" />
                <p className="text-white/50">No completed deliveries yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {completedOrders.map(order => (
                  <div key={order.id} className="rounded-2xl border border-green-400/20 bg-green-500/5 backdrop-blur-md p-6 shadow-lg">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-bold text-lg">Order #{order.id}</h3>
                        <p className="text-sm text-white/50">Customer: {order.customerName}</p>
                        <p className="text-xs text-white/30 mt-1">{new Date(order.createdAt).toLocaleString()}</p>
                      </div>
                      <Badge className={getStatusColor(order.status)}>
                        <CheckCircle className="h-3 w-3 mr-1" />{order.status}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      {order.products.map((product, idx) => (
                        <div key={idx} className="flex justify-between text-sm text-white/70">
                          <span>{product.productName} x {product.quantity}</span>
                          <span>₹{(product.price * product.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                      <div className="border-t border-white/10 pt-2 flex justify-between font-bold">
                        <span>Total</span>
                        <span className="text-green-400">₹{order.totalAmount.toFixed(2)}</span>
                      </div>
                      <p className="text-sm text-white/40 mt-2"><strong className="text-white/60">Delivered to:</strong> {order.address}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="all" className="mt-6">
            {myOrders.length === 0 ? (
              <div className="text-center py-16 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md">
                <Package className="h-16 w-16 mx-auto text-white/20 mb-4" />
                <p className="text-white/50">No orders assigned yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {myOrders.map(order => (
                  <div key={order.id} className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-6 shadow-lg">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-bold text-lg">Order #{order.id}</h3>
                        <p className="text-sm text-white/50">Customer: {order.customerName}</p>
                        <p className="text-xs text-white/30 mt-1">{new Date(order.createdAt).toLocaleString()}</p>
                      </div>
                      <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                    </div>
                    <div className="space-y-2">
                      {order.products.map((product, idx) => (
                        <div key={idx} className="flex justify-between text-sm text-white/70">
                          <span>{product.productName} x {product.quantity}</span>
                          <span>₹{(product.price * product.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                      <div className="border-t border-white/10 pt-2 flex justify-between font-bold">
                        <span>Total</span>
                        <span className="text-cyan-400">₹{order.totalAmount.toFixed(2)}</span>
                      </div>
                      <p className="text-sm text-white/40 mt-2"><strong className="text-white/60">Address:</strong> {order.address}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

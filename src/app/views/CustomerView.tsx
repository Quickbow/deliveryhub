import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { getProducts, getOrders, addOrder, Product, Order } from '../store/mockData';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { LogOut, ShoppingCart, Package, Plus, Minus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface CartItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  image: string;
}

export const CustomerView = () => {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [address, setAddress] = useState('123 Main St, Apt 4B, New York, NY 10001');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Auth guard
  useEffect(() => {
    if (!currentUser || currentUser.role !== 'customer') navigate('/login');
  }, [currentUser]);

  useEffect(() => {
    getProducts().then(setProducts).catch(console.error);
    getOrders().then(setOrders).catch((e) => {
      console.error(e);
      toast.error('Failed to load orders.');
    });
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const addToCart = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    if (product.stock === 0) {
      toast.error(`${product.name} is out of stock`);
      return;
    }

    const existingItem = cart.find(item => item.productId === productId);
    const currentQty = existingItem ? existingItem.quantity : 0;

    if (currentQty >= product.stock) {
      toast.error(`Only ${product.stock} unit(s) of ${product.name} available`);
      return;
    }

    if (existingItem) {
      setCart(cart.map(item =>
        item.productId === productId
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, {
        productId: product.id,
        productName: product.name,
        quantity: 1,
        price: product.price,
        image: product.image,
      }]);
    }

    toast.success(`${product.name} added to cart`);
  };

  const updateQuantity = (productId: string, delta: number) => {
    const product = products.find(p => p.id === productId);
    setCart(cart.map(item => {
      if (item.productId === productId) {
        const newQuantity = item.quantity + delta;
        const capped = Math.min(newQuantity, product?.stock ?? newQuantity);
        if (delta > 0 && product && newQuantity > product.stock) {
          toast.error(`Only ${product.stock} unit(s) available`);
        }
        return { ...item, quantity: Math.max(0, capped) };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.productId !== productId));
    toast.success('Item removed from cart');
  };

  const getTotalAmount = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast.error('Your cart is empty');
      return;
    }
    setShowCheckout(true);
  };

  const confirmOrder = async () => {
    if (!currentUser) return;
    setSubmitting(true);

    const newOrder: Order = {
      id: `o${Date.now()}`,
      customerId: currentUser.id,
      customerName: currentUser.name,
      customerEmail: currentUser.email,
      products: cart.map(item => ({
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        price: item.price,
      })),
      totalAmount: getTotalAmount(),
      status: 'pending',
      address: address,
      createdAt: new Date().toISOString(),
    };

    try {
      await addOrder(newOrder);
      const updated = await getOrders();
      setOrders(updated);
      setCart([]);
      setShowCheckout(false);
      toast.success('Order placed successfully!');
    } catch (err) {
      console.error('confirmOrder error:', err);
      toast.error('Failed to place order. Is the backend running?');
    } finally {
      setSubmitting(false);
    }
  };

  const myOrders = orders.filter(order => String(order.customerId) === String(currentUser?.id));

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
              <span className="ml-2 text-base font-normal text-white/50">Customer Dashboard</span>
            </h1>
            <p className="text-sm text-white/50">Welcome, {currentUser?.name}</p>
          </div>
          <div className="flex gap-2 items-center">
            <Button variant="outline" onClick={() => document.getElementById('orders-tab')?.click()} className="border-white/20 bg-white/10 text-white hover:bg-white/20">
              <Package className="h-4 w-4 mr-2" />
              My Orders
            </Button>
            <Button variant="outline" onClick={handleLogout} className="border-white/20 bg-white/10 text-white hover:bg-white/20">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        <Tabs defaultValue="shop">
          <TabsList className="bg-white/5 border border-white/10 backdrop-blur-md">
            <TabsTrigger value="shop" className="data-[state=active]:bg-cyan-500/30 data-[state=active]:text-cyan-300 text-white/60">
              <ShoppingCart className="h-4 w-4 mr-2" />
              Shop Products
            </TabsTrigger>
            <TabsTrigger value="cart" className="data-[state=active]:bg-blue-500/30 data-[state=active]:text-blue-300 text-white/60">
              <ShoppingCart className="h-4 w-4 mr-2" />
              Cart ({cart.length})
            </TabsTrigger>
            <TabsTrigger value="orders" id="orders-tab" className="data-[state=active]:bg-purple-500/30 data-[state=active]:text-purple-300 text-white/60">
              <Package className="h-4 w-4 mr-2" />
              My Orders ({myOrders.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="shop" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map(product => (
                <div key={product.id} className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md overflow-hidden shadow-lg flex flex-col">
                  <div className="w-full h-48 bg-slate-800 flex items-center justify-center overflow-hidden">
                    <img src={product.image} alt={product.name} className="w-full h-full object-contain" />
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-bold text-lg">{product.name}</h3>
                      <Badge className="bg-cyan-400/20 text-cyan-300 border border-cyan-400/30 text-xs">{product.category}</Badge>
                    </div>
                    <p className="text-sm text-white/50 mb-4 flex-1">{product.description}</p>
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-2xl font-extrabold text-cyan-300">₹{product.price}</span>
                      <span className="text-xs text-white/40">
                        {product.stock === 0
                          ? <span className="text-red-400 font-medium">Out of stock</span>
                          : `Stock: ${product.stock}`}
                      </span>
                    </div>
                    <Button
                      onClick={() => addToCart(product.id)}
                      disabled={product.stock === 0}
                      className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 border-0 font-semibold disabled:opacity-40"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="cart" className="mt-6">
            {cart.length === 0 ? (
              <div className="text-center py-16 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md">
                <ShoppingCart className="h-16 w-16 mx-auto text-white/20 mb-4" />
                <p className="text-white/50">Your cart is empty</p>
              </div>
            ) : (
              <div className="space-y-4">
                {cart.map(item => (
                  <div key={item.productId} className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-4 flex items-center gap-4 shadow-lg">
                    <div className="w-20 h-20 rounded-xl bg-slate-800 flex items-center justify-center overflow-hidden shrink-0">
                      <img src={item.image} alt={item.productName} className="w-full h-full object-contain" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{item.productName}</h3>
                      <p className="text-cyan-300">₹{item.price}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" onClick={() => updateQuantity(item.productId, -1)} className="border-white/20 bg-white/10 text-white hover:bg-white/20 h-8 w-8 p-0">
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center font-bold">{item.quantity}</span>
                      <Button size="sm" variant="outline" onClick={() => updateQuantity(item.productId, 1)} className="border-white/20 bg-white/10 text-white hover:bg-white/20 h-8 w-8 p-0">
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-cyan-300">₹{(item.price * item.quantity).toFixed(2)}</p>
                      <Button size="sm" variant="ghost" onClick={() => removeFromCart(item.productId)} className="text-red-400 hover:text-red-300 hover:bg-red-400/10 mt-1">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}

                <div className="rounded-2xl border border-cyan-400/20 bg-cyan-500/10 backdrop-blur-md p-6">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-lg text-white/70">Total</span>
                    <span className="text-3xl font-extrabold text-cyan-300">₹{getTotalAmount().toFixed(2)}</span>
                  </div>
                  <Button onClick={handleCheckout} size="lg" className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 border-0 font-bold">
                    Proceed to Checkout
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="orders" className="mt-6">
            {myOrders.length === 0 ? (
              <div className="text-center py-16 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md">
                <Package className="h-16 w-16 mx-auto text-white/20 mb-4" />
                <p className="text-white/50">No orders yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {myOrders.map(order => (
                  <div key={order.id} className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-6 shadow-lg">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-bold text-lg">Order #{order.id}</h3>
                        <p className="text-xs text-white/30">{new Date(order.createdAt).toLocaleString()}</p>
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
                        <span className="text-cyan-300">₹{order.totalAmount.toFixed(2)}</span>
                      </div>
                      <div className="text-sm text-white/40 mt-2">
                        <p><strong className="text-white/60">Delivery Address:</strong> {order.address}</p>
                        {order.deliveryPersonName && (
                          <p><strong className="text-white/60">Delivery Person:</strong> {order.deliveryPersonName}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Checkout Dialog */}
      <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
        <DialogContent className="bg-slate-900 border border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Checkout</DialogTitle>
            <DialogDescription className="text-white/50">Confirm your order details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-white/70">Delivery Address</Label>
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter your address"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/30"
              />
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="font-semibold mb-2 text-white/70">Order Summary</p>
              {cart.map((item, idx) => (
                <div key={idx} className="flex justify-between text-sm text-white/60 mb-1">
                  <span>{item.productName} x {item.quantity}</span>
                  <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div className="border-t border-white/10 mt-2 pt-2 flex justify-between font-bold">
                <span>Total</span>
                <span className="text-cyan-300">₹{getTotalAmount().toFixed(2)}</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCheckout(false)} disabled={submitting} className="border-white/20 bg-white/10 text-white hover:bg-white/20">
              Cancel
            </Button>
            <Button onClick={confirmOrder} disabled={submitting} className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 border-0 font-bold">
              {submitting ? 'Placing Order...' : 'Confirm Order'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

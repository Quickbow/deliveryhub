import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import {
  getProducts,
  getOrders,
  getDeliveryPersonnel,
  addProduct,
  updateProduct,
  deleteProduct,
  assignDeliveryPerson,
  Product,
  DeliveryPerson,
  Order,
} from '../store/mockData';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { LogOut, Package, Plus, Edit, Trash2, Truck, ShoppingBag, Globe, Upload, X } from 'lucide-react';
import { toast } from 'sonner';

export const SellerView = () => {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showEditProduct, setShowEditProduct] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showAssignDelivery, setShowAssignDelivery] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [deliveryPersonnel, setDeliveryPersonnel] = useState<DeliveryPerson[]>([]);

  const loadData = () => {
    getProducts().then(setProducts).catch(console.error);
    getOrders().then(setOrders).catch(console.error);
    getDeliveryPersonnel().then(setDeliveryPersonnel).catch(console.error);
  };

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'seller') { navigate('/login'); return; }
    loadData();
  }, [currentUser]);

  // Form states
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    stock: '',
    image: '',
  });
  const [imageSource, setImageSource] = useState<'url' | 'upload'>('url');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      setProductForm(prev => ({ ...prev, image: evt.target?.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const ImagePicker = ({ className }: { className?: string }) => (
    <div className={`space-y-2 col-span-2 ${className ?? ''}`}>
      <Label className="text-white/70">Product Image</Label>
      {/* toggle */}
      <div className="flex gap-1 p-1 rounded-lg bg-white/5 border border-white/10">
        <button type="button" onClick={() => setImageSource('url')}
          className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${
            imageSource === 'url' ? 'bg-cyan-500/30 text-cyan-300' : 'text-white/40 hover:text-white/70'
          }`}>
          <Globe className="h-3.5 w-3.5" /> Web URL
        </button>
        <button type="button" onClick={() => setImageSource('upload')}
          className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${
            imageSource === 'upload' ? 'bg-cyan-500/30 text-cyan-300' : 'text-white/40 hover:text-white/70'
          }`}>
          <Upload className="h-3.5 w-3.5" /> From Device
        </button>
      </div>
      {/* input */}
      {imageSource === 'url' ? (
        <Input
          value={productForm.image.startsWith('data:') ? '' : productForm.image}
          onChange={(e) => setProductForm(prev => ({ ...prev, image: e.target.value }))}
          placeholder="https://example.com/image.jpg"
          className="bg-white/10 border-white/20 text-white placeholder:text-white/30"
        />
      ) : (
        <label className="block cursor-pointer">
          <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
          <div className="rounded-xl border-2 border-dashed border-white/20 hover:border-cyan-400/50 transition-colors p-6 text-center">
            <Upload className="h-8 w-8 mx-auto text-white/30 mb-2" />
            <p className="text-sm text-white/50">Click to select an image from your device</p>
            <p className="text-xs text-white/30 mt-1">PNG, JPG, WEBP supported</p>
          </div>
        </label>
      )}
      {/* preview */}
      {productForm.image && (
        <div className="relative rounded-xl overflow-hidden border border-white/10 mt-1">
          <img src={productForm.image} alt="Preview" className="w-full h-40 object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
          <button type="button" onClick={() => setProductForm(prev => ({ ...prev, image: '' }))}
            className="absolute top-2 right-2 p-1 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const resetForm = () => {
    setProductForm({
      name: '',
      description: '',
      price: '',
      category: '',
      stock: '',
      image: '',
    });
    setImageSource('url');
  };

  const handleAddProduct = async () => {
    if (!currentUser) return;

    const newProduct: Product = {
      id: `p${Date.now()}`,
      sellerId: currentUser.id,
      name: productForm.name,
      description: productForm.description,
      price: parseFloat(productForm.price),
      category: productForm.category,
      stock: parseInt(productForm.stock),
      image: productForm.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
    };

    try {
      await addProduct(newProduct);
      const updated = await getProducts();
      setProducts(updated);
      toast.success('Product added successfully!');
      setShowAddProduct(false);
      resetForm();
    } catch {
      toast.error('Failed to add product.');
    }
  };

  const handleEditProduct = async () => {
    if (!selectedProduct) return;

    try {
      await updateProduct(selectedProduct.id, {
        name: productForm.name,
        description: productForm.description,
        price: parseFloat(productForm.price),
        category: productForm.category,
        stock: parseInt(productForm.stock),
        image: productForm.image,
      });
      const updated = await getProducts();
      setProducts(updated);
      toast.success('Product updated successfully!');
      setShowEditProduct(false);
      setSelectedProduct(null);
      resetForm();
    } catch {
      toast.error('Failed to update product.');
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      try {
        await deleteProduct(productId);
        const updated = await getProducts();
        setProducts(updated);
        toast.success('Product deleted successfully!');
      } catch {
        toast.error('Failed to delete product.');
      }
    }
  };

  const openEditDialog = (product: Product) => {
    setSelectedProduct(product);
    setProductForm({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      category: product.category,
      stock: product.stock.toString(),
      image: product.image,
    });
    setImageSource(product.image?.startsWith('data:') ? 'upload' : 'url');
    setShowEditProduct(true);
  };

  const handleAssignDelivery = async (deliveryPersonId: string) => {
    if (!selectedOrder) return;

    try {
      await assignDeliveryPerson(selectedOrder, deliveryPersonId);
      const [updatedOrders, updatedDp] = await Promise.all([getOrders(), getDeliveryPersonnel()]);
      setOrders(updatedOrders);
      setDeliveryPersonnel(updatedDp);
      const deliveryPerson = deliveryPersonnel.find(d => d.id === deliveryPersonId);
      toast.success(`Delivery assigned to ${deliveryPerson?.name}. Email notification sent!`);
      setShowAssignDelivery(false);
      setSelectedOrder(null);
    } catch {
      toast.error('Failed to assign delivery person');
    }
  };

  const myProducts = products.filter(p => String(p.sellerId) === String(currentUser?.id));
  const allOrders = orders;

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending:      'bg-yellow-400/20 text-cyan-300 border border-yellow-400/30',
      assigned:     'bg-amber-400/20 text-cyan-300 border border-amber-400/30',
      'in-transit': 'bg-orange-400/20 text-blue-300 border border-orange-400/30',
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
              <span className="ml-2 text-base font-normal text-white/50">Seller Dashboard</span>
            </h1>
            <p className="text-sm text-white/50">Welcome, {currentUser?.name}</p>
          </div>
          <Button variant="outline" onClick={handleLogout} className="border-white/20 bg-white/10 text-white hover:bg-white/20">
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        <Tabs defaultValue="products">
          <TabsList className="bg-white/5 border border-white/10 backdrop-blur-md">
            <TabsTrigger value="products" className="data-[state=active]:bg-cyan-500/30 data-[state=active]:text-cyan-300 text-white/60">
              <ShoppingBag className="h-4 w-4 mr-2" />
              My Products ({myProducts.length})
            </TabsTrigger>
            <TabsTrigger value="orders" className="data-[state=active]:bg-blue-500/30 data-[state=active]:text-blue-300 text-white/60">
              <Package className="h-4 w-4 mr-2" />
              All Orders ({allOrders.length})
            </TabsTrigger>
            <TabsTrigger value="delivery" className="data-[state=active]:bg-cyan-500/30 data-[state=active]:text-cyan-300 text-white/60">
              <Truck className="h-4 w-4 mr-2" />
              Delivery Personnel
            </TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="mt-6">
            <div className="mb-4">
              <Button onClick={() => setShowAddProduct(true)} className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 border-0 font-semibold">
                <Plus className="h-4 w-4 mr-2" />
                Add New Product
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myProducts.map(product => (
                <div key={product.id} className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md overflow-hidden shadow-lg flex flex-col">
                  <div className="w-full h-48 bg-slate-800 flex items-center justify-center overflow-hidden">
                    <img src={product.image} alt={product.name} className="w-full h-full object-contain" />
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-bold text-lg">{product.name}</h3>
                      <Badge className="bg-yellow-400/20 text-cyan-300 border border-yellow-400/30 text-xs">{product.category}</Badge>
                    </div>
                    <p className="text-sm text-white/50 mb-3 flex-1">{product.description}</p>
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-2xl font-extrabold text-cyan-300">₹{product.price}</span>
                      <span className="text-xs text-white/40">Stock: {product.stock}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" className="flex-1 border-white/20 bg-white/10 text-white hover:bg-white/20" onClick={() => openEditDialog(product)}>
                        <Edit className="h-4 w-4 mr-2" />Edit
                      </Button>
                      <Button variant="outline" className="flex-1 border-red-400/30 bg-red-400/10 text-red-300 hover:bg-red-400/20" onClick={() => handleDeleteProduct(product.id)}>
                        <Trash2 className="h-4 w-4 mr-2" />Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="orders" className="mt-6">
            <div className="space-y-4">
              {allOrders.map(order => (
                <div key={order.id} className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-6 shadow-lg">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-lg">Order #{order.id}</h3>
                      <p className="text-sm text-white/50">{order.customerName} ({order.customerEmail})</p>
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
                      <span className="text-cyan-300">₹{order.totalAmount.toFixed(2)}</span>
                    </div>
                    <div className="text-sm text-white/40 mt-2">
                      <p><strong className="text-white/60">Delivery Address:</strong> {order.address}</p>
                      {order.deliveryPersonName && (
                        <p><strong className="text-white/60">Assigned to:</strong> {order.deliveryPersonName}</p>
                      )}
                    </div>
                    {order.status === 'pending' && (
                      <div className="pt-2">
                        <Button
                          onClick={() => { setSelectedOrder(order.id); setShowAssignDelivery(true); }}
                          className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 border-0 font-semibold"
                        >
                          <Truck className="h-4 w-4 mr-2" />
                          Assign Delivery Person
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="delivery" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {deliveryPersonnel.map(person => (
                <div key={person.id} className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-6 shadow-lg">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold">{person.name}</h3>
                      <p className="text-sm text-white/50">{person.email}</p>
                    </div>
                    <Badge className={person.status === 'active' ? 'bg-green-400/20 text-green-300 border border-green-400/30' : 'bg-white/10 text-white/50 border border-white/20'}>
                      {person.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-white/60">Current Orders: <strong className="text-white">{person.currentOrders}</strong></p>
                  <p className="text-xs text-white/30 mt-1">{person.status === 'active' ? 'Available for deliveries' : 'Currently offline'}</p>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Product Dialog */}
      <Dialog open={showAddProduct} onOpenChange={setShowAddProduct}>
        <DialogContent className="max-w-2xl bg-slate-900 border border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Add New Product</DialogTitle>
            <DialogDescription className="text-white/50">Enter the product details below</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-white/70">Product Name</Label>
              <Input value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} placeholder="Enter product name" className="bg-white/10 border-white/20 text-white placeholder:text-white/30" />
            </div>
            <div className="space-y-2">
              <Label className="text-white/70">Category</Label>
              <Input value={productForm.category} onChange={(e) => setProductForm({ ...productForm, category: e.target.value })} placeholder="e.g., Electronics" className="bg-white/10 border-white/20 text-white placeholder:text-white/30" />
            </div>
            <div className="space-y-2">
              <Label className="text-white/70">Price (₹)</Label>
              <Input type="number" step="0.01" value={productForm.price} onChange={(e) => setProductForm({ ...productForm, price: e.target.value })} placeholder="0.00" className="bg-white/10 border-white/20 text-white placeholder:text-white/30" />
            </div>
            <div className="space-y-2">
              <Label className="text-white/70">Stock</Label>
              <Input type="number" value={productForm.stock} onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })} placeholder="0" className="bg-white/10 border-white/20 text-white placeholder:text-white/30" />
            </div>
            <div className="space-y-2 col-span-2">
              <Label className="text-white/70">Description</Label>
              <Textarea value={productForm.description} onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} placeholder="Enter product description" className="bg-white/10 border-white/20 text-white placeholder:text-white/30" />
            </div>
            <ImagePicker />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAddProduct(false); resetForm(); }} className="border-white/20 bg-white/10 text-white hover:bg-white/20">Cancel</Button>
            <Button onClick={handleAddProduct} className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 border-0 font-bold">Add Product</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Product Dialog */}
      <Dialog open={showEditProduct} onOpenChange={setShowEditProduct}>
        <DialogContent className="max-w-2xl bg-slate-900 border border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Product</DialogTitle>
            <DialogDescription className="text-white/50">Update the product details</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-white/70">Product Name</Label>
              <Input value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} className="bg-white/10 border-white/20 text-white" />
            </div>
            <div className="space-y-2">
              <Label className="text-white/70">Category</Label>
              <Input value={productForm.category} onChange={(e) => setProductForm({ ...productForm, category: e.target.value })} className="bg-white/10 border-white/20 text-white" />
            </div>
            <div className="space-y-2">
              <Label className="text-white/70">Price (₹)</Label>
              <Input type="number" step="0.01" value={productForm.price} onChange={(e) => setProductForm({ ...productForm, price: e.target.value })} className="bg-white/10 border-white/20 text-white" />
            </div>
            <div className="space-y-2">
              <Label className="text-white/70">Stock</Label>
              <Input type="number" value={productForm.stock} onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })} className="bg-white/10 border-white/20 text-white" />
            </div>
            <div className="space-y-2 col-span-2">
              <Label className="text-white/70">Description</Label>
              <Textarea value={productForm.description} onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} className="bg-white/10 border-white/20 text-white" />
            </div>
            <ImagePicker />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowEditProduct(false); resetForm(); }} className="border-white/20 bg-white/10 text-white hover:bg-white/20">Cancel</Button>
            <Button onClick={handleEditProduct} className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 border-0 font-bold">Update Product</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Delivery Dialog */}
      <Dialog open={showAssignDelivery} onOpenChange={setShowAssignDelivery}>
        <DialogContent className="bg-slate-900 border border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Assign Delivery Person</DialogTitle>
            <DialogDescription className="text-white/50">Select a delivery person for this order</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {deliveryPersonnel.map(person => (
              <div
                key={person.id}
                className={`rounded-xl border p-4 transition-all duration-200 ${
                  person.status === 'active'
                    ? 'border-white/10 bg-white/5 hover:border-cyan-400/40 hover:bg-cyan-400/10 cursor-pointer'
                    : 'border-white/5 bg-white/5 opacity-40 cursor-not-allowed'
                }`}
                onClick={() => person.status === 'active' && handleAssignDelivery(person.id)}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold">{person.name}</p>
                    <p className="text-sm text-white/50">{person.email}</p>
                    <p className="text-xs text-white/30">Current orders: {person.currentOrders}</p>
                  </div>
                  <Badge className={person.status === 'active' ? 'bg-green-400/20 text-green-300 border border-green-400/30' : 'bg-white/10 text-white/50 border border-white/20'}>
                    {person.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssignDelivery(false)} className="border-white/20 bg-white/10 text-white hover:bg-white/20">Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

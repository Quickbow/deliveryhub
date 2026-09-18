/// <reference types="vite/client" />

export interface User {
  id: string;
  email: string;
  password: string;
  role: 'customer' | 'seller' | 'delivery';
  name: string;
}

export interface Product {
  id: string;
  sellerId: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  stock: number;
}

export interface DeliveryPerson {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'offline';
  currentOrders: number;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  products: OrderItem[];
  totalAmount: number;
  deliveryPersonId?: string;
  deliveryPersonName?: string;
  status: 'pending' | 'assigned' | 'in-transit' | 'delivered' | 'cancelled';
  address: string;
  createdAt: string;
}

export const mockUsers: User[] = [
  {
    id: '1',
    email: 'customer@example.com',
    password: 'password',
    role: 'customer',
    name: 'John Customer'
  },
  {
    id: '2',
    email: 'seller@example.com',
    password: 'password',
    role: 'seller',
    name: 'Jane Seller'
  },
  {
    id: '3',
    email: 'delivery@example.com',
    password: 'password',
    role: 'delivery',
    name: 'Bob Delivery'
  }
];

export const mockProducts: Product[] = [
  {
    id: '1',
    sellerId: '2',
    name: 'Laptop',
    description: 'High-performance laptop with Intel Core i7, 16GB RAM, 512GB SSD — perfect for work and gaming.',
    price: 74999,
    image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&h=250&fit=crop&auto=format',
    category: 'Electronics',
    stock: 10
  },
  {
    id: '2',
    sellerId: '2',
    name: 'Wireless Mouse',
    description: 'Ergonomic wireless mouse with 2.4GHz connectivity, silent clicks and 18-month battery life.',
    price: 1299,
    image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400&h=250&fit=crop&auto=format',
    category: 'Electronics',
    stock: 25
  },
  {
    id: '3',
    sellerId: '2',
    name: 'Mechanical Keyboard',
    description: 'RGB mechanical keyboard with Cherry MX Blue switches, full anti-ghosting and aluminium frame.',
    price: 3499,
    image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400&h=250&fit=crop&auto=format',
    category: 'Electronics',
    stock: 15
  },
  {
    id: '4',
    sellerId: '2',
    name: 'Wireless Headphones',
    description: 'Over-ear noise-cancelling headphones with 30hr battery, Hi-Res audio and foldable design.',
    price: 4999,
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=250&fit=crop&auto=format',
    category: 'Audio',
    stock: 20
  },
  {
    id: '5',
    sellerId: '2',
    name: 'Smartphone',
    description: 'Latest Android smartphone with 6.7" AMOLED display, 50MP camera and 5000mAh battery.',
    price: 22999,
    image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=250&fit=crop&auto=format',
    category: 'Mobile',
    stock: 18
  },
  {
    id: '6',
    sellerId: '2',
    name: '27" Monitor',
    description: '4K UHD IPS display, 144Hz refresh rate, HDR400 support and ultra-thin bezels for immersive viewing.',
    price: 18499,
    image: 'https://images.unsplash.com/photo-1527443224154-c4a573d5e212?w=400&h=250&fit=crop&auto=format',
    category: 'Electronics',
    stock: 8
  }
];

export const mockOrders: Order[] = [
  {
    id: '1',
    customerId: '1',
    customerName: 'John Customer',
    customerEmail: 'customer@example.com',
    products: [
      {
        productId: '1',
        productName: 'Laptop',
        quantity: 1,
        price: 999.99
      }
    ],
    totalAmount: 999.99,
    status: 'delivered',
    address: '123 Main St, City, State 12345',
    createdAt: '2024-01-15'
  },
  {
    id: '2',
    customerId: '1',
    customerName: 'John Customer',
    customerEmail: 'customer@example.com',
    products: [
      {
        productId: '2',
        productName: 'Mouse',
        quantity: 2,
        price: 29.99
      }
    ],
    totalAmount: 59.98,
    status: 'pending',
    address: '123 Main St, City, State 12345',
    createdAt: '2024-01-20'
  }
];

export const mockDeliveryPersonnel: DeliveryPerson[] = [
  {
    id: '3',
    name: 'Bob Delivery',
    email: 'delivery@example.com',
    status: 'active',
    currentOrders: 2
  },
  {
    id: '4',
    name: 'Alice Driver',
    email: 'alice.driver@example.com',
    status: 'active',
    currentOrders: 1
  },
  {
    id: '5',
    name: 'Charlie Runner',
    email: 'charlie.runner@example.com',
    status: 'offline',
    currentOrders: 0
  }
];

const api = (path: string) =>
  import.meta.env.VITE_BACKEND_URL
    ? `${import.meta.env.VITE_BACKEND_URL}${path}`
    : path;

export const getProducts = async (): Promise<Product[]> => {
  const res = await fetch(api('/api/products'));
  if (!res.ok) throw new Error('Failed to fetch products');
  return res.json();
};

export const getProductById = async (id: string): Promise<Product | null> => {
  const res = await fetch(api(`/api/products/${id}`));
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('Failed to fetch product');
  return res.json();
};

export const addProduct = async (product: Product) => {
  const res = await fetch(api('/api/products'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(product) });
  if (!res.ok) throw new Error('Failed to add product');
};

export const updateProduct = async (id: string, updates: Partial<Product>) => {
  const res = await fetch(api(`/api/products/${id}`), { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updates) });
  if (!res.ok) throw new Error('Failed to update product');
};

export const deleteProduct = async (id: string) => {
  const res = await fetch(api(`/api/products/${id}`), { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete product');
};

export const getDeliveryPersonnel = async (): Promise<DeliveryPerson[]> => {
  const res = await fetch(api('/api/delivery'));
  if (!res.ok) throw new Error('Failed to fetch delivery personnel');
  return res.json();
};

export const updateDeliveryStatus = async (deliveryPersonId: string, status: 'active' | 'offline') => {
  const res = await fetch(api(`/api/delivery/${deliveryPersonId}/status`), { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
  if (!res.ok) throw new Error('Failed to update status');
};

export const getOrders = async (): Promise<Order[]> => {
  const res = await fetch(api('/api/orders'));
  if (!res.ok) throw new Error('Failed to fetch orders');
  return res.json();
};

export const addOrder = async (order: Order) => {
  const res = await fetch(api('/api/orders'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(order) });
  if (!res.ok) throw new Error('Failed to add order');
};

export const updateOrder = async (id: string, updates: Partial<Order>) => {
  const res = await fetch(api(`/api/orders/${id}`), { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updates) });
  if (!res.ok) throw new Error('Failed to update order');
};

export const assignDeliveryPerson = async (orderId: string, deliveryPersonId: string) => {
  const res = await fetch(api(`/api/orders/${orderId}/assign`), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ deliveryPersonId }) });
  if (!res.ok) throw new Error('Failed to assign delivery person');
};

export default {
  getProducts,
  getProductById,
  addProduct,
  updateProduct,
  deleteProduct,
  getDeliveryPersonnel,
  updateDeliveryStatus,
  getOrders,
  addOrder,
  updateOrder,
  assignDeliveryPerson,
};
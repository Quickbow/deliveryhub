# DeliveryHub - System Workflow

## Complete User Flow

### 1. Landing Page (/)
- Users see three role options: Customer, Seller, and Delivery
- Each card shows the key features of that role
- Click any card or "Get Started" button to go to login

### 2. Login Page (/login)
- Three tabs for different user types
- Demo credentials are displayed for easy testing
- "Use Demo Account" button auto-fills credentials
- After successful login, users are redirected to their respective dashboard

### 3. Customer Dashboard (/customer)

#### Shop Products Tab
- Browse all available products
- Each product shows: image, name, description, price, category, stock
- Click "Add to Cart" to add items

#### Cart Tab
- View all items in cart
- Adjust quantities with +/- buttons
- Remove items with delete button
- See running total
- Click "Proceed to Checkout" to place order

#### Checkout Dialog
- Enter or edit delivery address
- Review order summary
- Confirm order
- Email notification is simulated (console log)

#### My Orders Tab
- View order history
- See order status: pending, assigned, in-transit, delivered
- View assigned delivery person
- Track order details

### 4. Seller Dashboard (/seller)

#### My Products Tab
- View all products posted by the seller
- "Add New Product" button opens dialog
- Each product card has Edit and Delete buttons
- Product dialog includes: name, description, price, category, stock, image URL

#### All Orders Tab
- View all customer orders in the system
- See order details: customer info, items, total, status
- For pending orders: "Assign Delivery Person" button
- Assignment dialog shows available delivery personnel with their status

#### Delivery Personnel Tab
- View all registered delivery workers
- See their status: active/offline
- View their current order count

### 5. Delivery Dashboard (/delivery)

#### Status Card (Top)
- Toggle switch to set status: Active/Offline
- When active: receives new delivery assignments
- When offline: no new assignments
- Shows statistics: active deliveries, in progress, completed

#### Active Orders Tab
- View all assigned and in-transit orders
- See customer details and delivery address
- "Start Delivery" button (for assigned orders)
- "Mark as Delivered" button (for in-transit orders)
- Email notifications simulated when status changes

#### Completed Tab
- View delivery history
- All orders marked as delivered

#### All Orders Tab
- Complete view of all assigned orders regardless of status

## Email Notification System (Mock)

### When emails would be sent:
1. **Delivery Assignment**: When seller assigns order to delivery person
   - Recipient: Delivery person's email
   - Content: "New delivery assigned - Order #[ID]"

2. **Order Delivered**: When delivery person marks order as delivered
   - Recipient: Customer's email
   - Content: "Your order #[ID] has been delivered"

### Current Implementation:
- Console logs simulate email sending
- Toast notifications show success messages
- Format: `📧 Email sent to [email]: [message]`

### To Connect Real Email Service:
Replace console.log statements in `mockData.ts` with actual API calls to:
- SendGrid API
- Resend API
- AWS SES
- Nodemailer
- Supabase Edge Functions with email provider

## Database Schema (Mock)

### Users Table
```typescript
{
  id: string
  email: string
  password: string
  role: 'customer' | 'seller' | 'delivery'
  name: string
}
```

### Products Table
```typescript
{
  id: string
  sellerId: string
  name: string
  description: string
  price: number
  image: string
  category: string
  stock: number
}
```

### Orders Table
```typescript
{
  id: string
  customerId: string
  customerName: string
  customerEmail: string
  products: Array<{
    productId: string
    productName: string
    quantity: number
    price: number
  }>
  totalAmount: number
  deliveryPersonId?: string
  deliveryPersonName?: string
  status: 'pending' | 'assigned' | 'in-transit' | 'delivered' | 'cancelled'
  address: string
  createdAt: string
}
```

### DeliveryPersonnel Table
```typescript
{
  id: string
  name: string
  email: string
  status: 'active' | 'offline'
  currentOrders: number
}
```

## Order Status Flow

```
pending → assigned → in-transit → delivered
   ↓          ↓           ↓
cancelled  cancelled   cancelled
```

1. **Pending**: Order placed by customer, awaiting assignment
2. **Assigned**: Seller has assigned a delivery person
3. **In-Transit**: Delivery person has started delivery
4. **Delivered**: Order successfully delivered to customer
5. **Cancelled**: Order cancelled at any stage

## Security Notes

⚠️ **Important**: This is a frontend-only demo application with:
- No password encryption
- Client-side authentication only
- No API security
- Mock database in memory

For production, implement:
- Backend API with proper authentication
- Password hashing (bcrypt)
- JWT or session-based auth
- Database with proper access controls
- HTTPS/SSL encryption
- Input validation and sanitization
- CSRF protection
- Rate limiting

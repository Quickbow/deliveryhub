# DeliveryHub - Delivery Service Website

A complete delivery service platform with three user roles: Customer, Seller, and Delivery Personnel.

## Features

### Customer Portal
- Browse product catalog
- Add items to cart with quantity management
- Place orders with delivery address
- Track order status in real-time
- View order history

### Seller Dashboard
- Add, edit, and delete products
- Manage product inventory
- View all customer orders
- Assign delivery personnel to orders
- Monitor delivery personnel availability

### Delivery Portal
- Toggle active/offline status
- Receive delivery assignments
- View assigned orders with customer details
- Update delivery status (in-transit, delivered)
- Track completed deliveries

## User Roles & Demo Credentials

### Customer
- Email: `customer@test.com`
- Password: `customer123`

### Seller
- Email: `seller@test.com`
- Password: `seller123`

### Delivery Personnel
- Email: `delivery@test.com`
- Password: `delivery123`

## How It Works

1. **Customer Flow**: Customers can browse products, add them to cart, and place orders
2. **Seller Flow**: Sellers can add products and assign delivery personnel to pending orders
3. **Delivery Flow**: Delivery personnel can set their status and manage assigned deliveries

## Email Notifications (Mock)

In a production environment, this system would send email notifications via backend services. Currently, the app simulates email notifications by:
- Logging email events to the browser console
- Showing toast notifications to users
- When a delivery person is assigned, the console shows: "📧 Email sent to [email]: New delivery assigned"
- When an order is delivered, a success message indicates email was sent to customer

To implement real email notifications, integrate with:
- Supabase Edge Functions with Resend/SendGrid
- AWS SES
- Nodemailer with SMTP service
- Or any email service provider API

## Database Structure (Mock)

The app currently uses in-memory mock data to simulate a MySQL database. The data structure includes:

- **Users**: id, email, password, role, name
- **Products**: id, sellerId, name, description, price, category, stock, image
- **Orders**: id, customerId, products[], totalAmount, deliveryPersonId, status, address, createdAt
- **DeliveryPersonnel**: id, name, email, status, currentOrders

## Tech Stack

- React 18
- React Router for navigation
- Tailwind CSS for styling
- Shadcn UI components
- Lucide React for icons
- Sonner for toast notifications

## Future Enhancements

- Real database integration (MySQL/PostgreSQL via Supabase)
- Email service integration
- Real-time WebSocket updates
- Payment gateway integration
- Order tracking with maps
- Rating and review system
- Analytics dashboard

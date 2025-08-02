# Food Delivery App

A full-stack food delivery application built with Next.js 14, MongoDB, and TypeScript.

## Features

- 🍕 Browse restaurants and menus
- 🛒 Shopping cart functionality
- 📱 Responsive design
- 🔐 User authentication
- 📦 Order tracking
- 💳 Payment integration (Stripe)
- 🖼️ Image upload (Cloudinary)

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, MongoDB, Mongoose
- **Authentication**: NextAuth.js
- **Payment**: Stripe
- **Image Storage**: Cloudinary
- **UI Icons**: Lucide React

## Getting Started

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd food-delivery-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Copy `.env.local` and update with your actual values:
   - MongoDB connection string
   - NextAuth secret
   - Stripe keys
   - Cloudinary credentials

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
├── app/                    # Next.js 13+ app directory
│   ├── api/               # API routes
│   ├── restaurants/       # Restaurant pages
│   ├── cart/             # Shopping cart
│   └── orders/           # Order management
├── components/           # Reusable components
├── lib/                 # Utility functions
├── models/              # MongoDB models
└── types/               # TypeScript definitions
```

## API Endpoints

- `GET /api/restaurants` - Get all restaurants
- `POST /api/restaurants` - Create restaurant
- `GET /api/orders` - Get orders
- `POST /api/orders` - Create order
- `POST /api/auth/register` - User registration

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License
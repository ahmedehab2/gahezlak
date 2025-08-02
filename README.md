# Gahezlak

AI-powered restaurant management platform with smart menu search, ordering, and analytics.

## 🚀 Features

- **AI-Powered Menu Search**: Intelligent search with language detection and allergy filtering
- **Smart Menu Management**: Menu items with customization options and multilingual support
- **Order Management**: Complete ordering system with payment integration (Paymob)
- **Authentication & Authorization**: JWT-based auth with role-based access control
- **Subscription Plans**: Tiered subscription system for restaurant owners
- **Analytics & Reporting**: Business analytics and reporting for shop owners
- **Admin Dashboard**: Admin panel for platform management
- **QR Code Integration**: QR code generation for restaurants

## 🏗️ Architecture

- **Framework**: Express.js with TypeScript
- **Database**: MongoDB with Mongoose ODM
- **AI Integration**: OpenAI GPT-4 for smart search and insights
- **Authentication**: JWT with bcrypt hashing
- **Payments**: Paymob gateway integration
- **File Upload**: Multer for image handling
- **File Storage**: Imgbb integration for image uploads
- **Logging**: Pino with HTTP logging

## 📁 Project Structure

```
├── controllers/     # Route handlers
├── services/        # Business logic
│   └── ai/         # AI services (search, filtering, insights)
├── models/         # MongoDB schemas
├── routes/         # API routes
├── middlewares/    # Express middleware
├── enums/          # TypeScript enums
├── errors/         # Custom error classes
├── utils/          # Helper functions
├── validators/     # Input validation
└── config/         # Configuration files
```

## 🛠️ Tech Stack

- **Language**: TypeScript
- **Runtime**: Node.js
- **Framework**: Express.js 5.x
- **Database**: MongoDB 8.x
- **ORM**: Mongoose 8.x
- **AI**: OpenAI GPT-4
- **Authentication**: JWT, bcryptjs
- **Payments**: Paymob
- **Image Processing**: Sharp
- **Logging**: Pino
- **Build Tool**: TypeScript compiler
- **Development**: tsx for hot reloading

- [Frontend Repository](https://github.com/Mohamed-Hasan-77/Gahezlak)
- [Frontend Live Demo](https://gahezlak-v1.vercel.app)

# Restaurant Management System - MongoDB Schema Documentation

## Overview
This document outlines the MongoDB schema design for a multi-tenant SaaS Restaurant Management System. The schema supports multiple restaurants/cafes with role-based user management, menu items, orders, reservations, and payments.

## Schema Design Principles
- **Multi-tenancy**: All shop-scoped data references `shopId` for proper data isolation
- **Embedded Arrays**: Used for `members` in shops and `orderItems` in orders for efficiency
- **Role-based Access Control**: Users can have different roles across different shops
- **Atomic Operations**: Critical data like order items are embedded to ensure consistency

---

## Collections Schema

### 1. shops
Stores restaurant/cafe information with embedded member management.

```json
{
  "_id": ObjectId(),
  "name": String,
  "type": String,
  "address": String,
  "phoneNumber": String,
  "email": String,
  "ownerId": ObjectId(),
  "isPaymentDone":boolean,
  "members": [
    {
      "userId": ObjectId(),
      "roleId": ObjectId()
    }
  ],
  "createdAt": Date,
  "updatedAt": Date
}
```

**Indexes:**
```javascript
db.shops.createIndex({ "members.userId": 1 })
db.shops.createIndex({ "ownerUserId": 1 })
```

---

### 2. users
Stores user account information.

```json
{
  "_id": ObjectId(),
  "name": String,
  "email": String,
  "passwordHash": String,
  "phoneNumber": String,
  "createdAt": Date,
  "updatedAt": Date
}
```

**Indexes:**
```javascript
db.users.createIndex({ "email": 1 }, { unique: true })
```

---

### 3. roles
Defines available user roles in the system.

```json
{
  "_id": ObjectId(),
  "roleName": String
}
```

**Common Role Values:**
- Owner
- Manager
- Staff
- Customer

---

### 4. menu_items
Stores menu items for each shop.

```json
{
  "_id": ObjectId(),
  "shopId": ObjectId(),
  "name": String,
  "description": String,
  "price": Number,
  "category": String,
  "isAvailable": Boolean,
  "createdAt": Date,
  "updatedAt": Date
}
```

**Indexes:**
```javascript
db.menu_items.createIndex({ "shopId": 1 })
db.menu_items.createIndex({ "shopId": 1, "category": 1 })
```

---

### 5. orders
Stores customer orders with embedded order items.

```json
{
  "_id": ObjectId(),
  "shopId": ObjectId(),
  "userId": ObjectId(),
  "orderStatus": String,
  "totalAmount": Number,
  "orderItems": [
    {
      "menuItemId": ObjectId(),
      "quantity": Number,
      "customizationDetails": String,
      "price": Number
    }
  ],
  "createdAt": Date,
  "updatedAt": Date
}
```

**Order Status Values:**
- Pending
- Confirmed
- Preparing
- Ready
- Delivered
- Cancelled

**Indexes:**
```javascript
db.orders.createIndex({ "shopId": 1, "createdAt": -1 })
db.orders.createIndex({ "userId": 1 })
db.orders.createIndex({ "shopId": 1, "orderStatus": 1 })
```

---

### 6. table_reservations
Manages table reservations for dine-in customers.

```json
{
  "_id": ObjectId(),
  "shopId": ObjectId(),
  "userId": ObjectId(),
  "tableNumber": Number,
  "reservationDateTime": Date,
  "numberOfGuests": Number,
  "status": String,
  "createdAt": Date,
  "updatedAt": Date
}
```

**Reservation Status Values:**
- Pending
- Confirmed
- Seated
- Completed
- Cancelled
- No-show

**Indexes:**
```javascript
db.table_reservations.createIndex({ "shopId": 1, "reservationDateTime": 1 })
db.table_reservations.createIndex({ "shopId": 1, "status": 1 })
db.table_reservations.createIndex({ "userId": 1 })
```

---

### 7. payments
Tracks payment transactions for orders.

```json
{
  "_id": ObjectId(),
  "shopId": ObjectId(),
  "orderId": ObjectId(),
  "paymentMethod": String,
  "paymentStatus": String,
  "amount": Number,
  "transactionId": String,
  "createdAt": Date,
  "updatedAt": Date
}
```

**Payment Method Values:**
- CreditCard
- DebitCard
- Cash
- DigitalWallet
- BankTransfer

**Payment Status Values:**
- Pending
- Processing
- Completed
- Failed
- Refunded

**Indexes:**
```javascript
db.payments.createIndex({ "orderId": 1 })
db.payments.createIndex({ "shopId": 1, "createdAt": -1 })
db.payments.createIndex({ "transactionId": 1 }, { unique: true })
```

---

## Entity Relationship Diagram

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│     USERS       │         │     ROLES       │         │     SHOPS       │
├─────────────────┤         ├─────────────────┤         ├─────────────────┤
│ _id (PK)        │         │ _id (PK)        │         │ _id (PK)        │
│ name            │         │ roleName        │         │ name            │
│ email           │         │                 │         │ type            │
│ passwordHash    │         │                 │         │ address         │
│ phoneNumber     │         │                 │         │ phoneNumber     │
│ createdAt       │         │                 │         │ email           │
│ updatedAt       │         │                 │         │ ownerUserId (FK)│
└─────────────────┘         └─────────────────┘         │ members[]       │
         │                           │                   │ - userId (FK)   │
         │                           │                   │ - roleId (FK)   │
         │                           │                   │ createdAt       │
         │                           │                   │ updatedAt       │
         │                           │                   └─────────────────┘
         │                           │                            │
         │                           │                            │
         └───────────────┐           │           ┌────────────────┘
                         │           │           │
                         ▼           ▼           ▼
                    ┌─────────────────────────────────┐
                    │        SHOP_MEMBERS             │
                    │      (Embedded Array)           │
                    ├─────────────────────────────────┤
                    │ userId (FK) ──────────────────► │
                    │ roleId (FK) ──────────────────► │
                    └─────────────────────────────────┘
                                     │
                                     │
         ┌───────────────────────────┼───────────────────────────┐
         │                           │                           │
         ▼                           ▼                           ▼
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│   MENU_ITEMS    │         │     ORDERS      │         │TABLE_RESERVATIONS│
├─────────────────┤         ├─────────────────┤         ├─────────────────┤
│ _id (PK)        │         │ _id (PK)        │         │ _id (PK)        │
│ shopId (FK) ────┼─────────┤ shopId (FK) ────┼─────────┤ shopId (FK) ────┤
│ name            │         │ userId (FK) ────┼─────┐   │ userId (FK) ────┼─────┐
│ description     │         │ orderStatus     │     │   │ tableNumber     │     │
│ price           │         │ totalAmount     │     │   │ reservationDT   │     │
│ category        │         │ orderItems[]    │     │   │ numberOfGuests  │     │
│ isAvailable     │         │ - menuItemId(FK)│◄────┼───│ status          │     │
│ createdAt       │         │ - quantity      │     │   │ createdAt       │     │
│ updatedAt       │         │ - customization │     │   │ updatedAt       │     │
└─────────────────┘         │ - price         │     │   └─────────────────┘     │
                            │ createdAt       │     │                           │
                            │ updatedAt       │     │                           │
                            └─────────────────┘     │                           │
                                     │              │                           │
                                     │              │                           │
                                     ▼              │                           │
                            ┌─────────────────┐     │                           │
                            │    PAYMENTS     │     │                           │
                            ├─────────────────┤     │                           │
                            │ _id (PK)        │     │                           │
                            │ shopId (FK) ────┼─────┼───────────────────────────┘
                            │ orderId (FK) ───┼─────┘
                            │ paymentMethod   │
                            │ paymentStatus   │
                            │ amount          │
                            │ transactionId   │
                            │ createdAt       │
                            │ updatedAt       │
                            └─────────────────┘
```

---

## Relationships Summary

### Primary Relationships
- **USERS** ←→ **SHOPS** (Many-to-Many via embedded `members` array)
- **ROLES** ←→ **SHOPS** (Many-to-Many via embedded `members` array)
- **USERS** → **SHOPS** (One-to-Many: `ownerUserId`)

### Shop-Scoped Relationships
- **SHOPS** → **MENU_ITEMS** (One-to-Many)
- **SHOPS** → **ORDERS** (One-to-Many)
- **SHOPS** → **TABLE_RESERVATIONS** (One-to-Many)
- **SHOPS** → **PAYMENTS** (One-to-Many)

### Order-Related Relationships
- **USERS** → **ORDERS** (One-to-Many)
- **USERS** → **TABLE_RESERVATIONS** (One-to-Many)
- **MENU_ITEMS** ←→ **ORDERS** (Many-to-Many via embedded `orderItems`)
- **ORDERS** → **PAYMENTS** (One-to-Many)

---

## Common Query Patterns

### Get user's shops with roles
```javascript
db.shops.find({
  "members.userId": ObjectId("user_id")
})
```

### Get shop menu items
```javascript
db.menu_items.find({
  "shopId": ObjectId("shop_id"),
  "isAvailable": true
})
```

### Get shop orders for today
```javascript
db.orders.find({
  "shopId": ObjectId("shop_id"),
  "createdAt": {
    $gte: ISODate("2024-06-30T00:00:00Z"),
    $lt: ISODate("2024-07-01T00:00:00Z")
  }
})
```

### Get pending reservations
```javascript
db.table_reservations.find({
  "shopId": ObjectId("shop_id"),
  "status": "Pending",
  "reservationDateTime": {
    $gte: new Date()
  }
})
```

---

## Performance Considerations

1. **Indexing**: All foreign key fields and frequently queried fields are indexed
2. **Embedded Arrays**: Used for `members` and `orderItems` to reduce joins
3. **Data Isolation**: `shopId` ensures proper multi-tenant data separation
4. **Query Optimization**: Compound indexes for common query patterns

---

## Scaling Considerations

1. **Member Management**: Current embedded approach works well for teams up to 50-100 members
2. **Large Teams**: Consider separate `shop_users` collection for shops with 100+ members
3. **Sharding**: Can shard by `shopId` for horizontal scaling
4. **Read Replicas**: Use for analytics and reporting queries

---

## Security Notes

1. Always validate `shopId` in application logic to prevent cross-tenant data access
2. Implement proper authentication and authorization middleware
3. Use role-based permissions to control feature access
4. Encrypt sensitive data like payment information
5. Implement audit logging for critical operations
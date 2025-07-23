# 🍽️ AI API Documentation for Frontend

---

## 1. Batch Process Endpoint

### Purpose
- Triggers AI processing for existing menu items in the database (e.g., to extract allergens, dietary tags, etc.).
- Use when you want to (re-)analyze menu items already in the system.

### Endpoint
```
POST /api/v1/ai/menu/batch-process
```

### Request Body
- To process specific items:
  ```json
  { "itemIds": ["<itemId1>", "<itemId2>"] }
  ```
- To process **all** items for the current shop:
  ```json
  { "processAll": true }
  ```

### Response
```json
{
  "message": "Batch processing completed: 2 processed, 0 failed",
  "data": {
    "processed": 2,
    "failed": 0,
    "total": 2,
    "details": [
      "Processed: BBQ Chicken",
      "Processed: Classic American"
    ]
  }
}
```

### When to Use
- After adding or updating menu items and you want to update their AI data (allergens, tags, etc.).
- For periodic re-analysis.

---

## 2. Super Search Endpoint

### Purpose
- Combines allergy filtering, health insights, and smart search in one endpoint.
- Use for advanced menu search based on user’s allergies, dietary needs, health conditions, and natural language queries.

### Endpoint
```
POST /api/v1/ai/menu/super-search
```

### Request Body
```json
{
  "query": "vegan, no nuts, under 100 EGP",
  "limit": 20,
  "includeUnavailable": false // Optional: if false, only items with isAvailable: true will be returned
}
```

### Response
```json
{
  "message": "Super search completed",
  "data": {
    "safeItems": [ /* array of menu items with isAvailable: true */ ],
    "unsafeItems": [ /* array of menu items that don't match criteria */ ]
  }
}
```

### When to Use
- When a user wants to search the menu with complex dietary/health/allergy requirements.
- For personalized menu recommendations.

---

## 3. Menu Vision Extraction Endpoint

### Purpose
- Extracts menu items from uploaded images or PDFs using AI (OCR + GPT-4 Vision).
- Returns structured menu data for review/editing before saving.

### Endpoint
```
POST /api/v1/ai/menu/vision-extract
```

### Request
- **Multipart/form-data** with field `files` (multiple images) or a single PDF.
- **Authentication required.**

### Response
```json
{
  "message": "Menu extraction completed",
  "data": {
    "categories": [
      { "name": { "en": "Pizza", "ar": "" }, "description": { "en": "", "ar": "" } },
      { "name": { "en": "Burger", "ar": "" }, "description": { "en": "", "ar": "" } }
    ],
    "items": [
      {
        "name": { "en": "BBQ Chicken", "ar": "" },
        "description": { "en": "Barbecue chicken pizza with grilled onions and cheese.", "ar": "" },
        "price": 8,
        "category": "Pizza",
        "isAvailable": true
      },
      // ...more items
    ],
    "errors": [],
    "warnings": []
  }
}
```

### When to Use
- When uploading a new menu via images or PDF.
- To quickly digitize and review menu data before saving.

---

## 4. Bulk Insert Endpoint

### Purpose
- Saves an array of reviewed/edited menu items to the database in one request.
- Prevents duplicates (same name/category/shop).

### Endpoint
```
POST /api/v1/ai/menu/bulk-insert
```

### Request Body
```json
{
  "items": [
    {
      "name": { "en": "BBQ Chicken", "ar": "بي بي كيو دجاج" },
      "description": { "en": "Barbecue chicken pizza with grilled onions and cheese.", "ar": "" },
      "price": 8,
      "categoryId": "<categoryId>",
      "isAvailable": true
    },
    // ...more items
  ]
}
```

### Response
```json
{
  "message": "Bulk insert completed",
  "data": {
    "successCount": 2,
    "failCount": 1,
    "items": [ /* inserted items */ ],
    "errors": [
      { "index": 2, "error": "Duplicate item: BBQ Chicken in this category already exists." }
    ]
  }
}
```

### When to Use
- After reviewing/extracting menu items with the vision endpoint.
- To save multiple items at once after user review.

---

## 5. Best Practices & Integration Flow

### Typical Flow for New Menu via Images/PDF
1. **Call `/vision-extract`** to extract menu data from images/PDF.
2. **Display categories and items** to the user for review/editing.
3. **Save categories** first (if new) and get their IDs.
4. **Map items to category IDs**.
5. **Call `/bulk-insert`** to save all items at once.
6. **(Optional) Call `/batch-process`** to update AI data for new items.

### For Advanced Search
- Use `/super-search` for user-driven, personalized, or health-aware menu queries.

### Notes
- Always provide both `name.en` and `name.ar` for items and categories (can be empty string if not available).
- Handle errors and warnings in responses for better UX.
- Duplicate prevention is enforced on bulk insert (same name/category/shop).
- All endpoints require authentication and shop context.
- **Menu item availability is controlled by the `isAvailable` boolean field.**

---

**For any questions or integration help, contact the backend team!** 
import { ObjectId } from 'mongodb';
import mongoose, { Schema, Document } from 'mongoose';
import { collectionsName } from '../common/collections-name';

export interface IAIMenuData {
  _id: ObjectId;
  menuItemId: ObjectId;
  shopId: ObjectId;
  
  // Basic ingredient tracking
  ingredients: string[];
  
  // Common allergens
  allergens: string[];
  
  // Dietary tags
  dietaryTags: string[];
  
  // Basic nutritional info
  nutritionalInfo?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    sodium?: number;
  };
  
  // AI processing metadata
  aiProcessed: boolean;
  lastAIUpdate: Date;
  
  // Embeddings for semantic search
  descriptionEmbedding?: number[];
  
  createdAt: Date;
  updatedAt: Date;
}

const AIMenuDataSchema = new Schema<IAIMenuData>({
  menuItemId: { 
    type: Schema.Types.ObjectId, 
    ref: collectionsName.MENU_ITEMS, 
    required: true,
    unique: true  // One AI data entry per menu item
  },
  shopId: { 
    type: Schema.Types.ObjectId, 
    ref: collectionsName.SHOPS, 
    required: true 
  },
  ingredients: [{ 
    type: String, 
    lowercase: true,
    trim: true 
  }],
  allergens: [{ 
    type: String, 
    lowercase: true,
    trim: true,
    enum: [
      'nuts', 'peanuts', 'tree nuts', 'dairy', 'milk', 'eggs', 
      'fish', 'shellfish', 'soy', 'wheat', 'gluten', 'sesame',
      'mustard', 'celery', 'lupin', 'molluscs', 'sulphites'
    ]
  }],
  dietaryTags: [{ 
    type: String, 
    lowercase: true,
    trim: true,
    enum: [
      'vegan', 'vegetarian', 'halal', 'kosher', 'gluten-free', 
      'dairy-free', 'nut-free', 'keto', 'low-carb', 'high-protein',
      'low-sodium', 'sugar-free', 'organic', 'raw'
    ]
  }],
  nutritionalInfo: {
    calories: { type: Number, min: 0 },
    protein: { type: Number, min: 0 },
    carbs: { type: Number, min: 0 },
    fat: { type: Number, min: 0 },
    sodium: { type: Number, min: 0 }
  },
  aiProcessed: { 
    type: Boolean, 
    default: false 
  },
  lastAIUpdate: { 
    type: Date, 
    default: Date.now 
  },
  descriptionEmbedding: [{ 
    type: Number 
  }]
}, {
  timestamps: true,
  collection: collectionsName.AI_MENU_DATA
});

// Indexes for performance
AIMenuDataSchema.index({ shopId: 1 });
AIMenuDataSchema.index({ allergens: 1 });
AIMenuDataSchema.index({ dietaryTags: 1 });
AIMenuDataSchema.index({ ingredients: 1 });

export const AIMenuDataModel = mongoose.models[collectionsName.AI_MENU_DATA] || 
  mongoose.model<IAIMenuData>(collectionsName.AI_MENU_DATA, AIMenuDataSchema); 
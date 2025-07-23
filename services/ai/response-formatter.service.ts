import { IMenuItem } from '../../models/MenuItem';
import { LanguageDetectorService } from './language-detector.service';

export interface FormattedAllergyResponse {
  summary: {
    totalItems: number;
    safeItemsCount: number;
    unsafeItemsCount: number;
    detectedAllergies: string[];
    language: string;
  };
  safeItems: FormattedMenuItem[];
  unsafeItems: FormattedMenuItem[];
  recommendations: {
    message: string;
    tips: string[];
  };
  warnings?: string[];
}

export interface FormattedMenuItem {
  id: string;
  name: string;
  price: number;
  description: string;
  category: string;
  image?: string;
  isAvailable: boolean;
  dietaryTags?: string[];
  allergens?: string[];
  nutritionInfo?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
  };
}

export interface FormattedSearchResponse {
  summary: {
    totalResults: number;
    query: string;
    searchCriteria: string[];
    language: string;
  };
  items: FormattedMenuItem[];
  suggestions: string[];
  filters: {
    applied: string[];
    available: string[];
  };
}



export interface FormattedHealthResponse {
  summary: {
    query: string;
    totalResults: number;
    healthFocus: string[];
    language: string;
  };
  suitableItems: FormattedMenuItem[];
  avoidItems: FormattedMenuItem[];
  guidance: {
    title: string;
    description: string;
    tips: string[];
    warnings: string[];
  };
  nutritionAdvice: {
    recommended: string[];
    avoid: string[];
    portionGuidance: string;
  };
}

export class ResponseFormatterService {
  
  /**
   * Format allergy filter response
   */
  static formatAllergyResponse(
    safeItems: IMenuItem[],
    unsafeItems: IMenuItem[],
    extractedAllergies: string[],
    detectedLanguage: string
  ): FormattedAllergyResponse {
    const language = detectedLanguage === 'ar' ? 'Arabic' : 'English';
    
    return {
      summary: {
        totalItems: safeItems.length + unsafeItems.length,
        safeItemsCount: safeItems.length,
        unsafeItemsCount: unsafeItems.length,
        detectedAllergies: extractedAllergies,
        language
      },
      safeItems: safeItems.map(item => this.formatMenuItem(item)),
      unsafeItems: unsafeItems.map(item => this.formatMenuItem(item)),
      recommendations: this.generateAllergyRecommendations(extractedAllergies, safeItems.length, unsafeItems.length),
      warnings: this.generateAllergyWarnings(extractedAllergies, unsafeItems.length)
    };
  }

  /**
   * Format smart search response
   */
  static formatSearchResponse(
    items: IMenuItem[],
    query: string,
    searchCriteria: string[],
    detectedLanguage: string
  ): FormattedSearchResponse {
    const language = detectedLanguage === 'ar' ? 'Arabic' : 'English';
    
    return {
      summary: {
        totalResults: items.length,
        query,
        searchCriteria,
        language
      },
      items: items.map(item => this.formatMenuItem(item)),
      suggestions: this.generateSearchSuggestions(query, items.length),
      filters: {
        applied: searchCriteria,
        available: ['price', 'category', 'dietary', 'availability']
      }
    };
  }



  /**
   * Format health insights response
   */
  static formatHealthResponse(
    suitableItems: IMenuItem[],
    avoidItems: IMenuItem[],
    query: string,
    healthFocus: string[],
    detectedLanguage: string
  ): FormattedHealthResponse {
    const language = detectedLanguage === 'ar' ? 'Arabic' : 'English';
    
    return {
      summary: {
        query,
        totalResults: suitableItems.length + avoidItems.length,
        healthFocus,
        language
      },
      suitableItems: suitableItems.map(item => this.formatMenuItem(item)),
      avoidItems: avoidItems.map(item => this.formatMenuItem(item)),
      guidance: this.generateHealthGuidance(query, healthFocus),
      nutritionAdvice: this.generateNutritionAdvice(healthFocus)
    };
  }

  /**
   * Format individual menu item
   */
  private static formatMenuItem(item: IMenuItem): FormattedMenuItem {
    return {
      id: item._id.toString(),
      name: item.name.en,
      price: item.price,
      description: item.description?.en || '',
      category: item.categoryId?.toString() || 'Uncategorized',
      image: item.imgUrl,
      isAvailable: item.isAvailable,
      dietaryTags: [], // Will be populated from AI data
      allergens: [], // Will be populated from AI data
      nutritionInfo: {
        calories: undefined,
        protein: undefined,
        carbs: undefined,
        fat: undefined
      }
    };
  }

  /**
   * Generate allergy-specific recommendations
   */
  private static generateAllergyRecommendations(allergies: string[], safeCount: number, unsafeCount: number): { message: string; tips: string[] } {
    if (allergies.length === 0) {
      return {
        message: "No specific allergies detected. All menu items are available.",
        tips: [
          "You can browse our full menu safely",
          "Feel free to ask about specific ingredients",
          "Our staff can help with any dietary concerns"
        ]
      };
    }

    const tips = [
      `We found ${safeCount} safe options for your allergies`,
      "Always inform our staff about your allergies",
      "Check with our kitchen if you have severe allergies",
      "We take food safety seriously"
    ];

    if (unsafeCount > 0) {
      tips.push(`We've filtered out ${unsafeCount} items that may contain your allergens`);
    }

    return {
      message: `We've filtered our menu for your ${allergies.join(', ')} allergies. Here are your safe options:`,
      tips
    };
  }

  /**
   * Generate allergy warnings
   */
  private static generateAllergyWarnings(allergies: string[], unsafeCount: number): string[] {
    const warnings: string[] = [];
    
    if (allergies.length > 0) {
      warnings.push(`⚠️ Please inform our staff about your ${allergies.join(', ')} allergies`);
    }
    
    if (unsafeCount > 0) {
      warnings.push(`⚠️ ${unsafeCount} items were filtered out due to potential allergens`);
    }
    
    return warnings;
  }

  /**
   * Generate search suggestions
   */
  private static generateSearchSuggestions(query: string, resultCount: number): string[] {
    if (resultCount === 0) {
      return [
        "Try different keywords",
        "Check spelling",
        "Try broader terms",
        "Ask our staff for recommendations"
      ];
    }
    
    return [
      "You can refine your search further",
      "Try adding price range",
      "Filter by dietary preferences",
      "Ask for similar items"
    ];
  }



  /**
   * Generate health guidance
   */
  private static generateHealthGuidance(query: string, healthFocus: string[]): { title: string; description: string; tips: string[]; warnings: string[] } {
    return {
      title: "Health-Focused Recommendations",
      description: `Based on your health query about "${query}", we've selected items that align with your health goals.`,
      tips: [
        "Consult with healthcare professionals for medical advice",
        "These recommendations are for general guidance only",
        "Individual needs may vary",
        "Always check with our staff about ingredients"
      ],
      warnings: [
        "⚠️ This is not medical advice",
        "⚠️ Always consult healthcare professionals for dietary restrictions",
        "⚠️ Ingredients may vary, please confirm with staff"
      ]
    };
  }

  /**
   * Generate nutrition advice
   */
  private static generateNutritionAdvice(healthFocus: string[]): { recommended: string[]; avoid: string[]; portionGuidance: string } {
    return {
      recommended: [
        "Fresh vegetables and fruits",
        "Lean proteins",
        "Whole grains",
        "Healthy fats"
      ],
      avoid: [
        "Excessive sodium",
        "Added sugars",
        "Trans fats",
        "Processed foods"
      ],
      portionGuidance: "Practice portion control and listen to your body's hunger cues."
    };
  }
} 
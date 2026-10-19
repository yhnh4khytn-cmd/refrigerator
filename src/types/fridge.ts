export type CategoryType =
  | 'vegetable'
  | 'meat_seafood'
  | 'egg_bean'
  | 'dairy_drink'
  | 'staple'
  | 'condiment'
  | 'other';

export interface BoundingBox {
  ymin: number; // 0-100 percentage
  xmin: number;
  ymax: number;
  xmax: number;
}

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: CategoryType;
  source: 'photo' | 'manual' | 'preset';
  confidence: number; // 0-100
  expiryDays?: number;
  boundingBox?: BoundingBox;
  imageIndex?: number;
  addedAt: string;
}

export interface UserPreferences {
  equipment: string[];
  dietStyle: string;
  excludedIngredients: string[];
  timeLimit: number | null; // e.g. 15, 30, null
  servings: number; // 1-4
  pantryItems: string[];
  includePantry: boolean;
}

export interface RecipeIngredient {
  name: string;
  quantity: number | string;
  unit: string;
  inInventory: boolean;
  isPantry: boolean;
  substitute?: string;
}

export interface RecipeStep {
  stepNumber: number;
  text: string;
  timerMinutes?: number;
  tip?: string;
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  timeMinutes: number;
  equipment: string[];
  dietTags: string[];
  difficulty: string;
  caloriesEst: number;
  proteinEst: number;
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
  chefTips: string;
}

export interface CookLog {
  id: string;
  recipeId: string;
  recipeTitle: string;
  cookedAt: string;
  consumed: Array<{
    itemId: string;
    name: string;
    quantityDeducted: number;
    unit: string;
    remaining: number;
  }>;
}

export interface PresetScenario {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  badge: string;
  imageUrl: string;
  items: Omit<InventoryItem, 'id' | 'addedAt'>[];
  defaultPreferences: Partial<UserPreferences>;
}

import React, { useState } from 'react';
import {
  Clock,
  Flame,
  ChefHat,
  RefreshCw,
  Sparkles,
  ChevronRight,
  Send,
  Zap,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { Recipe } from '../types/fridge';
import { QUICK_TUNING_CHIPS } from '../data/presets';

interface RecipeCardProps {
  recipe: Recipe;
  index: number;
  onOpenRecipe: (recipe: Recipe) => void;
  onSwapRecipe: (recipeId: string, tuningChip?: string, userPrompt?: string) => void;
  isSwapping: boolean;
}

export const RecipeCard: React.FC<RecipeCardProps> = ({
  recipe,
  index,
  onOpenRecipe,
  onSwapRecipe,
  isSwapping,
}) => {
  const [showSwapOptions, setShowSwapOptions] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');

  const totalIngredients = recipe.ingredients.length;
  const inStockCount = recipe.ingredients.filter((i) => i.inInventory || i.isPantry).length;
  const allInStock = inStockCount === totalIngredients;

  const handleQuickSwap = (chip: string) => {
    onSwapRecipe(recipe.id, chip);
    setShowSwapOptions(false);
  };

  const handleCustomPromptSwap = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customPrompt.trim()) return;
    onSwapRecipe(recipe.id, undefined, customPrompt.trim());
    setCustomPrompt('');
    setShowSwapOptions(false);
  };

  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden relative group">
      {/* Top Banner & Tags */}
      <div>
        <div className="p-4 sm:p-5 border-b border-stone-100 bg-stone-50/50">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-white">
                推薦 #{index + 1}
              </span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-stone-200 text-stone-800 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {recipe.timeMinutes} 分鐘
              </span>
              {recipe.equipment.map((eq, i) => (
                <span
                  key={i}
                  className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-stone-100 text-stone-600"
                >
                  {eq}
                </span>
              ))}
            </div>

            {/* Quick Swap Trigger (F3-1) */}
            <button
              onClick={() => setShowSwapOptions(!showSwapOptions)}
              disabled={isSwapping}
              className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-stone-300 bg-white hover:bg-stone-100 text-stone-700 flex items-center gap-1 transition-colors shadow-2xs disabled:opacity-50"
              title="對這道菜不滿意？換一道新菜！"
            >
              <RefreshCw className={`w-3 h-3 text-stone-500 ${isSwapping ? 'animate-spin' : ''}`} />
              <span>換一道</span>
            </button>
          </div>

          <h3 className="text-lg font-black text-stone-900 group-hover:text-amber-800 transition-colors">
            {recipe.title}
          </h3>
          <p className="text-xs text-stone-500 mt-1 line-clamp-2 leading-relaxed">
            {recipe.description}
          </p>
        </div>

        {/* Nutritional & Diet badges */}
        <div className="px-4 py-2.5 bg-stone-50/30 border-b border-stone-100 flex items-center justify-between text-xs text-stone-600">
          <div className="flex items-center gap-3">
            <span>🔥 {recipe.caloriesEst} kcal</span>
            <span>💪 蛋白質 {recipe.proteinEst}g</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {recipe.dietTags.slice(0, 2).map((tag, i) => (
              <span
                key={i}
                className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded font-medium"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Ingredient Quick Snapshot */}
        <div className="p-4 sm:p-5 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-stone-700">所需食材清單</span>
            {allInStock ? (
              <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-emerald-600" />
                冰箱現有庫存 100%
              </span>
            ) : (
              <span className="text-[11px] font-bold text-amber-700 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 text-amber-600" />
                含建議替代品 ({inStockCount}/{totalIngredients})
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {recipe.ingredients.map((ing, i) => (
              <span
                key={i}
                className={`text-xs px-2 py-1 rounded-lg border flex items-center gap-1 ${
                  ing.inInventory
                    ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900 font-medium'
                    : ing.isPantry
                    ? 'bg-stone-50 border-stone-200 text-stone-700'
                    : 'bg-amber-50 border-amber-300 text-amber-900'
                }`}
              >
                <span>{ing.name}</span>
                <span className="text-[10px] opacity-75">
                  {ing.quantity} {ing.unit}
                </span>
                {!ing.inInventory && !ing.isPantry && ing.substitute && (
                  <span className="text-[10px] bg-amber-200 text-amber-900 px-1 rounded">
                    替: {ing.substitute}
                  </span>
                )}
              </span>
            ))}
          </div>

          {/* Quick Chef Tip */}
          {recipe.chefTips && (
            <div className="mt-3 p-2.5 rounded-xl bg-amber-50/50 border border-amber-100 text-xs text-amber-900">
              <span className="font-bold text-amber-800">💡 剩食大廚提醒：</span>
              <span className="ml-1 text-amber-900/90 line-clamp-1">{recipe.chefTips}</span>
            </div>
          )}
        </div>
      </div>

      {/* Dynamic Swap Drawer (F3-2, F3-3) */}
      {showSwapOptions && (
        <div className="p-4 bg-stone-900 text-white border-t border-stone-800 animate-in fade-in duration-150">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold flex items-center gap-1 text-amber-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span>微調這道菜，換個新方向：</span>
            </span>
            <button
              onClick={() => setShowSwapOptions(false)}
              className="text-stone-400 hover:text-white text-xs"
            >
              取消
            </button>
          </div>

          {/* Quick Chips (F3-2) */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {QUICK_TUNING_CHIPS.map((chip) => (
              <button
                key={chip}
                onClick={() => handleQuickSwap(chip)}
                disabled={isSwapping}
                className="px-2 py-1 bg-stone-800 hover:bg-amber-600 hover:text-white text-stone-300 rounded-md text-[11px] font-medium transition-colors border border-stone-700 disabled:opacity-50"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Custom Natural Language Input (F3-3) */}
          <form onSubmit={handleCustomPromptSwap} className="flex gap-1.5">
            <input
              type="text"
              placeholder="例如：不想用瓦斯爐、換成湯品、不要蒜頭..."
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              className="flex-1 px-3 py-1.5 bg-stone-800 border border-stone-700 rounded-lg text-xs text-white placeholder-stone-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
            <button
              type="submit"
              disabled={isSwapping || !customPrompt.trim()}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-colors disabled:opacity-50"
            >
              <Send className="w-3 h-3" />
              <span>送出換菜</span>
            </button>
          </form>
        </div>
      )}

      {/* Bottom CTA */}
      <div className="p-4 bg-stone-50 border-t border-stone-100 flex items-center justify-between">
        <span className="text-xs text-stone-500 font-medium">
          難度：<strong className="text-stone-800">{recipe.difficulty}</strong>
        </span>
        <button
          onClick={() => onOpenRecipe(recipe)}
          className="flex items-center gap-1 px-4 py-2 bg-stone-900 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition-all shadow-xs group-hover:bg-amber-600"
        >
          <span>查看做法 & 開煮</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

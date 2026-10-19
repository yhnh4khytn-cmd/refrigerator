import React, { useState } from 'react';
import {
  SlidersHorizontal,
  Flame,
  Clock,
  Users,
  ShieldAlert,
  RotateCcw,
  Plus,
  X,
  Sparkles,
  Info,
} from 'lucide-react';
import { UserPreferences, InventoryItem } from '../types/fridge';
import { COMMON_EQUIPMENT, DIET_STYLES, COMMON_EXCLUSIONS, DEFAULT_PREFERENCES } from '../data/presets';

interface PreferencesFilterProps {
  preferences: UserPreferences;
  onUpdatePreferences: (updates: Partial<UserPreferences>) => void;
  onResetPreferences: () => void;
  inventory: InventoryItem[];
}

export const PreferencesFilter: React.FC<PreferencesFilterProps> = ({
  preferences,
  onUpdatePreferences,
  onResetPreferences,
  inventory,
}) => {
  const [customExclusion, setCustomExclusion] = useState('');

  // Conflict Detection (F2-6)
  // e.g. Vegan + High Protein but no beans/tofu
  const isVegan = preferences.dietStyle === '全素';
  const isHighProtein = preferences.dietStyle === '高蛋白增肌';
  const hasBeansOrTofu = inventory.some((i) =>
    i.category === 'egg_bean' || i.name.includes('豆') || i.name.includes('豆腐')
  );
  const showVeganProteinConflict = isVegan && isHighProtein && !hasBeansOrTofu;

  // e.g. No fire selected but only raw meat present
  const isNoFire = preferences.equipment.includes('免開火') && preferences.equipment.length === 1;
  const hasRawMeat = inventory.some((i) => i.category === 'meat_seafood');
  const showRawMeatNoFireConflict = isNoFire && hasRawMeat;

  const toggleEquipment = (eqId: string) => {
    const exists = preferences.equipment.includes(eqId);
    let next: string[];
    if (exists) {
      if (preferences.equipment.length === 1) return; // Keep at least one
      next = preferences.equipment.filter((id) => id !== eqId);
    } else {
      next = [...preferences.equipment, eqId];
    }
    onUpdatePreferences({ equipment: next });
  };

  const addExclusion = (tag: string) => {
    const clean = tag.trim();
    if (!clean || preferences.excludedIngredients.includes(clean)) return;
    onUpdatePreferences({
      excludedIngredients: [...preferences.excludedIngredients, clean],
    });
  };

  const removeExclusion = (tag: string) => {
    onUpdatePreferences({
      excludedIngredients: preferences.excludedIngredients.filter((t) => t !== tag),
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-5 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-stone-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-sm">
            F2
          </div>
          <div>
            <h3 className="font-bold text-stone-900 text-base flex items-center gap-2">
              客製飲食偏好與設備限制
            </h3>
            <p className="text-xs text-stone-500">
              嚴格遵守你的廚房條件，確保生成的食譜在家絕對做得出來
            </p>
          </div>
        </div>

        <button
          onClick={onResetPreferences}
          className="flex items-center gap-1 text-xs text-stone-400 hover:text-stone-700 font-medium transition-colors"
          title="恢復預設值"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>重設設定</span>
        </button>
      </div>

      {/* Conflict Warning Alerts (F2-6) */}
      {showVeganProteinConflict && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">條件衝突提示：全素 ＋ 高蛋白</p>
            <p className="mt-0.5 text-amber-800">
              目前冰箱庫存中未發現豆腐、毛豆或豆製品，建議先手動新增豆類食材，或切換為一般飲食以確保熱量充足！
            </p>
          </div>
        </div>
      )}

      {showRawMeatNoFireConflict && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 flex items-start gap-2.5">
          <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">食安提醒：僅選「免開火」但冰箱有生肉</p>
            <p className="mt-0.5 text-rose-800">
              生肉或海鮮需充分加熱煮熟，建議至少勾選微波爐、電鍋或單口瓦斯爐。
            </p>
          </div>
        </div>
      )}

      {/* 1. Equipment Multi-select (F2-1) */}
      <div>
        <label className="block text-xs font-bold text-stone-800 mb-2 flex items-center justify-between">
          <span>1. 可用烹調設備（可多選，食譜絕不超出範圍）</span>
          <span className="text-[11px] font-normal text-stone-400">已選 {preferences.equipment.length} 種</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {COMMON_EQUIPMENT.map((eq) => {
            const isSelected = preferences.equipment.includes(eq.id);
            return (
              <button
                key={eq.id}
                type="button"
                onClick={() => toggleEquipment(eq.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                    : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                }`}
              >
                <span>{eq.icon}</span>
                <span>{eq.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Diet Style (F2-2) & Servings & Time limit */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Diet Style */}
        <div>
          <label className="block text-xs font-bold text-stone-800 mb-2">
            2. 飲食目標與風格
          </label>
          <select
            value={preferences.dietStyle}
            onChange={(e) => onUpdatePreferences({ dietStyle: e.target.value })}
            className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium text-stone-800 focus:ring-2 focus:ring-amber-500 focus:outline-none"
          >
            {DIET_STYLES.map((d) => (
              <option key={d.id} value={d.id}>
                {d.label}（{d.desc}）
              </option>
            ))}
          </select>
        </div>

        {/* Time Limit (F2-3) */}
        <div>
          <label className="block text-xs font-bold text-stone-800 mb-2 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-stone-500" />
            <span>3. 烹調時間限制</span>
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { val: 15, label: '極速 15 分' },
              { val: 30, label: '30 分鐘' },
              { val: null, label: '不限時間' },
            ].map((opt) => (
              <button
                key={String(opt.val)}
                type="button"
                onClick={() => onUpdatePreferences({ timeLimit: opt.val })}
                className={`py-1.5 px-2 rounded-xl text-xs font-medium border transition-all text-center ${
                  preferences.timeLimit === opt.val
                    ? 'bg-stone-900 text-white border-stone-900 font-bold'
                    : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Servings (F2-4) */}
        <div>
          <label className="block text-xs font-bold text-stone-800 mb-2 flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-stone-500" />
            <span>4. 用餐份數</span>
          </label>
          <div className="grid grid-cols-4 gap-1.5">
            {[1, 2, 3, 4].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => onUpdatePreferences({ servings: num })}
                className={`py-1.5 rounded-xl text-xs font-medium border transition-all text-center ${
                  preferences.servings === num
                    ? 'bg-amber-500 text-white border-amber-500 font-bold'
                    : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                }`}
              >
                {num} 人份
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Excluded Ingredients (F2-2) */}
      <div>
        <label className="block text-xs font-bold text-stone-800 mb-1.5">
          5. 排除食材／過敏源（絕對不會出現在菜單中）
        </label>
        <div className="flex flex-wrap items-center gap-1.5 mb-2">
          {preferences.excludedIngredients.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-100 text-rose-900 border border-rose-200 text-xs font-medium"
            >
              <span>🚫 {tag}</span>
              <button
                type="button"
                onClick={() => removeExclusion(tag)}
                className="hover:text-rose-700"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}

          {preferences.excludedIngredients.length === 0 && (
            <span className="text-stone-400 text-xs italic">尚未設定排除食材</span>
          )}
        </div>

        {/* Quick add chips */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-stone-400 text-[11px]">常見排除：</span>
          {COMMON_EXCLUSIONS.filter(
            (tag) => !preferences.excludedIngredients.includes(tag)
          ).map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => addExclusion(tag)}
              className="px-2 py-0.5 rounded-md bg-stone-100 hover:bg-stone-200 text-stone-600 text-[11px] transition-colors"
            >
              + {tag}
            </button>
          ))}

          {/* Custom tag input */}
          <div className="inline-flex items-center ml-1">
            <input
              type="text"
              placeholder="自訂排除（如：洋蔥）"
              value={customExclusion}
              onChange={(e) => setCustomExclusion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addExclusion(customExclusion);
                  setCustomExclusion('');
                }
              }}
              className="px-2 py-0.5 border border-stone-300 rounded text-[11px] w-36 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
            {customExclusion && (
              <button
                type="button"
                onClick={() => {
                  addExclusion(customExclusion);
                  setCustomExclusion('');
                }}
                className="ml-1 px-2 py-0.5 bg-stone-800 text-white rounded text-[11px]"
              >
                新增
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

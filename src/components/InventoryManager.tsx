import React, { useState } from 'react';
import {
  Check,
  AlertTriangle,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Sparkles,
  Info,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { InventoryItem, CategoryType } from '../types/fridge';
import { CATEGORY_LABELS } from '../data/presets';

interface InventoryManagerProps {
  items: InventoryItem[];
  selectedItemId: string | null;
  onSelectItem: (id: string | null) => void;
  onUpdateItem: (id: string, updates: Partial<InventoryItem>) => void;
  onDeleteItem: (id: string) => void;
  onAddItem: (item: Omit<InventoryItem, 'id' | 'addedAt'>) => void;
  onConfirmConfidence: (id: string) => void;
  includePantry: boolean;
  onTogglePantry: (include: boolean) => void;
  pantryItems: string[];
  mergedCount?: number;
  onGenerateRecipes: () => void;
  isGeneratingRecipes: boolean;
}

export const InventoryManager: React.FC<InventoryManagerProps> = ({
  items,
  selectedItemId,
  onSelectItem,
  onUpdateItem,
  onDeleteItem,
  onAddItem,
  onConfirmConfidence,
  includePantry,
  onTogglePantry,
  pantryItems,
  mergedCount = 0,
  onGenerateRecipes,
  isGeneratingRecipes,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showPantryDetails, setShowPantryDetails] = useState(false);

  // New item form state
  const [newName, setNewName] = useState('');
  const [newQty, setNewQty] = useState(1);
  const [newUnit, setNewUnit] = useState('顆');
  const [newCategory, setNewCategory] = useState<CategoryType>('vegetable');

  const filteredItems = items.filter((item) => {
    if (categoryFilter === 'all') return true;
    return item.category === categoryFilter;
  });

  const lowConfidenceCount = items.filter((i) => i.confidence < 70).length;

  const handleCreateNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    onAddItem({
      name: newName.trim(),
      quantity: Number(newQty) || 1,
      unit: newUnit,
      category: newCategory,
      source: 'manual',
      confidence: 100,
    });
    setNewName('');
    setNewQty(1);
    setShowAddForm(false);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-stone-200 flex flex-wrap items-center justify-between gap-3 bg-stone-50/70">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-stone-900 text-base">
              冰箱庫存清單（{items.length} 樣）
            </h3>
            {lowConfidenceCount > 0 && (
              <span className="text-xs bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-amber-700" />
                {lowConfidenceCount} 樣待確認
              </span>
            )}
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            AI 已自動解析數量與單位，您可以直接修改、增刪食材
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-stone-300 bg-white hover:bg-stone-50 text-stone-800 text-xs font-medium transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>手動新增食材</span>
          </button>

          <button
            onClick={onGenerateRecipes}
            disabled={items.length === 0 || isGeneratingRecipes}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-all shadow-md shadow-amber-500/20 disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isGeneratingRecipes ? '食譜生成中...' : '生成客製食譜'}</span>
          </button>
        </div>
      </div>

      {/* Merged Items Banner (F1-6) */}
      {mergedCount > 0 && (
        <div className="px-4 py-2 bg-blue-50 border-b border-blue-100 text-xs text-blue-900 flex items-center gap-2">
          <Layers className="w-4 h-4 text-blue-600 shrink-0" />
          <span>
            智慧合併：系統在多張照片中偵測到相同的食材，已自動為您合併加總數量。
          </span>
        </div>
      )}

      {/* Manual Add Drawer */}
      {showAddForm && (
        <form
          onSubmit={handleCreateNew}
          className="p-4 bg-stone-50 border-b border-stone-200 animate-in fade-in duration-150"
        >
          <div className="font-bold text-xs text-stone-700 mb-2">手動加入冰箱食材</div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
            <input
              type="text"
              placeholder="食材名稱（例如：高麗菜）"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="px-3 py-1.5 bg-white border border-stone-300 rounded-lg text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
              autoFocus
            />
            <div className="flex gap-1">
              <input
                type="number"
                min="0.1"
                step="0.5"
                placeholder="數量"
                value={newQty}
                onChange={(e) => setNewQty(parseFloat(e.target.value) || 1)}
                className="w-20 px-2 py-1.5 bg-white border border-stone-300 rounded-lg text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
              <select
                value={newUnit}
                onChange={(e) => setNewUnit(e.target.value)}
                className="flex-1 px-2 py-1.5 bg-white border border-stone-300 rounded-lg text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
              >
                <option value="顆">顆</option>
                <option value="把">把</option>
                <option value="塊">塊</option>
                <option value="盒">盒</option>
                <option value="朵">朵</option>
                <option value="條">條</option>
                <option value="包">包</option>
                <option value="片">片</option>
                <option value="罐">罐</option>
                <option value="公克">公克</option>
                <option value="適量">適量</option>
              </select>
            </div>
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value as CategoryType)}
              className="px-2 py-1.5 bg-white border border-stone-300 rounded-lg text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
            >
              <option value="vegetable">生鮮蔬果</option>
              <option value="meat_seafood">肉品海鮮</option>
              <option value="egg_bean">蛋豆製品</option>
              <option value="dairy_drink">乳品飲料</option>
              <option value="staple">主食麵飯</option>
              <option value="condiment">調味醬料</option>
              <option value="other">其他食材</option>
            </select>
            <div className="flex gap-1">
              <button
                type="submit"
                className="flex-1 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition-colors"
              >
                加入
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1.5 bg-stone-200 hover:bg-stone-300 text-stone-700 rounded-lg text-xs transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Category Pills Filter */}
      <div className="px-4 py-2 border-b border-stone-100 flex items-center gap-1.5 overflow-x-auto text-xs">
        <button
          onClick={() => setCategoryFilter('all')}
          className={`px-2.5 py-1 rounded-full font-medium transition-colors ${
            categoryFilter === 'all'
              ? 'bg-stone-900 text-white'
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
          }`}
        >
          全部 ({items.length})
        </button>
        {Object.entries(CATEGORY_LABELS).map(([catKey, catInfo]) => {
          const count = items.filter((i) => i.category === catKey).length;
          if (count === 0) return null;
          return (
            <button
              key={catKey}
              onClick={() => setCategoryFilter(catKey)}
              className={`px-2.5 py-1 rounded-full font-medium transition-colors flex items-center gap-1 ${
                categoryFilter === catKey
                  ? 'bg-stone-900 text-white'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              <span>{catInfo.icon}</span>
              <span>{catInfo.label}</span>
              <span className="opacity-70">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Item List / Cards */}
      <div className="divide-y divide-stone-100 max-h-[380px] overflow-y-auto">
        {filteredItems.length === 0 ? (
          <div className="py-10 text-center text-stone-400 text-xs">
            目前無食材，請上傳照片辨識或點擊「手動新增食材」
          </div>
        ) : (
          filteredItems.map((item) => {
            const isSelected = selectedItemId === item.id;
            const isEditing = editingId === item.id;
            const isLowConfidence = item.confidence < 70;
            const catMeta = CATEGORY_LABELS[item.category] || CATEGORY_LABELS.other;

            return (
              <div
                key={item.id}
                onClick={() => onSelectItem(isSelected ? null : item.id)}
                className={`p-3.5 flex flex-wrap items-center justify-between gap-2 transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-amber-50/80 ring-1 ring-amber-300'
                    : 'hover:bg-stone-50'
                }`}
              >
                {/* Left: Item name & tags */}
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg border ${catMeta.color}`}
                  >
                    {catMeta.icon}
                  </div>
                  <div>
                    {isEditing ? (
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => onUpdateItem(item.id, { name: e.target.value })}
                          className="px-2 py-0.5 border border-stone-300 rounded text-xs font-bold w-28"
                        />
                        <input
                          type="number"
                          step="0.5"
                          value={item.quantity}
                          onChange={(e) =>
                            onUpdateItem(item.id, { quantity: parseFloat(e.target.value) || 0 })
                          }
                          className="px-2 py-0.5 border border-stone-300 rounded text-xs w-16"
                        />
                        <input
                          type="text"
                          value={item.unit}
                          onChange={(e) => onUpdateItem(item.id, { unit: e.target.value })}
                          className="px-2 py-0.5 border border-stone-300 rounded text-xs w-12"
                        />
                        <button
                          onClick={() => setEditingId(null)}
                          className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-stone-900 text-sm">{item.name}</span>
                        <span className="text-xs font-mono bg-stone-100 text-stone-800 px-2 py-0.5 rounded-md font-semibold">
                          {item.quantity} {item.unit}
                        </span>
                        {item.expiryDays !== undefined && (
                          <span
                            className={`text-[11px] px-1.5 py-0.2 rounded font-medium ${
                              item.expiryDays <= 2
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-stone-100 text-stone-500'
                            }`}
                          >
                            剩 {item.expiryDays} 天
                          </span>
                        )}
                      </div>
                    )}

                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[11px] text-stone-400">
                        {item.source === 'photo'
                          ? `照片辨識 (${item.confidence}%)`
                          : item.source === 'preset'
                          ? `示範庫存 (${item.confidence}%)`
                          : '手動輸入'}
                      </span>

                      {/* Confidence < 70% Flag (F1-4) */}
                      {isLowConfidence && (
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            onConfirmConfidence(item.id);
                          }}
                          className="inline-flex items-center gap-1 text-[11px] bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 px-2 py-0.5 rounded font-bold cursor-pointer transition-colors"
                          title="辨識信心度低，點擊確認無誤或進行修改"
                        >
                          <AlertTriangle className="w-3 h-3 text-amber-700" />
                          <span>請確認 ⚠️</span>
                          <span className="underline ml-0.5">點此核准</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div
                  className="flex items-center gap-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => setEditingId(isEditing ? null : item.id)}
                    className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors"
                    title="編輯食材"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDeleteItem(item.id)}
                    className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="從冰箱移除"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pantry Seasoning Toggle (F1-7) */}
      <div className="p-3.5 bg-stone-50 border-t border-stone-200">
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-stone-800 select-none">
            <input
              type="checkbox"
              checked={includePantry}
              onChange={(e) => onTogglePantry(e.target.checked)}
              className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
            />
            <span>包含「家中常備調味料」（鹽、醬油、黑胡椒、食用油、蒜頭等）</span>
          </label>
          <button
            onClick={() => setShowPantryDetails(!showPantryDetails)}
            className="text-stone-500 hover:text-stone-800 text-xs flex items-center gap-0.5"
          >
            <span>{showPantryDetails ? '收起清單' : '查看常備品'}</span>
            {showPantryDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>

        {showPantryDetails && (
          <div className="mt-2.5 pt-2.5 border-t border-stone-200/80 flex flex-wrap gap-1 text-xs">
            {pantryItems.map((item, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 bg-white border border-stone-200 text-stone-600 rounded text-[11px]"
              >
                🧂 {item}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

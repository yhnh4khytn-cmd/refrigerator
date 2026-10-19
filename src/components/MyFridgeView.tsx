import React, { useState } from 'react';
import {
  Refrigerator,
  Plus,
  Trash2,
  Edit2,
  Check,
  AlertTriangle,
  Clock,
  Sparkles,
  Layers,
  Settings,
  X,
} from 'lucide-react';
import { InventoryItem, CategoryType } from '../types/fridge';
import { CATEGORY_LABELS } from '../data/presets';

interface MyFridgeViewProps {
  items: InventoryItem[];
  onUpdateItem: (id: string, updates: Partial<InventoryItem>) => void;
  onDeleteItem: (id: string) => void;
  onAddItem: (item: Omit<InventoryItem, 'id' | 'addedAt'>) => void;
  onClearAll: () => void;
  pantryItems: string[];
  onUpdatePantry: (items: string[]) => void;
  onGoToRecipes: () => void;
}

export const MyFridgeView: React.FC<MyFridgeViewProps> = ({
  items,
  onUpdateItem,
  onDeleteItem,
  onAddItem,
  onClearAll,
  pantryItems,
  onUpdatePantry,
  onGoToRecipes,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showPantrySetting, setShowPantrySetting] = useState(false);
  const [newPantryText, setNewPantryText] = useState('');

  // Add item form state
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState('顆');
  const [category, setCategory] = useState<CategoryType>('vegetable');
  const [expiryDays, setExpiryDays] = useState(4);

  const filteredItems = items.filter((item) => {
    if (activeCategory === 'all') return true;
    return item.category === activeCategory;
  });

  const expiringSoonCount = items.filter(
    (i) => i.expiryDays !== undefined && i.expiryDays <= 2
  ).length;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAddItem({
      name: name.trim(),
      quantity: Number(quantity) || 1,
      unit,
      category,
      source: 'manual',
      confidence: 100,
      expiryDays: Number(expiryDays) || 4,
    });
    setName('');
    setQuantity(1);
    setShowAddModal(false);
  };

  const handleAddPantry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPantryText.trim()) return;
    if (!pantryItems.includes(newPantryText.trim())) {
      onUpdatePantry([...pantryItems, newPantryText.trim()]);
    }
    setNewPantryText('');
  };

  const handleRemovePantry = (itemToRemove: string) => {
    onUpdatePantry(pantryItems.filter((i) => i !== itemToRemove));
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Summary */}
      <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-5 sm:p-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20">
            <Refrigerator className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-stone-900">我的冰箱庫存總覽</h2>
              <span className="text-xs bg-stone-100 text-stone-700 px-2.5 py-0.5 rounded-full font-bold">
                共 {items.length} 樣
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              庫存會在烹飪完畢後自動扣除，亦可隨時手動清點與增減
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPantrySetting(!showPantrySetting)}
            className="flex items-center gap-1.5 px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-semibold transition-colors"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>常備調味料設定</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>新增食材</span>
          </button>

          <button
            onClick={onGoToRecipes}
            disabled={items.length === 0}
            className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-amber-500/20 disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>清冰箱出菜</span>
          </button>
        </div>
      </div>

      {/* Expiring Soon Alert */}
      {expiringSoonCount > 0 && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between text-xs text-rose-900">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="font-bold">
              注意！冰箱中有 {expiringSoonCount} 樣食材建議在 1~2 天內食用完畢，優先挑選它們來做料理吧！
            </span>
          </div>
          <button
            onClick={onGoToRecipes}
            className="text-xs font-bold text-rose-800 hover:underline shrink-0 ml-2"
          >
            立即生成剩食食譜 &rarr;
          </button>
        </div>
      )}

      {/* Pantry Setting Drawer */}
      {showPantrySetting && (
        <div className="p-5 bg-stone-50 border border-stone-200 rounded-2xl space-y-3 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-xs text-stone-800 flex items-center gap-1">
              <span>🧂 家中常備調味料管理</span>
              <span className="text-stone-400 font-normal">（生成食譜時預設視為隨時可用）</span>
            </h4>
            <button
              onClick={() => setShowPantrySetting(false)}
              className="text-stone-400 hover:text-stone-700 text-xs"
            >
              關閉
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {pantryItems.map((pi) => (
              <span
                key={pi}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-stone-300 rounded-lg text-xs font-medium text-stone-700 shadow-2xs"
              >
                <span>{pi}</span>
                <button
                  onClick={() => handleRemovePantry(pi)}
                  className="text-stone-400 hover:text-rose-600 ml-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>

          <form onSubmit={handleAddPantry} className="flex gap-2 max-w-sm pt-2">
            <input
              type="text"
              placeholder="新增常備品（如：米酒、味醂、香油）"
              value={newPantryText}
              onChange={(e) => setNewPantryText(e.target.value)}
              className="flex-1 px-3 py-1.5 bg-white border border-stone-300 rounded-xl text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
            />
            <button
              type="submit"
              className="px-3 py-1.5 bg-stone-900 text-white rounded-xl text-xs font-bold hover:bg-stone-800"
            >
              加入
            </button>
          </form>
        </div>
      )}

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setActiveCategory('all')}
          className={`px-3 py-1.5 rounded-xl font-bold transition-colors whitespace-nowrap ${
            activeCategory === 'all'
              ? 'bg-stone-900 text-white shadow-xs'
              : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-100'
          }`}
        >
          全部品項 ({items.length})
        </button>
        {Object.entries(CATEGORY_LABELS).map(([catKey, catMeta]) => {
          const count = items.filter((i) => i.category === catKey).length;
          return (
            <button
              key={catKey}
              onClick={() => setActiveCategory(catKey)}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                activeCategory === catKey
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-100'
              }`}
            >
              <span>{catMeta.icon}</span>
              <span>{catMeta.label}</span>
              <span className="opacity-70 text-[11px]">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Grid of Items */}
      {filteredItems.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center text-stone-400 text-xs">
          此分類目前沒有食材，點選上方「新增食材」或使用相機拍照辨識。
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredItems.map((item) => {
            const catMeta = CATEGORY_LABELS[item.category] || CATEGORY_LABELS.other;
            const isEditing = editingId === item.id;
            const isUrgent = item.expiryDays !== undefined && item.expiryDays <= 2;

            return (
              <div
                key={item.id}
                className={`bg-white rounded-2xl p-4 border transition-all ${
                  isUrgent
                    ? 'border-rose-300 ring-1 ring-rose-200'
                    : 'border-stone-200 hover:border-amber-300'
                } shadow-xs flex flex-col justify-between`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-lg border font-semibold flex items-center gap-1 ${catMeta.color}`}
                    >
                      <span>{catMeta.icon}</span>
                      <span>{catMeta.label}</span>
                    </span>

                    {item.expiryDays !== undefined && (
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                          isUrgent
                            ? 'bg-rose-100 text-rose-800 animate-pulse'
                            : 'bg-stone-100 text-stone-600'
                        }`}
                      >
                        <Clock className="w-3 h-3" />
                        <span>剩 {item.expiryDays} 天</span>
                      </span>
                    )}
                  </div>

                  {isEditing ? (
                    <div className="space-y-2 my-2">
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => onUpdateItem(item.id, { name: e.target.value })}
                        className="w-full px-2 py-1 border border-stone-300 rounded text-xs font-bold"
                      />
                      <div className="flex gap-2">
                        <input
                          type="number"
                          step="0.5"
                          value={item.quantity}
                          onChange={(e) =>
                            onUpdateItem(item.id, {
                              quantity: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="w-20 px-2 py-1 border border-stone-300 rounded text-xs"
                        />
                        <input
                          type="text"
                          value={item.unit}
                          onChange={(e) => onUpdateItem(item.id, { unit: e.target.value })}
                          className="w-16 px-2 py-1 border border-stone-300 rounded text-xs"
                        />
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-3 py-1 bg-emerald-600 text-white rounded text-xs font-bold"
                        >
                          完成
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <h3 className="font-black text-stone-900 text-base">{item.name}</h3>
                      <p className="text-xl font-mono font-bold text-amber-700 mt-1">
                        {item.quantity}{' '}
                        <span className="text-xs font-sans text-stone-500 font-normal">
                          {item.unit}
                        </span>
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-400">
                  <span>
                    {item.source === 'photo'
                      ? '相片辨識'
                      : item.source === 'preset'
                      ? '情境示範'
                      : '手動新增'}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setEditingId(isEditing ? null : item.id)}
                      className="p-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-lg"
                      title="編輯"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteItem(item.id)}
                      className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                      title="刪除"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Clear All Footer */}
      {items.length > 0 && (
        <div className="text-center pt-2">
          <button
            onClick={() => {
              if (window.confirm('確定要清空冰箱所有食材嗎？')) {
                onClearAll();
              }
            }}
            className="text-xs text-stone-400 hover:text-rose-600 transition-colors"
          >
            清空目前冰箱所有庫存
          </button>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-stone-200 animate-in zoom-in-95">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-stone-900 text-base">手動新增食材</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-stone-400 hover:text-stone-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  食材名稱
                </label>
                <input
                  type="text"
                  placeholder="例如：高麗菜、去骨雞腿肉、板豆腐"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  autoFocus
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    數量
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.1"
                    value={quantity}
                    onChange={(e) => setQuantity(parseFloat(e.target.value) || 1)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    單位
                  </label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  >
                    <option value="顆">顆</option>
                    <option value="把">把</option>
                    <option value="盒">盒</option>
                    <option value="條">條</option>
                    <option value="塊">塊</option>
                    <option value="朵">朵</option>
                    <option value="包">包</option>
                    <option value="片">片</option>
                    <option value="罐">罐</option>
                    <option value="公克">公克</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    食材類別
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as CategoryType)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  >
                    <option value="vegetable">生鮮蔬果</option>
                    <option value="meat_seafood">肉品海鮮</option>
                    <option value="egg_bean">蛋豆製品</option>
                    <option value="dairy_drink">乳品飲料</option>
                    <option value="staple">主食麵飯</option>
                    <option value="condiment">調味醬料</option>
                    <option value="other">其他</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    建議保存天數
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="90"
                    value={expiryDays}
                    onChange={(e) => setExpiryDays(parseInt(e.target.value) || 4)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2 text-xs font-semibold text-stone-600 bg-stone-100 rounded-xl hover:bg-stone-200"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-bold text-white bg-amber-500 rounded-xl hover:bg-amber-600 shadow-md shadow-amber-500/20"
                >
                  新增入庫
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

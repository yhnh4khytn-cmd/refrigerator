import React, { useState } from 'react';
import {
  X,
  AlertCircle,
  CheckCircle2,
  Minus,
  Plus,
  ArrowRight,
  Sparkles,
  Utensils,
} from 'lucide-react';
import { Recipe, InventoryItem } from '../types/fridge';

interface DeductionModalProps {
  recipe: Recipe;
  inventory: InventoryItem[];
  onConfirmDeduction: (
    deductions: Array<{
      itemId: string;
      name: string;
      quantityDeducted: number;
      unit: string;
      remaining: number;
    }>
  ) => void;
  onClose: () => void;
}

export const DeductionModal: React.FC<DeductionModalProps> = ({
  recipe,
  inventory,
  onConfirmDeduction,
  onClose,
}) => {
  // Map recipe ingredients to inventory items
  const initialDeductions = recipe.ingredients
    .map((ing) => {
      // Find matching item in inventory
      const matched = inventory.find(
        (inv) =>
          inv.name.toLowerCase() === ing.name.toLowerCase() ||
          inv.name.includes(ing.name) ||
          ing.name.includes(inv.name)
      );

      if (!matched) return null;

      const numDeduct = typeof ing.quantity === 'number' ? ing.quantity : parseFloat(String(ing.quantity)) || 1;
      const initialDeduct = Math.min(matched.quantity, numDeduct);

      return {
        itemId: matched.id,
        name: matched.name,
        currentStock: matched.quantity,
        quantityDeducted: initialDeduct,
        unit: matched.unit,
      };
    })
    .filter(Boolean) as Array<{
    itemId: string;
    name: string;
    currentStock: number;
    quantityDeducted: number;
    unit: string;
  }>;

  const [itemsToDeduct, setItemsToDeduct] = useState(initialDeductions);

  const updateDeduction = (itemId: string, val: number) => {
    setItemsToDeduct((prev) =>
      prev.map((item) => {
        if (item.itemId !== itemId) return item;
        const validVal = Math.max(0, Math.min(item.currentStock, Math.round(val * 10) / 10));
        return {
          ...item,
          quantityDeducted: validVal,
        };
      })
    );
  };

  const handleConfirm = () => {
    const finalResult = itemsToDeduct.map((item) => {
      const remaining = Math.max(0, item.currentStock - item.quantityDeducted);
      return {
        itemId: item.itemId,
        name: item.name,
        quantityDeducted: item.quantityDeducted,
        unit: item.unit,
        remaining,
      };
    });
    onConfirmDeduction(finalResult);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-stone-200 bg-amber-50/70 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-700 rounded-full"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-6 h-6 rounded-lg bg-amber-500 text-white flex items-center justify-center text-xs font-bold">
              F3
            </span>
            <span className="text-xs font-bold text-amber-900 tracking-wide uppercase">
              自動扣庫存預覽
            </span>
          </div>
          <h3 className="text-lg font-black text-stone-900">
            恭喜大廚！美味「{recipe.title}」已完成 🎉
          </h3>
          <p className="text-xs text-stone-600 mt-1">
            系統已為您試算本餐使用的食材數量，您可以手動微調後確認扣庫存。
          </p>
        </div>

        {/* Deduction Items Table */}
        <div className="p-5 max-h-[380px] overflow-y-auto divide-y divide-stone-100">
          {itemsToDeduct.length === 0 ? (
            <div className="py-8 text-center text-stone-400 text-xs">
              此食譜主要使用常備品，無須扣除生鮮庫存。
            </div>
          ) : (
            itemsToDeduct.map((item) => {
              const remaining = Math.max(0, item.currentStock - item.quantityDeducted);
              const willBeEmpty = remaining <= 0;

              return (
                <div key={item.itemId} className="py-3 flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-stone-900 text-sm">{item.name}</span>
                      {willBeEmpty && (
                        <span className="text-[10px] bg-rose-100 text-rose-800 px-1.5 py-0.2 rounded font-medium">
                          用完移出
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-stone-500 mt-0.5 flex items-center gap-2">
                      <span>原庫存: {item.currentStock} {item.unit}</span>
                      <ArrowRight className="w-3 h-3 text-stone-400" />
                      <span className={`font-bold ${willBeEmpty ? 'text-rose-600' : 'text-emerald-700'}`}>
                        扣除後剩: {remaining} {item.unit}
                      </span>
                    </div>
                  </div>

                  {/* Quantity Stepper */}
                  <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl">
                    <button
                      onClick={() => updateDeduction(item.itemId, item.quantityDeducted - (item.unit === '公克' ? 50 : 0.5))}
                      className="p-1 text-stone-600 hover:text-stone-900 hover:bg-stone-200 rounded-lg"
                      title="減少扣除"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-14 text-center font-mono font-bold text-xs text-stone-800">
                      -{item.quantityDeducted} {item.unit}
                    </span>
                    <button
                      onClick={() => updateDeduction(item.itemId, item.quantityDeducted + (item.unit === '公克' ? 50 : 0.5))}
                      className="p-1 text-stone-600 hover:text-stone-900 hover:bg-stone-200 rounded-lg"
                      title="增加扣除"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-stone-200 bg-stone-50 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-stone-600 hover:text-stone-900"
          >
            取消
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 flex items-center justify-center gap-1.5 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-500/20 transition-colors"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>確認扣除並更新冰箱庫存</span>
          </button>
        </div>
      </div>
    </div>
  );
};

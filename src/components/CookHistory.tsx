import React from 'react';
import { History, Award, Calendar, CheckCircle2, Trash2, ArrowRight } from 'lucide-react';
import { CookLog } from '../types/fridge';

interface CookHistoryProps {
  logs: CookLog[];
  onClearHistory: () => void;
}

export const CookHistory: React.FC<CookHistoryProps> = ({ logs, onClearHistory }) => {
  const totalCooked = logs.length;
  const totalIngredientsSaved = logs.reduce(
    (acc, log) => acc + log.consumed.length,
    0
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-stone-200 bg-stone-50/70 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-stone-900 text-base">烹飪紀錄與剩食守護成果</h3>
              <p className="text-xs text-stone-500">每一次扣庫存，都在減少食物浪費與省荷包！</p>
            </div>
          </div>
        </div>

        {logs.length > 0 && (
          <button
            onClick={onClearHistory}
            className="flex items-center gap-1 text-xs text-stone-400 hover:text-rose-600 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>清除所有紀錄</span>
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-3 border-b border-stone-100 bg-amber-50/30">
        <div className="bg-white p-3.5 rounded-xl border border-amber-200/60 shadow-2xs">
          <span className="text-xs text-stone-500 font-medium">累計烹飪剩食菜單</span>
          <p className="text-2xl font-black text-amber-700 mt-1">{totalCooked} <span className="text-xs font-normal text-stone-600">道</span></p>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-emerald-200/60 shadow-2xs">
          <span className="text-xs text-stone-500 font-medium">成功搶救食材品項</span>
          <p className="text-2xl font-black text-emerald-700 mt-1">{totalIngredientsSaved} <span className="text-xs font-normal text-stone-600">樣</span></p>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-blue-200/60 shadow-2xs">
          <span className="text-xs text-stone-500 font-medium">剩食拯救勳章</span>
          <p className="text-sm font-black text-blue-700 mt-2 flex items-center gap-1">
            <Award className="w-4 h-4" />
            <span>{totalCooked >= 5 ? '🏅 零浪費資深主廚' : totalCooked >= 1 ? '🌱 綠色惜食新手' : '🍳 準備啟航'}</span>
          </p>
        </div>
      </div>

      {/* Logs List */}
      <div className="divide-y divide-stone-100 max-h-[450px] overflow-y-auto">
        {logs.length === 0 ? (
          <div className="py-16 text-center text-stone-400 text-xs">
            尚未有烹飪扣庫存紀錄，點擊「食譜推薦」中的菜單並點選「我煮好了」來記錄！
          </div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="p-4 sm:p-5 hover:bg-stone-50/70 transition-colors">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <h4 className="font-black text-stone-900 text-base flex items-center gap-2">
                    <span>{log.recipeTitle}</span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      已完成扣庫存
                    </span>
                  </h4>
                  <p className="text-xs text-stone-400 mt-0.5 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>{log.cookedAt}</span>
                  </p>
                </div>
              </div>

              {/* Consumed details */}
              <div className="mt-3 bg-stone-50 rounded-xl p-3 border border-stone-200/60">
                <span className="text-[11px] font-bold text-stone-500 block mb-1.5">
                  已扣除食材：
                </span>
                <div className="flex flex-wrap gap-2">
                  {log.consumed.map((c, i) => (
                    <span
                      key={i}
                      className="text-xs px-2.5 py-1 bg-white border border-stone-200 rounded-lg text-stone-700 font-medium flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{c.name}</span>
                      <strong className="text-stone-900 font-mono">
                        -{c.quantityDeducted} {c.unit}
                      </strong>
                      <span className="text-stone-400 text-[10px]">
                        (剩餘 {c.remaining})
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

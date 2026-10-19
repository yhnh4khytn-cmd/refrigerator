import React, { useState, useEffect } from 'react';
import {
  X,
  Clock,
  Flame,
  ChefHat,
  Play,
  Pause,
  RotateCcw,
  CheckCircle,
  AlertTriangle,
  Lightbulb,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { Recipe, InventoryItem } from '../types/fridge';

interface RecipeModalProps {
  recipe: Recipe | null;
  onClose: () => void;
  onCookDone: (recipe: Recipe) => void;
  inventory: InventoryItem[];
}

export const RecipeModal: React.FC<RecipeModalProps> = ({
  recipe,
  onClose,
  onCookDone,
  inventory,
}) => {
  if (!recipe) return null;

  // Interactive step timers
  const [activeTimerStep, setActiveTimerStep] = useState<number | null>(null);
  const [timerSecondsLeft, setTimerSecondsLeft] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && timerSecondsLeft > 0) {
      interval = setInterval(() => {
        setTimerSecondsLeft((prev) => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerSecondsLeft]);

  const startStepTimer = (stepNum: number, minutes: number) => {
    setActiveTimerStep(stepNum);
    setTimerSecondsLeft(minutes * 60);
    setIsTimerRunning(true);
  };

  const toggleStepComplete = (stepNum: number) => {
    setCompletedSteps((prev) =>
      prev.includes(stepNum) ? prev.filter((s) => s !== stepNum) : [...prev, stepNum]
    );
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-stone-200 bg-stone-50/70 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-500 text-white">
              {recipe.difficulty}
            </span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-stone-200 text-stone-800 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {recipe.timeMinutes} 分鐘
            </span>
            {recipe.equipment.map((eq, i) => (
              <span
                key={i}
                className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-700"
              >
                🍳 {eq}
              </span>
            ))}
          </div>

          <h2 className="text-2xl font-black text-stone-900 tracking-tight">
            {recipe.title}
          </h2>
          <p className="text-sm text-stone-600 mt-1 leading-relaxed">
            {recipe.description}
          </p>

          <div className="flex items-center gap-4 mt-3 text-xs text-stone-600 font-medium">
            <span>🔥 預估熱量：<strong className="text-stone-900">{recipe.caloriesEst} kcal</strong></span>
            <span>💪 蛋白質：<strong className="text-stone-900">{recipe.proteinEst} g</strong></span>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 divide-y divide-stone-100">
          {/* Ingredients Section */}
          <div>
            <h3 className="font-bold text-stone-900 text-sm mb-3 flex items-center justify-between">
              <span>準備食材與調味</span>
              <span className="text-xs text-stone-500 font-normal">
                綠色：冰箱現有 ｜ 灰色：常備調味 ｜ 黃色：建議替代
              </span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {recipe.ingredients.map((ing, idx) => {
                const isPantry = ing.isPantry;
                const inInv = ing.inInventory;

                return (
                  <div
                    key={idx}
                    className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                      inInv
                        ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                        : isPantry
                        ? 'bg-stone-50 border-stone-200 text-stone-800'
                        : 'bg-amber-50 border-amber-300 text-amber-950'
                    }`}
                  >
                    <div>
                      <div className="font-bold flex items-center gap-1.5">
                        {inInv && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                        {isPantry && <span>🧂</span>}
                        <span>{ing.name}</span>
                      </div>
                      {ing.substitute && !inInv && (
                        <p className="text-[11px] text-amber-800 mt-0.5">
                          可替換為：{ing.substitute}
                        </p>
                      )}
                    </div>
                    <span className="font-mono font-bold text-stone-700">
                      {ing.quantity} {ing.unit}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Steps Section with Live Timers */}
          <div className="pt-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-stone-900 text-sm">
                料理步驟指南（點選圓圈標記完成）
              </h3>
              {completedSteps.length > 0 && (
                <span className="text-xs text-emerald-700 font-bold">
                  進度：{completedSteps.length} / {recipe.steps.length}
                </span>
              )}
            </div>

            <div className="space-y-3">
              {recipe.steps.map((st) => {
                const isCompleted = completedSteps.includes(st.stepNumber);
                const hasTimer = st.timerMinutes && st.timerMinutes > 0;
                const isThisTimerActive = activeTimerStep === st.stepNumber;

                return (
                  <div
                    key={st.stepNumber}
                    className={`p-3.5 rounded-2xl border transition-all ${
                      isCompleted
                        ? 'bg-stone-50 border-stone-200 opacity-60'
                        : 'bg-white border-stone-200 hover:border-amber-300 shadow-xs'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => toggleStepComplete(st.stepNumber)}
                        className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold transition-colors ${
                          isCompleted
                            ? 'bg-emerald-600 text-white'
                            : 'border-2 border-stone-300 text-stone-600 hover:border-amber-500'
                        }`}
                      >
                        {isCompleted ? <Check className="w-3.5 h-3.5" /> : st.stepNumber}
                      </button>

                      <div className="flex-1">
                        <p
                          className={`text-xs sm:text-sm text-stone-800 leading-relaxed ${
                            isCompleted ? 'line-through text-stone-400' : ''
                          }`}
                        >
                          {st.text}
                        </p>

                        {st.tip && (
                          <p className="text-xs text-amber-800 bg-amber-50/80 p-2 rounded-lg mt-2 flex items-start gap-1.5 border border-amber-200/50">
                            <Lightbulb className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                            <span>小撇步：{st.tip}</span>
                          </p>
                        )}

                        {/* Interactive Timer (if step specifies minutes) */}
                        {hasTimer && (
                          <div className="mt-3 flex items-center gap-2">
                            {isThisTimerActive ? (
                              <div className="flex items-center gap-2 bg-stone-900 text-white px-3 py-1.5 rounded-xl text-xs font-mono">
                                <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                                <span className="font-bold text-sm tracking-wider">
                                  {formatTimer(timerSecondsLeft)}
                                </span>
                                <button
                                  onClick={() => setIsTimerRunning(!isTimerRunning)}
                                  className="p-1 hover:text-amber-400"
                                >
                                  {isTimerRunning ? (
                                    <Pause className="w-3.5 h-3.5" />
                                  ) : (
                                    <Play className="w-3.5 h-3.5" />
                                  )}
                                </button>
                                <button
                                  onClick={() =>
                                    setTimerSecondsLeft(st.timerMinutes! * 60)
                                  }
                                  className="p-1 hover:text-amber-400"
                                >
                                  <RotateCcw className="w-3 h-3" />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() =>
                                  startStepTimer(st.stepNumber, st.timerMinutes!)
                                }
                                className="flex items-center gap-1.5 px-3 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg text-xs font-bold transition-colors"
                              >
                                <Play className="w-3 h-3 text-amber-700" />
                                <span>啟動 {st.timerMinutes} 分鐘倒數計時</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Chef Tips & Food Safety (食安提示) */}
          <div className="pt-5 space-y-3">
            {recipe.chefTips && (
              <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-2xl text-xs text-amber-950 flex items-start gap-2.5">
                <ChefHat className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-amber-900">大廚剩食活用心法</p>
                  <p className="mt-0.5 text-amber-800/90 leading-relaxed">
                    {recipe.chefTips}
                  </p>
                </div>
              </div>
            )}

            <div className="p-3 bg-stone-50 border border-stone-200 rounded-2xl text-xs text-stone-600 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-stone-800">食品安全與保存建議</p>
                <p className="mt-0.5 text-stone-500">
                  冷藏生鮮建議於 3 天內煮熟；煮好後若未立即食用，應在 2 小時內密封冷藏，再次加熱需達中心溫度 75°C 以上。
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer / CTA (F3-6) */}
        <div className="p-4 sm:p-5 border-t border-stone-200 bg-stone-50 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-stone-600 hover:text-stone-900"
          >
            返回
          </button>

          <button
            onClick={() => onCookDone(recipe)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-bold shadow-md shadow-amber-500/20 transition-all hover:scale-[1.01]"
          >
            <span>我煮好了 🍳（預覽並扣除庫存）</span>
          </button>
        </div>
      </div>
    </div>
  );
};

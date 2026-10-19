import React, { useState, useEffect, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { PhotoAnnotator } from './components/PhotoAnnotator';
import { InventoryManager } from './components/InventoryManager';
import { PreferencesFilter } from './components/PreferencesFilter';
import { RecipeCard } from './components/RecipeCard';
import { RecipeModal } from './components/RecipeModal';
import { DeductionModal } from './components/DeductionModal';
import { CookHistory } from './components/CookHistory';
import { CameraModal } from './components/CameraModal';
import { MyFridgeView } from './components/MyFridgeView';
import {
  InventoryItem,
  UserPreferences,
  Recipe,
  CookLog,
} from './types/fridge';
import {
  PRESET_SCENARIOS,
  DEFAULT_PREFERENCES,
} from './data/presets';
import {
  Sparkles,
  Camera,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  ChefHat,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';

const STORAGE_PREFS_KEY = 'fridgechef_prefs';
const STORAGE_INV_KEY = 'fridgechef_inventory';
const STORAGE_LOGS_KEY = 'fridgechef_cooklogs';

export default function App() {
  const [activeTab, setActiveTab] = useState<'scan' | 'recipes' | 'inventory' | 'history'>('scan');

  // Images state (supports 1 to 5 photos)
  const [images, setImages] = useState<string[]>([PRESET_SCENARIOS[0].imageUrl]);
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);

  // Inventory state
  const [inventory, setInventory] = useState<InventoryItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_INV_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn(e);
    }
    // Default initial items from preset
    return PRESET_SCENARIOS[0].items.map((item, idx) => ({
      ...item,
      id: `item-init-${idx}`,
      addedAt: new Date().toISOString(),
    }));
  });

  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  // User preferences state (F2-5: auto saved & restored)
  const [preferences, setPreferences] = useState<UserPreferences>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_PREFS_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn(e);
    }
    return DEFAULT_PREFERENCES;
  });

  // Generated recipes
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [swappedHistory, setSwappedHistory] = useState<string[]>([]);
  const [isGeneratingRecipes, setIsGeneratingRecipes] = useState(false);
  const [swappingRecipeId, setSwappingRecipeId] = useState<string | null>(null);

  // Modals & Cooking state
  const [activeRecipeModal, setActiveRecipeModal] = useState<Recipe | null>(null);
  const [deductionModalRecipe, setDeductionModalRecipe] = useState<Recipe | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [mergedCount, setMergedCount] = useState(0);

  // Cook history
  const [cookLogs, setCookLogs] = useState<CookLog[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_LOGS_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn(e);
    }
    return [];
  });

  // Undo mechanism (F3-8: 10-second undo countdown)
  const [undoState, setUndoState] = useState<{
    previousInventory: InventoryItem[];
    secondsLeft: number;
    logId: string;
  } | null>(null);

  // Persist inventory
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_INV_KEY, JSON.stringify(inventory));
    } catch (e) {
      console.error(e);
    }
  }, [inventory]);

  // Persist preferences
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_PREFS_KEY, JSON.stringify(preferences));
    } catch (e) {
      console.error(e);
    }
  }, [preferences]);

  // Persist cook logs
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_LOGS_KEY, JSON.stringify(cookLogs));
    } catch (e) {
      console.error(e);
    }
  }, [cookLogs]);

  // Handle undo timer countdown
  useEffect(() => {
    let timer: any = null;
    if (undoState && undoState.secondsLeft > 0) {
      timer = setTimeout(() => {
        setUndoState((prev) =>
          prev ? { ...prev, secondsLeft: prev.secondsLeft - 1 } : null
        );
      }, 1000);
    } else if (undoState && undoState.secondsLeft <= 0) {
      setUndoState(null);
    }
    return () => clearTimeout(timer);
  }, [undoState]);

  // Photo upload handler (1-5 photos)
  const handleUploadPhotos = async (files: FileList | File[]) => {
    const fileArray = Array.from(files).slice(0, 5);
    if (fileArray.length === 0) return;

    setIsAnalyzing(true);
    setMergedCount(0);

    const base64List: Array<{ data: string; mimeType: string }> = [];
    const previewUrls: string[] = [];

    for (const file of fileArray) {
      const b64 = await readFileAsBase64(file);
      base64List.push({ data: b64, mimeType: file.type || 'image/jpeg' });
      previewUrls.push(b64);
    }

    setImages(previewUrls);
    setActiveImageIndex(0);

    try {
      const response = await fetch('/api/analyze-fridge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images: base64List }),
      });

      if (!response.ok) {
        throw new Error('伺服器辨識失敗');
      }

      const data = await response.json();
      if (data.items && Array.isArray(data.items)) {
        const newItems: InventoryItem[] = data.items.map((raw: any, index: number) => ({
          id: `item-${Date.now()}-${index}`,
          name: raw.name,
          quantity: raw.quantity,
          unit: raw.unit,
          category: raw.category || 'vegetable',
          source: 'photo',
          confidence: raw.confidence ?? 85,
          expiryDays: raw.expiryDays ?? 5,
          boundingBox: raw.boundingBox,
          imageIndex: raw.imageIndex ?? 0,
          addedAt: new Date().toISOString(),
        }));

        setInventory(newItems);
        if (data.mergedCount) {
          setMergedCount(data.mergedCount);
        }
      }
    } catch (err) {
      console.error('Failed to analyze:', err);
      alert('照片辨識服務遇到問題，已為您載入預設食材供操作。');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Convert File to Base64 helper
  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Camera snap handler
  const handleCaptureFromCamera = (dataUrl: string) => {
    setImages([dataUrl]);
    setActiveImageIndex(0);
    handleUploadPhotos([dataURLtoFile(dataUrl, 'camera_snap.jpg')]);
  };

  const dataURLtoFile = (dataurl: string, filename: string) => {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  };

  // Select Preset Scenario
  const handleSelectPreset = (presetId: string) => {
    const preset = PRESET_SCENARIOS.find((p) => p.id === presetId);
    if (!preset) return;

    setImages([preset.imageUrl]);
    setActiveImageIndex(0);
    setInventory(
      preset.items.map((item, idx) => ({
        ...item,
        id: `item-preset-${presetId}-${idx}`,
        addedAt: new Date().toISOString(),
      }))
    );

    if (preset.defaultPreferences) {
      setPreferences((prev) => ({
        ...prev,
        ...preset.defaultPreferences,
      }));
    }
    setRecipes([]);
    setSelectedItemId(null);
  };

  // Generate Recipes
  const handleGenerateRecipes = async () => {
    if (inventory.length === 0) {
      alert('目前冰箱沒有食材，請先拍照辨識或手動新增！');
      return;
    }

    setIsGeneratingRecipes(true);
    setActiveTab('recipes');

    try {
      const response = await fetch('/api/generate-recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inventory,
          preferences,
          excludedTitles: swappedHistory,
        }),
      });

      if (!response.ok) {
        throw new Error('生成食譜失敗');
      }

      const data = await response.json();
      if (data.recipes && Array.isArray(data.recipes)) {
        setRecipes(data.recipes);
      }
    } catch (err: any) {
      console.error('Error generating recipes:', err);
      alert('食譜生成發生錯誤，請稍後重試');
    } finally {
      setIsGeneratingRecipes(false);
    }
  };

  // Swap a single recipe (F3-1, F3-2, F3-3)
  const handleSwapRecipe = async (
    recipeId: string,
    tuningChip?: string,
    userPrompt?: string
  ) => {
    setSwappingRecipeId(recipeId);
    const targetRecipe = recipes.find((r) => r.id === recipeId);
    const oldTitle = targetRecipe?.title;

    const nextExcluded = oldTitle
      ? [...swappedHistory, oldTitle]
      : swappedHistory;
    setSwappedHistory(nextExcluded);

    try {
      const response = await fetch('/api/swap-recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inventory,
          preferences,
          excludedTitles: nextExcluded,
          tuningChip,
          userPrompt,
        }),
      });

      if (!response.ok) throw new Error('換菜失敗');
      const data = await response.json();

      if (data.recipe) {
        setRecipes((prev) =>
          prev.map((r) => (r.id === recipeId ? data.recipe : r))
        );
      }
    } catch (err: any) {
      console.error(err);
      alert('換菜失敗，請重試！');
    } finally {
      setSwappingRecipeId(null);
    }
  };

  // Cooking Complete -> Deduct inventory (F3-6, F3-7)
  const handleConfirmDeduction = (
    deductions: Array<{
      itemId: string;
      name: string;
      quantityDeducted: number;
      unit: string;
      remaining: number;
    }>
  ) => {
    const previousInventory = [...inventory];
    const logId = `log-${Date.now()}`;

    // Update inventory
    setInventory((prev) => {
      return prev
        .map((item) => {
          const match = deductions.find((d) => d.itemId === item.id);
          if (!match) return item;
          return {
            ...item,
            quantity: match.remaining,
          };
        })
        .filter((item) => item.quantity > 0); // remove depleted items (F3-7)
    });

    // Record log
    const newLog: CookLog = {
      id: logId,
      recipeId: deductionModalRecipe?.id || 'unknown',
      recipeTitle: deductionModalRecipe?.title || '剩食特餐',
      cookedAt: new Date().toLocaleString('zh-TW', {
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      consumed: deductions,
    };
    setCookLogs((prev) => [newLog, ...prev]);

    // Close modals
    setDeductionModalRecipe(null);
    setActiveRecipeModal(null);

    // Trigger 10-second undo toast (F3-8)
    setUndoState({
      previousInventory,
      secondsLeft: 10,
      logId,
    });
  };

  // Undo deduction (F3-8)
  const handleUndo = () => {
    if (!undoState) return;
    setInventory(undoState.previousInventory);
    setCookLogs((prev) => prev.filter((l) => l.id !== undoState.logId));
    setUndoState(null);
  };

  // Inventory update helpers
  const handleUpdateItem = (id: string, updates: Partial<InventoryItem>) => {
    setInventory((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  const handleDeleteItem = (id: string) => {
    setInventory((prev) => prev.filter((item) => item.id !== id));
    if (selectedItemId === id) setSelectedItemId(null);
  };

  const handleAddItem = (item: Omit<InventoryItem, 'id' | 'addedAt'>) => {
    const newItem: InventoryItem = {
      ...item,
      id: `item-manual-${Date.now()}`,
      addedAt: new Date().toISOString(),
    };
    setInventory((prev) => [newItem, ...prev]);
  };

  const handleConfirmConfidence = (id: string) => {
    setInventory((prev) =>
      prev.map((item) => (item.id === id ? { ...item, confidence: 95 } : item))
    );
  };

  return (
    <div className="min-h-screen bg-stone-100/70 text-stone-900 flex flex-col font-sans">
      {/* Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        inventoryCount={inventory.length}
        hasRecipes={recipes.length > 0}
        onOpenQuickScan={() => {
          setActiveTab('scan');
          setIsCameraOpen(true);
        }}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Undo Toast Banner (F3-8) */}
        {undoState && (
          <div className="fixed bottom-6 right-6 z-50 bg-stone-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-stone-700 animate-in slide-in-from-bottom duration-200">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div className="text-xs">
              <span className="font-bold">已扣除庫存並記入紀錄！</span>
              <span className="text-stone-400 ml-1">
                （{undoState.secondsLeft} 秒內可撤銷）
              </span>
            </div>
            <button
              onClick={handleUndo}
              className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition-colors ml-2"
            >
              撤銷復原
            </button>
          </div>
        )}

        {/* Tab 1: 拍照盤點 (F1) */}
        {activeTab === 'scan' && (
          <div className="space-y-6">
            {/* Top Info Banner */}
            <div className="bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-amber-500/5 rounded-2xl p-5 border border-amber-200/50 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold">
                  📸
                </div>
                <div>
                  <h1 className="font-black text-stone-900 text-lg">
                    拍照自動盤點，省去繁瑣手動輸入
                  </h1>
                  <p className="text-xs text-stone-600">
                    支援相簿上傳或相機拍攝 1~5 張照片；點選食材框可核對，亦可直接點擊右側生成食譜。
                  </p>
                </div>
              </div>

              <button
                onClick={handleGenerateRecipes}
                disabled={inventory.length === 0 || isGeneratingRecipes}
                className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-500/20 transition-all hover:scale-[1.02] disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>
                  {isGeneratingRecipes
                    ? 'AI 食譜生成中...'
                    : `用這 ${inventory.length} 樣食材生成食譜`}
                </span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Split View: Photo Canvas & Inventory Manager */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Photo Annotator (F1-1, F1-3) */}
              <div className="lg:col-span-7">
                <PhotoAnnotator
                  images={images}
                  activeImageIndex={activeImageIndex}
                  setActiveImageIndex={setActiveImageIndex}
                  items={inventory}
                  selectedItemId={selectedItemId}
                  onSelectItem={setSelectedItemId}
                  onUploadPhotos={handleUploadPhotos}
                  onCaptureCamera={() => setIsCameraOpen(true)}
                  isAnalyzing={isAnalyzing}
                  onRemovePhoto={(idx) => {
                    const next = images.filter((_, i) => i !== idx);
                    setImages(next);
                    setActiveImageIndex(0);
                  }}
                  onSelectPreset={handleSelectPreset}
                  presets={PRESET_SCENARIOS}
                />
              </div>

              {/* Inventory List (F1-4, F1-5, F1-6, F1-7) */}
              <div className="lg:col-span-5">
                <InventoryManager
                  items={inventory}
                  selectedItemId={selectedItemId}
                  onSelectItem={setSelectedItemId}
                  onUpdateItem={handleUpdateItem}
                  onDeleteItem={handleDeleteItem}
                  onAddItem={handleAddItem}
                  onConfirmConfidence={handleConfirmConfidence}
                  includePantry={preferences.includePantry}
                  onTogglePantry={(val) =>
                    setPreferences((prev) => ({ ...prev, includePantry: val }))
                  }
                  pantryItems={preferences.pantryItems}
                  mergedCount={mergedCount}
                  onGenerateRecipes={handleGenerateRecipes}
                  isGeneratingRecipes={isGeneratingRecipes}
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: 食譜推薦 (F2, F3) */}
        {activeTab === 'recipes' && (
          <div className="space-y-6">
            {/* Preferences Filter (F2) */}
            <PreferencesFilter
              preferences={preferences}
              onUpdatePreferences={(updates) =>
                setPreferences((prev) => ({ ...prev, ...updates }))
              }
              onResetPreferences={() => setPreferences(DEFAULT_PREFERENCES)}
              inventory={inventory}
            />

            {/* Recipes Section */}
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-xl font-black text-stone-900 flex items-center gap-2">
                    <span>剩食大廚為您設計的推薦菜單</span>
                    {recipes.length > 0 && (
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900">
                        {recipes.length} 道精選
                      </span>
                    )}
                  </h2>
                  <p className="text-xs text-stone-500 mt-0.5">
                    100% 依您的設備與食材量身打造；不滿意可隨時點擊「換一道」或輸入自訂微調
                  </p>
                </div>

                <button
                  onClick={handleGenerateRecipes}
                  disabled={isGeneratingRecipes}
                  className="flex items-center gap-1.5 px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs disabled:opacity-50"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${
                      isGeneratingRecipes ? 'animate-spin' : ''
                    }`}
                  />
                  <span>
                    {isGeneratingRecipes ? '生成中...' : '重新整批換新菜單'}
                  </span>
                </button>
              </div>

              {recipes.length === 0 ? (
                <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center">
                  <div className="w-14 h-14 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-3">
                    <ChefHat className="w-7 h-7" />
                  </div>
                  <h3 className="text-base font-bold text-stone-900 mb-1">
                    準備好大展身手了嗎？
                  </h3>
                  <p className="text-xs text-stone-500 max-w-sm mx-auto mb-4">
                    點擊下方按鈕，AI 會立刻分析您的冰箱庫存與廚房條件，為您變出 3 道客製化美味料理！
                  </p>
                  <button
                    onClick={handleGenerateRecipes}
                    disabled={inventory.length === 0 || isGeneratingRecipes}
                    className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-500/20 transition-all disabled:opacity-50"
                  >
                    {isGeneratingRecipes ? '生成中...' : '立即生成 3 道剩食食譜'}
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {recipes.map((recipe, idx) => (
                    <RecipeCard
                      key={recipe.id}
                      recipe={recipe}
                      index={idx}
                      onOpenRecipe={(r) => setActiveRecipeModal(r)}
                      onSwapRecipe={handleSwapRecipe}
                      isSwapping={swappingRecipeId === recipe.id}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: 我的冰箱 (My Fridge) */}
        {activeTab === 'inventory' && (
          <MyFridgeView
            items={inventory}
            onUpdateItem={handleUpdateItem}
            onDeleteItem={handleDeleteItem}
            onAddItem={handleAddItem}
            onClearAll={() => setInventory([])}
            pantryItems={preferences.pantryItems}
            onUpdatePantry={(next) =>
              setPreferences((prev) => ({ ...prev, pantryItems: next }))
            }
            onGoToRecipes={() => {
              setActiveTab('recipes');
              handleGenerateRecipes();
            }}
          />
        )}

        {/* Tab 4: 烹飪紀錄 (Cook History) */}
        {activeTab === 'history' && (
          <CookHistory
            logs={cookLogs}
            onClearHistory={() => setCookLogs([])}
          />
        )}
      </main>

      {/* Recipe Detail Modal with Step Timers (F3-5) */}
      <RecipeModal
        recipe={activeRecipeModal}
        onClose={() => setActiveRecipeModal(null)}
        onCookDone={(r) => {
          setActiveRecipeModal(null);
          setDeductionModalRecipe(r);
        }}
        inventory={inventory}
      />

      {/* Deduction Preview & Confirm Modal (F3-6, F3-7) */}
      {deductionModalRecipe && (
        <DeductionModal
          recipe={deductionModalRecipe}
          inventory={inventory}
          onConfirmDeduction={handleConfirmDeduction}
          onClose={() => setDeductionModalRecipe(null)}
        />
      )}

      {/* Live Camera Modal */}
      <CameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleCaptureFromCamera}
      />
    </div>
  );
}

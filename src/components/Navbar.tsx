import React from 'react';
import { Utensils, Camera, Refrigerator, History, Sparkles, ChefHat } from 'lucide-react';

interface NavbarProps {
  activeTab: 'scan' | 'recipes' | 'inventory' | 'history';
  setActiveTab: (tab: 'scan' | 'recipes' | 'inventory' | 'history') => void;
  inventoryCount: number;
  hasRecipes: boolean;
  onOpenQuickScan?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  inventoryCount,
  hasRecipes,
  onOpenQuickScan,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-stone-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div
            onClick={() => setActiveTab('scan')}
            className="flex items-center gap-3 cursor-pointer select-none group"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
              <ChefHat className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-xl tracking-tight text-stone-900">
                  FridgeChef
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  剩食大廚
                </span>
              </div>
              <p className="text-xs text-stone-500 hidden sm:block">
                拍一張冰箱照片・30 秒變出客製化食譜・自動扣庫存
              </p>
            </div>
          </div>

          {/* Nav Tabs */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setActiveTab('scan')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'scan'
                  ? 'bg-amber-100 text-amber-900 font-bold'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              <Camera className="w-4 h-4" />
              <span>拍照盤點</span>
            </button>

            <button
              onClick={() => setActiveTab('recipes')}
              className={`relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'recipes'
                  ? 'bg-amber-100 text-amber-900 font-bold'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>智能食譜</span>
              {hasRecipes && (
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('inventory')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'inventory'
                  ? 'bg-amber-100 text-amber-900 font-bold'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              <Refrigerator className="w-4 h-4" />
              <span>我的冰箱</span>
              {inventoryCount > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 bg-stone-200 text-stone-800 text-xs rounded-full font-bold">
                  {inventoryCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'history'
                  ? 'bg-amber-100 text-amber-900 font-bold'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              <History className="w-4 h-4" />
              <span className="hidden md:inline">烹飪紀錄</span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};

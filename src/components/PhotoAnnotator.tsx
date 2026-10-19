import React, { useRef, useState } from 'react';
import { Camera, Upload, Eye, AlertTriangle, Sparkles, X, Plus, Layers, Image as ImageIcon } from 'lucide-react';
import { InventoryItem } from '../types/fridge';
import { CATEGORY_LABELS } from '../data/presets';

interface PhotoAnnotatorProps {
  images: string[];
  activeImageIndex: number;
  setActiveImageIndex: (index: number) => void;
  items: InventoryItem[];
  selectedItemId: string | null;
  onSelectItem: (id: string | null) => void;
  onUploadPhotos: (files: FileList | File[]) => void;
  onCaptureCamera: () => void;
  isAnalyzing: boolean;
  onRemovePhoto: (index: number) => void;
  onSelectPreset: (presetId: string) => void;
  presets: any[];
}

export const PhotoAnnotator: React.FC<PhotoAnnotatorProps> = ({
  images,
  activeImageIndex,
  setActiveImageIndex,
  items,
  selectedItemId,
  onSelectItem,
  onUploadPhotos,
  onCaptureCamera,
  isAnalyzing,
  onRemovePhoto,
  onSelectPreset,
  presets,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showTips, setShowTips] = useState(false);

  const currentImage = images[activeImageIndex];
  const itemsInCurrentImage = items.filter(
    (item) => item.boundingBox && (item.imageIndex === undefined || item.imageIndex === activeImageIndex)
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
      {/* Header bar */}
      <div className="p-4 border-b border-stone-200 flex flex-wrap items-center justify-between gap-3 bg-stone-50/70">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-sm">
            F1
          </div>
          <div>
            <h2 className="font-bold text-stone-900 text-base flex items-center gap-2">
              照片辨識與疊加標籤
              {itemsInCurrentImage.length > 0 && (
                <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-medium">
                  已標註 {itemsInCurrentImage.length} 樣
                </span>
              )}
            </h2>
            <p className="text-xs text-stone-500">
              點擊照片中的食材方框可快速核對；支援一次上傳 1~5 張照片
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                onUploadPhotos(e.target.files);
              }
            }}
            accept="image/*"
            multiple
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isAnalyzing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-900 text-white text-xs font-medium hover:bg-stone-800 transition-colors shadow-sm disabled:opacity-50"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>上傳照片 (1~5張)</span>
          </button>

          <button
            onClick={onCaptureCamera}
            disabled={isAnalyzing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 text-white text-xs font-medium hover:bg-amber-600 transition-colors shadow-sm disabled:opacity-50"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>開啟相機拍攝</span>
          </button>
        </div>
      </div>

      {/* Preset Fast Picker Banner */}
      <div className="px-4 py-2.5 bg-amber-50/60 border-b border-amber-100 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5 text-amber-900 font-medium">
          <Sparkles className="w-4 h-4 text-amber-600" />
          <span>手邊剛好沒冰箱照片？點擊下方示範情境直接體驗：</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {presets.map((preset) => (
            <button
              key={preset.id}
              onClick={() => onSelectPreset(preset.id)}
              className="px-2.5 py-1 rounded-md bg-white hover:bg-amber-100 text-stone-800 font-medium border border-amber-200 transition-all shadow-xs text-xs flex items-center gap-1"
            >
              <span>{preset.badge}</span>
              <span className="text-stone-400">|</span>
              <span>{preset.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Image Stage */}
      <div className="relative bg-stone-950 flex items-center justify-center min-h-[340px] max-h-[500px] overflow-hidden select-none">
        {currentImage ? (
          <div className="relative inline-block max-w-full max-h-[500px]">
            <img
              src={currentImage}
              alt="冰箱照片"
              className="max-h-[500px] w-auto object-contain block mx-auto"
            />

            {/* Bounding box overlays */}
            {itemsInCurrentImage.map((item) => {
              if (!item.boundingBox) return null;
              const { ymin, xmin, ymax, xmax } = item.boundingBox;
              const isSelected = selectedItemId === item.id;
              const isLowConfidence = item.confidence < 70;
              const catMeta = CATEGORY_LABELS[item.category] || CATEGORY_LABELS.other;

              return (
                <div
                  key={item.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectItem(isSelected ? null : item.id);
                  }}
                  style={{
                    top: `${ymin}%`,
                    left: `${xmin}%`,
                    width: `${xmax - xmin}%`,
                    height: `${ymax - ymin}%`,
                  }}
                  className={`absolute cursor-pointer transition-all duration-150 rounded border-2 ${
                    isSelected
                      ? 'border-amber-400 bg-amber-400/25 ring-4 ring-amber-300/40 z-20'
                      : isLowConfidence
                      ? 'border-amber-500 bg-amber-500/15 hover:bg-amber-500/30 z-10 border-dashed'
                      : 'border-emerald-400 bg-emerald-500/10 hover:bg-emerald-400/30 z-10'
                  }`}
                >
                  {/* Floating Tag */}
                  <div
                    className={`absolute -top-6 left-0 flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-bold whitespace-nowrap shadow-md pointer-events-none transition-transform ${
                      isSelected
                        ? 'bg-amber-500 text-white scale-105'
                        : isLowConfidence
                        ? 'bg-amber-600 text-white'
                        : 'bg-emerald-700/90 text-white'
                    }`}
                  >
                    <span>{catMeta.icon}</span>
                    <span>{item.name}</span>
                    <span className="opacity-90 font-mono text-[10px]">
                      {item.quantity}{item.unit}
                    </span>
                    {isLowConfidence && <span title="信心度低於70%">⚠️</span>}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-16 px-4 text-center text-stone-300">
            <ImageIcon className="w-12 h-12 mx-auto text-stone-500 mb-3 stroke-1" />
            <p className="font-medium text-stone-200 mb-1">尚未上傳冰箱照片</p>
            <p className="text-xs text-stone-400 max-w-sm mx-auto mb-4">
              可上傳冷藏室、冷凍庫、抽屜等 1~5 張照片，AI 將自動辨識食材、標出位置並合併重複項目
            </p>
            <div className="flex justify-center gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition-colors"
              >
                上傳照片
              </button>
              <button
                onClick={() => onSelectPreset('studio-bachelor')}
                className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg text-xs font-medium transition-colors"
              >
                載入示範照片
              </button>
            </div>
          </div>
        )}

        {/* Loading overlay */}
        {isAnalyzing && (
          <div className="absolute inset-0 bg-stone-950/80 backdrop-blur-xs flex flex-col items-center justify-center text-white z-30">
            <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="font-bold text-sm text-stone-100">Gemini 視覺模型辨識中...</p>
            <p className="text-xs text-stone-400 mt-1">正在盤點食材、標記座標與估算數量</p>
          </div>
        )}
      </div>

      {/* Multi-Photo Carousel / Switcher */}
      {images.length > 1 && (
        <div className="p-3 bg-stone-100 border-t border-stone-200 flex items-center gap-2 overflow-x-auto">
          <span className="text-xs font-medium text-stone-500 shrink-0 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5" />
            已載入 {images.length} 張照片：
          </span>
          {images.map((img, idx) => (
            <div
              key={idx}
              onClick={() => setActiveImageIndex(idx)}
              className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all shrink-0 w-16 h-12 ${
                activeImageIndex === idx
                  ? 'border-amber-500 ring-2 ring-amber-400/40'
                  : 'border-stone-300 opacity-60 hover:opacity-100'
              }`}
            >
              <img src={img} alt={`照片 ${idx + 1}`} className="w-full h-full object-cover" />
              <span className="absolute bottom-0 right-0 bg-stone-900/80 text-white text-[9px] px-1 font-mono">
                #{idx + 1}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemovePhoto(idx);
                }}
                className="absolute top-0.5 right-0.5 bg-stone-900/80 hover:bg-rose-600 text-white p-0.5 rounded-full"
                title="移除這張照片"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Quality hint banner */}
      <div className="px-4 py-2 bg-stone-50 border-t border-stone-200 text-xs text-stone-500 flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <Eye className="w-3.5 h-3.5 text-stone-400" />
          <span>
            提示：點選畫面中的彩色外框可對應食材；綠框為高信心，虛線橘框為信心低於 70% 需確認。
          </span>
        </span>
        <button
          onClick={() => setShowTips(!showTips)}
          className="text-amber-700 hover:underline font-medium ml-2 shrink-0"
        >
          {showTips ? '收起拍攝秘訣' : '拍攝秘訣'}
        </button>
      </div>

      {showTips && (
        <div className="p-3 bg-amber-50/50 border-t border-amber-100 text-xs text-stone-700 grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div className="bg-white p-2 rounded border border-amber-200/60">
            <p className="font-bold text-stone-900 mb-0.5">💡 充足照明</p>
            <p className="text-stone-500">開冰箱燈或室內大燈，避免陰影遮蓋包裝名稱。</p>
          </div>
          <div className="bg-white p-2 rounded border border-amber-200/60">
            <p className="font-bold text-stone-900 mb-0.5">📐 分層拍攝</p>
            <p className="text-stone-500">蔬果室、冷凍庫、門邊棚架分別拍一張，辨識最完整。</p>
          </div>
          <div className="bg-white p-2 rounded border border-amber-200/60">
            <p className="font-bold text-stone-900 mb-0.5">📦 包裝正面朝外</p>
            <p className="text-stone-500">若有肉品或起司，正面標籤露出能 100% 精準判讀。</p>
          </div>
        </div>
      )}
    </div>
  );
};

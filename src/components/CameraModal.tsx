import React, { useRef, useState, useEffect } from 'react';
import { Camera, X, RotateCcw, Check, AlertCircle } from 'lucide-react';

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (base64Image: string) => void;
}

export const CameraModal: React.FC<CameraModalProps> = ({
  isOpen,
  onClose,
  onCapture,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [capturedData, setCapturedData] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      setCapturedData(null);
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isOpen]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      setErrorMsg('無法存取相機，請檢查瀏覽器相機權限，或直接使用「上傳照片」功能。');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const handleSnap = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setCapturedData(dataUrl);
      stopCamera();
    }
  };

  const handleRetake = () => {
    setCapturedData(null);
    startCamera();
  };

  const handleConfirm = () => {
    if (capturedData) {
      onCapture(capturedData);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-xs">
      <div className="bg-stone-900 w-full max-w-xl rounded-3xl overflow-hidden shadow-2xl border border-stone-800 flex flex-col text-white animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-sm">拍攝冰箱內部照片</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-white rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Camera Viewport */}
        <div className="relative bg-black flex items-center justify-center min-h-[320px] max-h-[460px] overflow-hidden">
          {errorMsg ? (
            <div className="p-6 text-center text-rose-400 text-xs">
              <AlertCircle className="w-8 h-8 mx-auto mb-2" />
              <p>{errorMsg}</p>
            </div>
          ) : capturedData ? (
            <img src={capturedData} alt="拍攝預覽" className="max-h-[460px] w-auto object-contain" />
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          )}

          {/* Guide reticle */}
          {!capturedData && !errorMsg && (
            <div className="absolute inset-8 border-2 border-dashed border-white/40 pointer-events-none rounded-2xl flex items-center justify-center">
              <span className="text-[11px] bg-black/60 px-3 py-1 rounded-full text-stone-300">
                將冰箱層架置於框內以獲得最佳辨識
              </span>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="p-4 border-t border-stone-800 flex items-center justify-center gap-4 bg-stone-950">
          {capturedData ? (
            <>
              <button
                onClick={handleRetake}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                <span>重拍</span>
              </button>
              <button
                onClick={handleConfirm}
                className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-all shadow-md shadow-amber-500/20"
              >
                <Check className="w-4 h-4" />
                <span>使用這張照片辨識</span>
              </button>
            </>
          ) : (
            !errorMsg && (
              <button
                onClick={handleSnap}
                className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center hover:scale-105 active:scale-95 transition-transform bg-amber-500 text-white shadow-lg shadow-amber-500/30"
                title="拍攝"
              >
                <Camera className="w-6 h-6" />
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
};

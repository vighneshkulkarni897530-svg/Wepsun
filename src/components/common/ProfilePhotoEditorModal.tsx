import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Camera,
  Image as ImageIcon,
  RotateCcw,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Minus,
  Plus,
  RefreshCw,
  Check,
  X,
  Move,
  Upload,
  Sparkles,
  Trash2,
  Sliders,
  ShieldCheck,
  Crop,
  Layers,
} from 'lucide-react';
import { GeometricBlueWLogo } from './WepsunLogo';

export interface ProfilePhotoEditorModalProps {
  isOpen: boolean;
  initialImage?: string | null;
  onClose: () => void;
  onApply: (croppedDataUrl: string) => void;
  onRemovePhoto?: () => void;
}

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&auto=format&fit=crop&q=80',
];

export const ProfilePhotoEditorModal: React.FC<ProfilePhotoEditorModalProps> = ({
  isOpen,
  initialImage,
  onClose,
  onApply,
  onRemovePhoto,
}) => {
  const [currentImage, setCurrentImage] = useState<string | null>(initialImage || null);
  const [viewMode, setViewMode] = useState<'editor' | 'camera' | 'presets'>('editor');

  // Transform states
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState<number>(1); // 1 = 100%
  const [rotation, setRotation] = useState<number>(0); // in degrees (-180 to +180)

  // Natural image dimensions
  const [imageSize, setImageSize] = useState<{ width: number; height: number; naturalWidth: number; naturalHeight: number }>({
    width: 260,
    height: 260,
    naturalWidth: 400,
    naturalHeight: 400,
  });

  // Dragging states
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const touchDistanceRef = useRef<number | null>(null);

  // References
  const imgRef = useRef<HTMLImageElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Camera stream
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);

  // Crop frame dimensions (circular aperture in px)
  const CROP_DIAMETER = 260; // diameter of the crop circle
  const OUTPUT_SIZE = 512; // output resolution of exported canvas

  // Reset transforms when initial image changes
  useEffect(() => {
    if (initialImage) {
      setCurrentImage(initialImage);
    }
  }, [initialImage]);

  // Cleanup camera stream
  const stopCamera = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    setIsCameraActive(false);
  }, []);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // Global mousemove/mouseup to prevent drag getting stuck when cursor leaves the box
  useEffect(() => {
    if (!isDragging) return;

    const handleGlobalMouseMove = (e: MouseEvent) => {
      setPosition({
        x: e.clientX - dragStartRef.current.x,
        y: e.clientY - dragStartRef.current.y,
      });
    };

    const handleGlobalMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging]);

  // Reset function
  const handleReset = () => {
    setPosition({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
  };

  // Image load handler to compute proportional base dimensions
  const handleImageLoaded = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    if (naturalWidth && naturalHeight) {
      const baseFitScale = Math.max(CROP_DIAMETER / naturalWidth, CROP_DIAMETER / naturalHeight);
      setImageSize({
        width: naturalWidth * baseFitScale,
        height: naturalHeight * baseFitScale,
        naturalWidth,
        naturalHeight,
      });
    }
  };

  // Mouse Drag Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
  };

  // Touch Drag & Pinch-to-Zoom Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      dragStartRef.current = {
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y,
      };
      touchDistanceRef.current = null;
    } else if (e.touches.length === 2) {
      setIsDragging(false);
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchDistanceRef.current = dist;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && isDragging) {
      setPosition({
        x: e.touches[0].clientX - dragStartRef.current.x,
        y: e.touches[0].clientY - dragStartRef.current.y,
      });
    } else if (e.touches.length === 2 && touchDistanceRef.current !== null) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const delta = dist - touchDistanceRef.current;
      const newZoom = Math.min(Math.max(zoom + delta * 0.006, 0.5), 3.5);
      setZoom(newZoom);
      touchDistanceRef.current = dist;
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    touchDistanceRef.current = null;
  };

  // Mouse Wheel Zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomStep = e.deltaY < 0 ? 0.08 : -0.08;
    const newZoom = Math.min(Math.max(zoom + zoomStep, 0.5), 3.5);
    setZoom(newZoom);
  };

  // Zoom Button Controls
  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.15, 3.5));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.15, 0.5));
  };

  // 90-degree rotations
  const handleRotateLeft = () => {
    setRotation((prev) => {
      const next = prev - 90;
      return next < -180 ? next + 360 : next;
    });
  };

  const handleRotateRight = () => {
    setRotation((prev) => {
      const next = prev + 90;
      return next > 180 ? next - 360 : next;
    });
  };

  // Camera Handlers
  const handleStartCamera = async () => {
    setViewMode('camera');
    setIsCameraActive(true);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 640 } },
          audio: false,
        });
        mediaStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      }
    } catch (err) {
      console.warn('Camera stream error:', err);
      setViewMode('editor');
      setIsCameraActive(false);
    }
  };

  const handleCaptureCamera = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 640;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const minDim = Math.min(videoRef.current.videoWidth, videoRef.current.videoHeight);
        const startX = (videoRef.current.videoWidth - minDim) / 2;
        const startY = (videoRef.current.videoHeight - minDim) / 2;
        ctx.drawImage(videoRef.current, startX, startY, minDim, minDim, 0, 0, 640, 640);
        const captured = canvas.toDataURL('image/jpeg', 0.95);
        setCurrentImage(captured);
        handleReset();
        stopCamera();
        setViewMode('editor');
      }
    }
  };

  // File Upload Handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setCurrentImage(event.target.result as string);
          handleReset();
          setViewMode('editor');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Apply and Export High-Resolution Canvas Crop
  const handleApplyCrop = () => {
    if (!currentImage || !imgRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Enable high-quality smoothing
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // 1. Fill solid background (white / non-transparent)
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

    // 2. Create circular clip path
    ctx.beginPath();
    ctx.arc(OUTPUT_SIZE / 2, OUTPUT_SIZE / 2, OUTPUT_SIZE / 2, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.clip();

    // 3. Coordinate translation to center of canvas
    ctx.save();
    ctx.translate(OUTPUT_SIZE / 2, OUTPUT_SIZE / 2);

    // 4. Apply scale ratio between editor viewport crop diameter and output size
    const scaleFactor = OUTPUT_SIZE / CROP_DIAMETER;
    ctx.scale(scaleFactor, scaleFactor);

    // 5. Apply user position translation
    ctx.translate(position.x, position.y);

    // 6. Apply user rotation
    ctx.rotate((rotation * Math.PI) / 180);

    // 7. Apply user zoom
    ctx.scale(zoom, zoom);

    // 8. Draw image centered with proportional base fit dimensions
    const img = imgRef.current;
    const naturalWidth = img.naturalWidth || imageSize.naturalWidth || 400;
    const naturalHeight = img.naturalHeight || imageSize.naturalHeight || 400;

    const baseFitScale = Math.max(CROP_DIAMETER / naturalWidth, CROP_DIAMETER / naturalHeight);
    const drawWidth = naturalWidth * baseFitScale;
    const drawHeight = naturalHeight * baseFitScale;

    ctx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
    ctx.restore();

    // 9. Generate final cropped image data URL
    const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.95);
    onApply(croppedDataUrl);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="photo-editor-title"
      className="fixed inset-0 z-[99990] flex items-center justify-center p-3 sm:p-5 overflow-y-auto select-none animate-in fade-in duration-200"
    >
      {/* Dark Overlay with Blur */}
      <div
        onClick={() => {
          stopCamera();
          onClose();
        }}
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-md"
      />

      {/* Modern Card Modal */}
      <div className="relative z-10 w-full max-w-[460px] sm:max-w-[500px] bg-white border border-slate-200/90 rounded-[32px] shadow-[0_25px_60px_-15px_rgba(11,37,69,0.4)] overflow-hidden flex flex-col max-h-[92vh]">
        {/* ========================================================================= */}
        {/* MODAL HEADER */}
        {/* ========================================================================= */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 via-white to-blue-50/40 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#0066FF] flex items-center justify-center shadow-2xs">
              <GeometricBlueWLogo className="w-4 h-3.5" />
            </div>
            <div>
              <h2 id="photo-editor-title" className="text-sm sm:text-base font-black text-[#0b2545] tracking-tight">
                UPDATE PROFILE PHOTO
              </h2>
              <p className="text-[11px] text-slate-500 font-medium">
                Drag, zoom and rotate your photo to fit the frame
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            aria-label="Close photo editor"
            className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer active:scale-95"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ========================================================================= */}
        {/* MODAL BODY */}
        {/* ========================================================================= */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 scrollbar-thin">
          {/* VIEW: MAIN PHOTO EDITOR WITH DRAG, ZOOM & ROTATION */}
          {viewMode === 'editor' && (
            <>
              {/* Top Quick Actions Bar (Upload new, Camera, Presets, Remove) */}
              <div className="flex items-center justify-between gap-2 pb-1">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                  >
                    <Upload className="w-3.5 h-3.5 text-[#0066FF]" />
                    <span>Upload New</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleStartCamera}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                  >
                    <Camera className="w-3.5 h-3.5 text-[#0066FF]" />
                    <span>Camera</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setViewMode('presets')}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Presets</span>
                  </button>
                </div>

                {onRemovePhoto && (
                  <button
                    type="button"
                    onClick={() => {
                      onRemovePhoto();
                      onClose();
                    }}
                    className="p-1.5 rounded-xl hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                    title="Remove Photo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Fixed Circular Crop Viewport Canvas Area */}
              <div
                ref={viewportRef}
                onMouseDown={handleMouseDown}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onWheel={handleWheel}
                className="relative w-full h-[290px] sm:h-[310px] rounded-3xl overflow-hidden bg-slate-950 flex items-center justify-center cursor-grab active:cursor-grabbing select-none touch-none shadow-inner border border-slate-900"
              >
                {/* 1. Underlying Free-Transform Image */}
                {currentImage ? (
                  <div
                    style={{
                      transform: `translate(${position.x}px, ${position.y}px) rotate(${rotation}deg) scale(${zoom})`,
                      transformOrigin: 'center center',
                      transition: isDragging ? 'none' : 'transform 0.05s ease-out',
                    }}
                    className="absolute pointer-events-none flex items-center justify-center will-change-transform"
                  >
                    <img
                      ref={imgRef}
                      src={currentImage}
                      alt="Avatar Source"
                      onLoad={handleImageLoaded}
                      draggable={false}
                      className="max-w-none max-h-none select-none pointer-events-none"
                      style={{
                        width: `${imageSize.width}px`,
                        height: `${imageSize.height}px`,
                        display: 'block',
                      }}
                    />
                  </div>
                ) : (
                  <div className="text-center text-slate-500 space-y-2 pointer-events-none">
                    <ImageIcon className="w-12 h-12 mx-auto text-slate-600 animate-pulse" />
                    <span className="text-xs font-bold block">No image selected</span>
                  </div>
                )}

                {/* 2. Semi-Transparent Dark Mask Overlay with Circular Aperture Cutout */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  {/* SVG Mask for clear circular cutout */}
                  <svg className="w-full h-full absolute inset-0">
                    <defs>
                      <mask id="wepsun-crop-mask">
                        {/* White area = visible dark overlay */}
                        <rect width="100%" height="100%" fill="white" />
                        {/* Black circle = cutout hole */}
                        <circle cx="50%" cy="50%" r={CROP_DIAMETER / 2} fill="black" />
                      </mask>
                    </defs>
                    {/* Dark semi-transparent overlay */}
                    <rect
                      width="100%"
                      height="100%"
                      fill="rgba(11, 37, 69, 0.72)"
                      mask="url(#wepsun-crop-mask)"
                    />
                  </svg>

                  {/* Circular Frame Border with glow */}
                  <div
                    style={{ width: `${CROP_DIAMETER}px`, height: `${CROP_DIAMETER}px` }}
                    className="relative rounded-full border-2 border-white/95 pointer-events-none ring-1 ring-blue-500/40"
                  >
                    {/* Fine Crosshair / Grid Alignment Guidelines */}
                    <div className="absolute inset-0 rounded-full border border-white/20 pointer-events-none" />
                    <div className="absolute top-1/2 left-0 right-0 h-px bg-white/15 pointer-events-none" />
                    <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/15 pointer-events-none" />
                  </div>
                </div>

                {/* 3. Floating Drag Guide Pill */}
                <div className="absolute top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-white/80 text-[10px] font-bold flex items-center gap-1.5 pointer-events-none shadow-sm border border-white/10">
                  <Move className="w-3 h-3 text-[#0066FF]" />
                  <span>Drag to reposition photo</span>
                </div>
              </div>

              {/* ========================================================================= */}
              {/* SLIDERS & FINE CONTROLS SECTION */}
              {/* ========================================================================= */}
              <div className="space-y-4 bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
                {/* 1. Zoom Control Bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                    <span className="flex items-center gap-1.5">
                      <ZoomIn className="w-3.5 h-3.5 text-[#0066FF]" /> Zoom:
                    </span>
                    <span className="font-mono text-[11px] text-[#0066FF] bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200/60 font-bold">
                      {Math.round(zoom * 100)}%
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={handleZoomOut}
                      aria-label="Zoom Out"
                      className="w-8 h-8 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 flex items-center justify-center transition-all cursor-pointer shadow-2xs active:scale-95 shrink-0"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>

                    <input
                      type="range"
                      min="0.5"
                      max="3.5"
                      step="0.05"
                      value={zoom}
                      onChange={(e) => setZoom(parseFloat(e.target.value))}
                      className="w-full accent-[#0066FF] cursor-pointer h-2 bg-slate-200 rounded-lg appearance-none"
                    />

                    <button
                      type="button"
                      onClick={handleZoomIn}
                      aria-label="Zoom In"
                      className="w-8 h-8 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 flex items-center justify-center transition-all cursor-pointer shadow-2xs active:scale-95 shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* 2. Rotation Control Bar */}
                <div className="space-y-1.5 pt-1 border-t border-slate-200/60">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                    <span className="flex items-center gap-1.5">
                      <RotateCw className="w-3.5 h-3.5 text-[#0066FF]" /> Rotation:
                    </span>
                    <span className="font-mono text-[11px] text-[#0066FF] bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200/60 font-bold">
                      {rotation}°
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={handleRotateLeft}
                      title="Rotate -90°"
                      className="w-8 h-8 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 flex items-center justify-center transition-all cursor-pointer shadow-2xs active:scale-95 shrink-0"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>

                    <input
                      type="range"
                      min="-180"
                      max="180"
                      step="1"
                      value={rotation}
                      onChange={(e) => setRotation(parseInt(e.target.value, 10))}
                      className="w-full accent-[#0066FF] cursor-pointer h-2 bg-slate-200 rounded-lg appearance-none"
                    />

                    <button
                      type="button"
                      onClick={handleRotateRight}
                      title="Rotate +90°"
                      className="w-8 h-8 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 flex items-center justify-center transition-all cursor-pointer shadow-2xs active:scale-95 shrink-0"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* 3. Reset Button */}
                <div className="flex items-center justify-center pt-1">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="px-4 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-600 text-xs font-bold border border-slate-200 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
                  >
                    <RefreshCw className="w-3 h-3 text-slate-400" />
                    <span>↺ Reset</span>
                  </button>
                </div>
              </div>
            </>
          )}

          {/* VIEW: WEBCAM PHOTO CAPTURE */}
          {viewMode === 'camera' && (
            <div className="space-y-4 text-center">
              <div className="relative w-64 h-64 sm:w-72 sm:h-72 mx-auto rounded-3xl overflow-hidden border-2 border-[#0066FF] bg-black shadow-inner flex items-center justify-center">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                {/* Visual Circular Guideline */}
                <div className="absolute inset-0 border-4 border-dashed border-white/70 rounded-full m-4 pointer-events-none" />
              </div>

              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    stopCamera();
                    setViewMode('editor');
                  }}
                  className="px-4 py-2.5 rounded-2xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-100"
                >
                  Back to Editor
                </button>
                <button
                  type="button"
                  onClick={handleCaptureCamera}
                  className="px-6 py-2.5 rounded-2xl bg-[#0066FF] hover:bg-[#0052cc] text-white text-xs font-bold shadow-md flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <Camera className="w-4 h-4" />
                  <span>Capture Snapshot</span>
                </button>
              </div>
            </div>
          )}

          {/* VIEW: PRESET AVATAR SELECTOR */}
          {viewMode === 'presets' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-500 text-center">
                Select an official avatar to adjust and apply to your profile:
              </p>

              <div className="grid grid-cols-4 gap-3">
                {PRESET_AVATARS.map((url, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setCurrentImage(url);
                      handleReset();
                      setViewMode('editor');
                    }}
                    className="w-16 h-16 rounded-full overflow-hidden ring-2 ring-transparent hover:ring-[#0066FF] hover:scale-105 transition-all shadow-sm cursor-pointer mx-auto"
                  >
                    <img src={url} alt={`Preset ${i}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setViewMode('editor')}
                  className="px-4 py-2 rounded-2xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-100 cursor-pointer"
                >
                  Back to Editor
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Hidden File Input for Image Upload */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* ========================================================================= */}
        {/* MODAL BOTTOM ACTION BUTTONS */}
        {/* ========================================================================= */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="flex-1 py-3 px-4 rounded-2xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all cursor-pointer active:scale-95 text-center"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={!currentImage}
            onClick={handleApplyCrop}
            className="flex-1 py-3 px-5 rounded-2xl bg-[#0066FF] hover:bg-[#0052cc] disabled:opacity-50 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <Check className="w-4 h-4" />
            <span>✓ Apply Photo</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePhotoEditorModal;

import React, { useRef, useState, useEffect } from 'react';
import { Trash2, Check, Edit2, ShieldAlert } from 'lucide-react';

interface ScribbleCanvasProps {
  initialValue?: string; // base64 data url
  onSave: (dataUrl: string) => void;
  color?: string;
}

export const ScribbleCanvas: React.FC<ScribbleCanvasProps> = ({ initialValue, onSave, color = '#a855f7' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushColor, setBrushColor] = useState('#ffffff');
  const [brushSize, setBrushSize] = useState(4);
  const [isEraser, setIsEraser] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  // Load initial image onto canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set high-res scaling if needed or standard size
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (initialValue && initialValue.startsWith('data:image/')) {
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        setHasDrawn(true);
      };
      img.src = initialValue;
    } else {
      ctx.fillStyle = '#0f111a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }, [initialValue]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    setHasDrawn(true);

    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    
    // Setup stroke style
    ctx.strokeStyle = isEraser ? '#0f111a' : brushColor;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();

    e.preventDefault();
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();

    e.preventDefault();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    // Auto save to callback when drawing completes
    saveCanvas();
  };

  const saveCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    onSave(dataUrl);
  };

  const getPos = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    let clientX = 0;
    let clientY = 0;

    if ('touches' in e) {
      if (e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      }
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    // Account for styling scaling
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#0f111a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
    onSave('');
  };

  const colors = [
    '#ffffff', // white
    '#3b82f6', // blue
    '#10b981', // emerald
    '#f59e0b', // amber
    '#ec4899', // pink
    '#a855f7', // purple
    '#f43f5e'  // rose
  ];

  return (
    <div className="space-y-2 bg-black/40 p-2.5 rounded-2xl border border-white/5">
      <div className="flex items-center justify-between gap-2 shrink-0 flex-wrap">
        {/* Colors selector */}
        <div className="flex gap-1">
          {colors.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => { setBrushColor(c); setIsEraser(false); }}
              className={`w-5 h-5 rounded-full border transition-all ${brushColor === c && !isEraser ? 'scale-110 ring-2 ring-purple-400' : 'opacity-70 hover:opacity-100'}`}
              style={{ backgroundColor: c }}
            />
          ))}
          <button
            type="button"
            onClick={() => setIsEraser(true)}
            className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold text-white transition-all ${isEraser ? 'bg-purple-600' : 'bg-white/10 hover:bg-white/20'}`}
          >
            Gomma 🧹
          </button>
        </div>

        {/* Brush Size */}
        <div className="flex items-center gap-1.5 text-[9px] font-black text-white/50 tracking-wider">
          <span>SPESSORE:</span>
          <input
            type="range"
            min="1"
            max="20"
            value={brushSize}
            onChange={(e) => setBrushSize(parseInt(e.target.value))}
            className="w-16 accent-purple-500 bg-white/10"
          />
          <span className="text-white text-right w-4 font-mono">{brushSize}px</span>
        </div>

        {/* Clear */}
        <button
          type="button"
          onClick={clearCanvas}
          className="p-1 px-2.5 bg-rose-500/15 border border-rose-500/20 text-rose-400 hover:bg-rose-500/25 rounded-md text-[9px] uppercase tracking-wider font-extrabold transition-all"
        >
          Pulisci 🗑️
        </button>
      </div>

      <div className="relative aspect-[3/1.5] w-full rounded-xl overflow-hidden border border-white/10 bg-[#0f111a] cursor-crosshair">
        <canvas
          ref={canvasRef}
          width={600}
          height={300}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="w-full h-full block touch-none"
        />
        {!hasDrawn && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-white/20 text-[10px] font-bold uppercase tracking-widest text-center px-4">
            🖍️ Disegna o scrivi con il dito qui
          </div>
        )}
      </div>
    </div>
  );
};

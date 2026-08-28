import React, { useRef, useState, useEffect } from "react";
import {
  Pencil,
  Eraser,
  Square,
  Circle,
  ArrowRight,
  Database,
  Server,
  Cloud,
  Layers,
  RotateCcw,
  Share2,
  CheckCircle2,
} from "lucide-react";

interface WhiteboardProps {
  onSyncWhiteboardWithAi: (imageJpegBase64: string) => void;
}

export const Whiteboard: React.FC<WhiteboardProps> = ({ onSyncWhiteboardWithAi }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [tool, setTool] = useState<"pen" | "eraser" | "server" | "database" | "cache" | "cloud">("pen");
  const [color, setColor] = useState("#4285f4");
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSynced, setHasSynced] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Fill dark canvas background
    ctx.fillStyle = "#1e1e24";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw subtle grid pattern
    ctx.strokeStyle = "#2b2c31";
    ctx.lineWidth = 1;
    const gridSize = 24;
    for (let x = 0; x < canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (tool === "pen" || tool === "eraser") {
      setIsDrawing(true);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.strokeStyle = tool === "eraser" ? "#1e1e24" : color;
      ctx.lineWidth = tool === "eraser" ? 20 : 3;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
    } else {
      // Stamp specialized Architecture Shape
      drawArchitectureBlock(ctx, x, y, tool);
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const drawArchitectureBlock = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    type: "server" | "database" | "cache" | "cloud"
  ) => {
    ctx.save();
    const w = 110;
    const h = 60;
    const px = x - w / 2;
    const py = y - h / 2;

    ctx.fillStyle = "#2d2f34";
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;

    // Rounded rectangle
    ctx.beginPath();
    ctx.roundRect(px, py, w, h, 8);
    ctx.fill();
    ctx.stroke();

    // Icon + Label
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 11px Plus Jakarta Sans, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const labels: Record<string, string> = {
      server: "⚙️ API Server",
      database: "🗄️ PostgreSQL",
      cache: "⚡ Redis Cache",
      cloud: "☁️ Cloud Pub/Sub",
    };

    ctx.fillText(labels[type] || type, x, y);
    ctx.restore();
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#1e1e24";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Redraw grid
    ctx.strokeStyle = "#2b2c31";
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 24) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 24) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
  };

  const handleSyncToAi = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Export JPEG base64 (without data:image/jpeg;base64, prefix)
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    const base64Data = dataUrl.replace(/^data:image\/jpeg;base64,/, "");
    onSyncWhiteboardWithAi(base64Data);
    setHasSynced(true);
    setTimeout(() => setHasSynced(false), 3000);
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#1e1e24] rounded-2xl border border-[#3c4043] overflow-hidden shadow-2xl">
      {/* Top Toolbar */}
      <div className="px-4 py-2.5 bg-[#202124] border-b border-[#3c4043] flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-1.5 overflow-x-auto py-0.5">
          <button
            onClick={() => setTool("pen")}
            className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1 border transition-colors ${
              tool === "pen"
                ? "bg-blue-600 text-white border-blue-400"
                : "bg-[#2d2f34] text-gray-300 border-[#3c4043] hover:bg-[#383a40]"
            }`}
            title="Freehand Pen"
          >
            <Pencil className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Draw</span>
          </button>

          <button
            onClick={() => setTool("eraser")}
            className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1 border transition-colors ${
              tool === "eraser"
                ? "bg-blue-600 text-white border-blue-400"
                : "bg-[#2d2f34] text-gray-300 border-[#3c4043] hover:bg-[#383a40]"
            }`}
            title="Eraser"
          >
            <Eraser className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Eraser</span>
          </button>

          <div className="h-4 w-px bg-[#3c4043] mx-1" />

          {/* Architecture Components Stamps */}
          <button
            onClick={() => setTool("server")}
            className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1 border transition-colors ${
              tool === "server"
                ? "bg-blue-600 text-white border-blue-400"
                : "bg-[#2d2f34] text-gray-300 border-[#3c4043] hover:bg-[#383a40]"
            }`}
            title="Stamp API Server"
          >
            <Server className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden md:inline">Server</span>
          </button>

          <button
            onClick={() => setTool("database")}
            className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1 border transition-colors ${
              tool === "database"
                ? "bg-blue-600 text-white border-blue-400"
                : "bg-[#2d2f34] text-gray-300 border-[#3c4043] hover:bg-[#383a40]"
            }`}
            title="Stamp Database"
          >
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden md:inline">Database</span>
          </button>

          <button
            onClick={() => setTool("cache")}
            className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1 border transition-colors ${
              tool === "cache"
                ? "bg-blue-600 text-white border-blue-400"
                : "bg-[#2d2f34] text-gray-300 border-[#3c4043] hover:bg-[#383a40]"
            }`}
            title="Stamp Redis Cache"
          >
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline">Cache</span>
          </button>

          <button
            onClick={() => setTool("cloud")}
            className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1 border transition-colors ${
              tool === "cloud"
                ? "bg-blue-600 text-white border-blue-400"
                : "bg-[#2d2f34] text-gray-300 border-[#3c4043] hover:bg-[#383a40]"
            }`}
            title="Stamp Cloud Pub/Sub"
          >
            <Cloud className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden md:inline">Cloud</span>
          </button>

          {/* Color Palettes */}
          <div className="flex items-center space-x-1 ml-2">
            {["#4285f4", "#34a853", "#fbbc04", "#ea4335", "#ffffff"].map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`w-5 h-5 rounded-full border ${
                  color === c ? "ring-2 ring-white scale-110" : "border-[#3c4043]"
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center space-x-2">
          <button
            onClick={clearCanvas}
            className="p-1.5 text-gray-300 hover:text-white bg-[#2d2f34] hover:bg-[#3c4043] border border-[#3c4043] rounded-lg text-xs flex items-center gap-1 transition-colors"
            title="Clear canvas"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Clear</span>
          </button>

          <button
            onClick={handleSyncToAi}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all shadow-sm ${
              hasSynced
                ? "bg-emerald-600 text-white"
                : "bg-blue-600 hover:bg-blue-500 text-white"
            }`}
            title="Send whiteboard snapshot to AI interviewer for live analysis"
          >
            {hasSynced ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{hasSynced ? "Diagram Sent to AI" : "Share Diagram with AI"}</span>
          </button>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 relative overflow-hidden flex items-center justify-center bg-[#18191c]">
        <canvas
          ref={canvasRef}
          width={900}
          height={600}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          className="cursor-crosshair w-full h-full object-contain"
        />
      </div>
    </div>
  );
};

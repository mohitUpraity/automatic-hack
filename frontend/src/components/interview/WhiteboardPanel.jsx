import React, { useRef, useState, useEffect } from "react";
import {
  Pencil,
  Eraser,
  Database,
  Server,
  Cloud,
  Layers,
  RotateCcw,
  Share2,
  CheckCircle2,
} from "lucide-react";

export default function WhiteboardPanel({ onSyncWhiteboardWithAi }) {
  const canvasRef = useRef(null);
  const [tool, setTool] = useState("pen");
  const [color, setColor] = useState("#38bdf8");
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSynced, setHasSynced] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Fill dark canvas background
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw subtle grid pattern
    ctx.strokeStyle = "#1e293b";
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

  const startDrawing = (e) => {
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
      ctx.strokeStyle = tool === "eraser" ? "#0f172a" : color;
      ctx.lineWidth = tool === "eraser" ? 22 : 3;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
    } else {
      // Stamp Architecture Shape
      drawArchitectureBlock(ctx, x, y, tool);
    }
  };

  const draw = (e) => {
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

  const drawArchitectureBlock = (ctx, x, y, type) => {
    const width = 110;
    const height = 50;
    const rx = x - width / 2;
    const ry = y - height / 2;

    ctx.fillStyle = "#1e293b";
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;

    // Rounded Box
    ctx.beginPath();
    ctx.roundRect(rx, ry, width, height, 8);
    ctx.fill();
    ctx.stroke();

    // Label
    ctx.fillStyle = "#f8fafc";
    ctx.font = "bold 11px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    let label = "Microservice";
    if (type === "server") label = "API Server";
    if (type === "database") label = "PostgreSQL DB";
    if (type === "cache") label = "Redis Cache";
    if (type === "cloud") label = "Cloud CDN";

    ctx.fillText(label, x, y);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = "#1e293b";
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
  };

  const handleSyncWithAi = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
    const base64Jpeg = dataUrl.replace(/^data:image\/jpeg;base64,/, "");

    if (onSyncWhiteboardWithAi) {
      onSyncWhiteboardWithAi(base64Jpeg);
    }
    setHasSynced(true);
    setTimeout(() => setHasSynced(false), 3000);
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-900/95 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
      {/* Whiteboard Toolbar Header */}
      <div className="px-4 py-2.5 bg-slate-950/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-1.5 sm:space-x-2">
          {/* Pen / Eraser */}
          <button
            onClick={() => setTool("pen")}
            className={`p-2 rounded-lg text-xs flex items-center gap-1.5 transition-all ${
              tool === "pen"
                ? "bg-cyan-600 text-white shadow-md shadow-cyan-600/30"
                : "bg-slate-800 text-slate-300 hover:text-white"
            }`}
            title="Drawing Pen"
          >
            <Pencil className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Pen</span>
          </button>

          <button
            onClick={() => setTool("eraser")}
            className={`p-2 rounded-lg text-xs flex items-center gap-1.5 transition-all ${
              tool === "eraser"
                ? "bg-cyan-600 text-white shadow-md shadow-cyan-600/30"
                : "bg-slate-800 text-slate-300 hover:text-white"
            }`}
            title="Eraser"
          >
            <Eraser className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Eraser</span>
          </button>

          <div className="h-5 w-px bg-slate-800 mx-1" />

          {/* Architecture Shapes */}
          <button
            onClick={() => setTool("server")}
            className={`p-2 rounded-lg text-xs flex items-center gap-1.5 transition-all ${
              tool === "server" ? "bg-cyan-600 text-white" : "bg-slate-800 text-slate-300 hover:text-white"
            }`}
            title="Stamp Server"
          >
            <Server className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Server</span>
          </button>

          <button
            onClick={() => setTool("database")}
            className={`p-2 rounded-lg text-xs flex items-center gap-1.5 transition-all ${
              tool === "database" ? "bg-cyan-600 text-white" : "bg-slate-800 text-slate-300 hover:text-white"
            }`}
            title="Stamp Database"
          >
            <Database className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Database</span>
          </button>

          <button
            onClick={() => setTool("cache")}
            className={`p-2 rounded-lg text-xs flex items-center gap-1.5 transition-all ${
              tool === "cache" ? "bg-cyan-600 text-white" : "bg-slate-800 text-slate-300 hover:text-white"
            }`}
            title="Stamp Redis Cache"
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Cache</span>
          </button>

          <button
            onClick={() => setTool("cloud")}
            className={`p-2 rounded-lg text-xs flex items-center gap-1.5 transition-all ${
              tool === "cloud" ? "bg-cyan-600 text-white" : "bg-slate-800 text-slate-300 hover:text-white"
            }`}
            title="Stamp Cloud CDN"
          >
            <Cloud className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Cloud</span>
          </button>
        </div>

        {/* Color Palette & Actions */}
        <div className="flex items-center space-x-2">
          {/* Colors */}
          <div className="flex items-center space-x-1 bg-slate-900 px-2 py-1 rounded-lg border border-slate-700">
            {["#38bdf8", "#34d399", "#fbbf24", "#f87171", "#c084fc"].map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`w-4 h-4 rounded-full transition-transform ${
                  color === c ? "scale-125 ring-2 ring-white" : "opacity-70 hover:opacity-100"
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>

          <button
            onClick={handleClear}
            className="p-1.5 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs flex items-center gap-1"
            title="Clear whiteboard"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Clear</span>
          </button>

          <button
            onClick={handleSyncWithAi}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm ${
              hasSynced
                ? "bg-emerald-600 text-white"
                : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30"
            }`}
            title="Send whiteboard snapshot to AI interviewer for live architectural review"
          >
            {hasSynced ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{hasSynced ? "Diagram Synced" : "Sync with AI"}</span>
          </button>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 relative bg-slate-950 overflow-hidden cursor-crosshair">
        <canvas
          ref={canvasRef}
          width={1200}
          height={800}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          className="w-full h-full object-contain"
        />
      </div>
    </div>
  );
}

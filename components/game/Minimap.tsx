"use client";

import { useEffect, useRef } from "react";
import { useIsTouchDevice } from "@/hooks/useIsTouchDevice";
import { useIsLandscape } from "@/hooks/useIsLandscape";

interface MinimapProps {
  playerPos: { x: number; y: number };
  sharkPos: { x: number; y: number };
  sharkRotation?: number;
  stations: Array<{ x: number; y: number }>;
  items?: Array<{ x: number; y: number }>;
  worldSize: { width: number; height: number };
  waterLineY: number;
  visible?: boolean;
  onToggle?: () => void;
}

export default function Minimap({
  playerPos,
  sharkPos,
  sharkRotation = 0,
  stations,
  items = [],
  worldSize,
  waterLineY,
  visible = true,
  onToggle,
}: MinimapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isTouchDevice = useIsTouchDevice();
  const isLandscape = useIsLandscape();
  // Smaller minimap in landscape to not block view
  const MINIMAP_SIZE = isTouchDevice ? (isLandscape ? 80 : 100) : 120;

  useEffect(() => {
    if (!visible) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size for retina displays
    const dpr = window.devicePixelRatio || 1;
    canvas.width = MINIMAP_SIZE * dpr;
    canvas.height = MINIMAP_SIZE * dpr;
    ctx.scale(dpr, dpr);

    // Clear canvas
    ctx.clearRect(0, 0, MINIMAP_SIZE, MINIMAP_SIZE);

    // Helper function to convert world coordinates to minimap coordinates
    const worldToMinimap = (x: number, y: number) => {
      const scaleX = MINIMAP_SIZE / worldSize.width;
      const scaleY = MINIMAP_SIZE / worldSize.height;
      return {
        x: x * scaleX,
        y: y * scaleY,
      };
    };

    // Draw water zone (bottom portion)
    const waterLineOnMinimap = worldToMinimap(0, waterLineY).y;
    ctx.fillStyle = "rgba(30, 144, 255, 0.3)"; // Semi-transparent blue
    ctx.fillRect(0, waterLineOnMinimap, MINIMAP_SIZE, MINIMAP_SIZE - waterLineOnMinimap);

    // Draw beach zone (top portion)
    ctx.fillStyle = "rgba(194, 178, 128, 0.2)"; // Semi-transparent sandy color
    ctx.fillRect(0, 0, MINIMAP_SIZE, waterLineOnMinimap);

    // Draw water line
    ctx.strokeStyle = "rgba(30, 144, 255, 0.5)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, waterLineOnMinimap);
    ctx.lineTo(MINIMAP_SIZE, waterLineOnMinimap);
    ctx.stroke();

    // Draw beach items (yellow dots)
    if (items.length > 0) {
      ctx.fillStyle = "rgba(255, 223, 0, 0.8)";
      items.forEach((item) => {
        const pos = worldToMinimap(item.x, item.y);
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 2, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    // Draw harpoon stations (green squares)
    ctx.fillStyle = "rgba(0, 255, 0, 0.8)";
    stations.forEach((station) => {
      const pos = worldToMinimap(station.x, station.y);
      ctx.fillRect(pos.x - 2.5, pos.y - 2.5, 5, 5);
    });

    // Draw player (blue dot with white outline)
    const playerMinimapPos = worldToMinimap(playerPos.x, playerPos.y);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
    ctx.lineWidth = 1.5;
    ctx.fillStyle = "rgba(0, 150, 255, 1)";
    ctx.beginPath();
    ctx.arc(playerMinimapPos.x, playerMinimapPos.y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Draw shark (red triangle pointing in movement direction)
    const sharkMinimapPos = worldToMinimap(sharkPos.x, sharkPos.y);
    const triangleSize = 6;

    ctx.save();
    ctx.translate(sharkMinimapPos.x, sharkMinimapPos.y);
    ctx.rotate(sharkRotation);

    ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
    ctx.lineWidth = 1.5;
    ctx.fillStyle = "rgba(255, 0, 0, 1)";

    ctx.beginPath();
    ctx.moveTo(triangleSize, 0); // Point of triangle (front of shark)
    ctx.lineTo(-triangleSize / 2, -triangleSize / 2);
    ctx.lineTo(-triangleSize / 2, triangleSize / 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.restore();

  }, [visible, playerPos, sharkPos, sharkRotation, stations, items, worldSize, waterLineY, MINIMAP_SIZE]);

  if (!visible) return null;

  // In landscape mobile, position top-center to avoid side controls
  const positionClasses = isTouchDevice && isLandscape
    ? "fixed top-2 left-1/2 -translate-x-1/2 z-40"
    : "fixed top-12 right-2 sm:top-4 sm:right-4 z-40";

  return (
    <div
      className={positionClasses}
      style={{ paddingTop: isTouchDevice ? "env(safe-area-inset-top, 0px)" : undefined }}
    >
      <div className="relative">
        {/* Minimap container */}
        <div className="bg-black/60 backdrop-blur-sm rounded-lg p-1.5 sm:p-2 border border-white/20 shadow-lg">
          <canvas
            ref={canvasRef}
            width={MINIMAP_SIZE}
            height={MINIMAP_SIZE}
            style={{ width: MINIMAP_SIZE, height: MINIMAP_SIZE }}
            className="rounded"
          />

          {/* Legend - horizontal in landscape, vertical otherwise */}
          <div className={`mt-1.5 text-[10px] text-white/80 ${isLandscape && isTouchDevice ? 'flex gap-3' : 'space-y-1'}`}>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              <span>You</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-red-500" style={{ clipPath: "polygon(100% 50%, 0 0, 0 100%)" }}></div>
              <span>Shark</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500"></div>
              <span>Stations</span>
            </div>
          </div>
        </div>

        {/* Toggle button */}
        {onToggle && (
          <button
            onClick={onToggle}
            className="absolute -bottom-6 sm:-bottom-8 right-0 text-[10px] sm:text-xs text-white/60 hover:text-white/90 active:text-white transition-colors"
            title={isTouchDevice ? "Tap to hide" : "Press M to toggle"}
          >
            {isTouchDevice ? "Hide" : "Hide (M)"}
          </button>
        )}
      </div>
    </div>
  );
}

import { forwardRef, type PointerEvent } from "react";
import { DRAWING_HEIGHT, DRAWING_WIDTH, drawingKindLabels, type DrawingDocument, type DrawingElement } from "@/domain/drawings";
import { isLinearKind, rotatePoint, type AreaHandle, type ResizeHandle } from "@/domain/drawingGeometry";

export type ControlHandle = ResizeHandle | "move";

const areaHandles: Array<{ handle: AreaHandle; x: number; y: number; label: string }> = [
  { handle: "nw", x: -1, y: -1, label: "มุมซ้ายบน" },
  { handle: "n", x: 0, y: -1, label: "ขอบบน" },
  { handle: "ne", x: 1, y: -1, label: "มุมขวาบน" },
  { handle: "e", x: 1, y: 0, label: "ขอบขวา" },
  { handle: "se", x: 1, y: 1, label: "มุมขวาล่าง" },
  { handle: "s", x: 0, y: 1, label: "ขอบล่าง" },
  { handle: "sw", x: -1, y: 1, label: "มุมซ้ายล่าง" },
  { handle: "w", x: -1, y: 0, label: "ขอบซ้าย" },
];

function ControlGrip({ x, y, size, handle, label, onPointerDown }: { x: number; y: number; size: number; handle: ControlHandle; label: string; onPointerDown: (event: PointerEvent<SVGRectElement>, handle: ControlHandle) => void }) {
  const visual = size * (handle === "move" ? 0.58 : 0.45);
  const diagonal = ["nw", "ne", "se", "sw"].includes(handle);
  const cursor = handle === "move" ? "grab" : handle === "n" || handle === "s" ? "ns-resize" : handle === "e" || handle === "w" ? "ew-resize" : handle === "nw" || handle === "se" ? "nwse-resize" : "nesw-resize";
  return <g data-control-handle={handle}>
    <rect aria-label={label} data-editor-overlay="true" fill="transparent" height={size} onPointerDown={(event) => onPointerDown(event, handle)} pointerEvents="all" style={{ cursor }} width={size} x={x - size / 2} y={y - size / 2} />
    {handle === "move" ? <>
      <circle cx={x} cy={y} fill="#ffffff" pointerEvents="none" r={visual / 2} stroke="#1d4ed8" strokeWidth={size * 0.07} />
      <path d={`M${x} ${y - visual * 0.32}V${y + visual * 0.32} M${x - visual * 0.32} ${y}H${x + visual * 0.32} M${x - visual * 0.12} ${y - visual * 0.2}L${x} ${y - visual * 0.32}L${x + visual * 0.12} ${y - visual * 0.2} M${x - visual * 0.12} ${y + visual * 0.2}L${x} ${y + visual * 0.32}L${x + visual * 0.12} ${y + visual * 0.2} M${x - visual * 0.2} ${y - visual * 0.12}L${x - visual * 0.32} ${y}L${x - visual * 0.2} ${y + visual * 0.12} M${x + visual * 0.2} ${y - visual * 0.12}L${x + visual * 0.32} ${y}L${x + visual * 0.2} ${y + visual * 0.12}`} fill="none" pointerEvents="none" stroke="#1d4ed8" strokeLinecap="round" strokeLinejoin="round" strokeWidth={size * 0.055} />
    </> : <>
      <rect fill="#ffffff" height={visual} pointerEvents="none" rx={size * 0.1} stroke="#1d4ed8" strokeWidth={size * 0.065} width={visual} x={x - visual / 2} y={y - visual / 2} />
      <path d={diagonal ? `M${x - visual * 0.21} ${y + visual * 0.21}L${x + visual * 0.21} ${y - visual * 0.21}` : handle === "n" || handle === "s" ? `M${x} ${y - visual * 0.22}V${y + visual * 0.22}` : `M${x - visual * 0.22} ${y}H${x + visual * 0.22}`} fill="none" pointerEvents="none" stroke="#1d4ed8" strokeLinecap="round" strokeWidth={size * 0.06} />
    </>}
  </g>;
}

function TouchSelectionControls({ item, size, onPointerDown }: { item: DrawingElement; size: number; onPointerDown: (event: PointerEvent<SVGRectElement>, id: string, handle: ControlHandle) => void }) {
  const center = { x: item.x + item.width / 2, y: item.y + item.height / 2 };
  const control = (event: PointerEvent<SVGRectElement>, handle: ControlHandle) => onPointerDown(event, item.id, handle);
  if (isLinearKind(item.kind)) {
    const start = rotatePoint({ x: item.x, y: item.y }, center, item.rotation);
    const end = rotatePoint({ x: item.x + item.width, y: item.y + item.height }, center, item.rotation);
    const length = Math.hypot(end.x - start.x, end.y - start.y);
    const direction = length ? { x: (end.x - start.x) / length, y: (end.y - start.y) / length } : { x: 1, y: 0 };
    const half = Math.max(length / 2, size * 1.65);
    const startGrip = { x: center.x - direction.x * half, y: center.y - direction.y * half };
    const endGrip = { x: center.x + direction.x * half, y: center.y + direction.y * half };
    return <g data-editor-overlay="true" data-selected-id={item.id}>
      <line stroke="#1d4ed8" strokeDasharray={`${size * 0.2} ${size * 0.13}`} strokeWidth={size * 0.055} x1={start.x} x2={end.x} y1={start.y} y2={end.y} />
      {length < size * 3.3 ? <><line stroke="#93c5fd" strokeDasharray={`${size * 0.1} ${size * 0.1}`} strokeWidth={size * 0.04} x1={start.x} x2={startGrip.x} y1={start.y} y2={startGrip.y} /><line stroke="#93c5fd" strokeDasharray={`${size * 0.1} ${size * 0.1}`} strokeWidth={size * 0.04} x1={end.x} x2={endGrip.x} y1={end.y} y2={endGrip.y} /></> : null}
      <ControlGrip handle="start" label="จับปลายต้นเพื่อยืดหดเส้น" onPointerDown={control} size={size} {...startGrip} />
      <ControlGrip handle="end" label="จับปลายท้ายเพื่อยืดหดเส้น" onPointerDown={control} size={size} {...endGrip} />
      <ControlGrip handle="move" label="จับตรงกลางเพื่อย้ายวัตถุ" onPointerDown={control} size={size} {...center} />
    </g>;
  }

  const width = Math.max(Math.abs(item.width) + size * 0.2, size * 3.3);
  const height = Math.max(Math.abs(item.height) + size * 0.2, size * 3.3);
  const left = center.x - width / 2;
  const top = center.y - height / 2;
  const actualLeft = center.x - Math.abs(item.width) / 2;
  const actualTop = center.y - Math.abs(item.height) / 2;
  const expanded = width > Math.abs(item.width) + size || height > Math.abs(item.height) + size;
  return <g data-editor-overlay="true" data-selected-id={item.id} transform={`rotate(${item.rotation} ${center.x} ${center.y})`}>
    <rect fill="none" height={height} pointerEvents="none" stroke="#1d4ed8" strokeDasharray={`${size * 0.18} ${size * 0.13}`} strokeWidth={size * 0.045} width={width} x={left} y={top} />
    {expanded ? <>
      <rect fill="none" height={Math.abs(item.height)} pointerEvents="none" stroke="#93c5fd" strokeWidth={size * 0.035} width={Math.abs(item.width)} x={actualLeft} y={actualTop} />
      {([-1, 1] as const).flatMap((horizontal) => ([-1, 1] as const).map((vertical) => <line key={`${horizontal}-${vertical}`} stroke="#93c5fd" strokeDasharray={`${size * 0.1} ${size * 0.1}`} strokeWidth={size * 0.035} x1={center.x + horizontal * Math.abs(item.width) / 2} x2={center.x + horizontal * width / 2} y1={center.y + vertical * Math.abs(item.height) / 2} y2={center.y + vertical * height / 2} />))}
    </> : null}
    {areaHandles.filter(({ handle }) => item.kind !== "text" || handle.length === 2).map(({ handle, x, y, label }) => <ControlGrip handle={handle} key={handle} label={`จับ${label}เพื่อยืดหด`} onPointerDown={control} size={size} x={center.x + x * width / 2} y={center.y + y * height / 2} />)}
    <ControlGrip handle="move" label="จับตรงกลางเพื่อย้ายวัตถุ" onPointerDown={control} size={size} {...center} />
  </g>;
}

function DiagramElement({ item, selected, resizeHandleSize, hitSize, onPointerDown, onResizePointerDown, onVertexPointerDown }: { item: DrawingElement; selected: boolean; resizeHandleSize: number; hitSize: number; onPointerDown?: (event: PointerEvent<SVGGElement>, id: string) => void; onResizePointerDown?: (event: PointerEvent<SVGRectElement>, id: string) => void; onVertexPointerDown?: (event: PointerEvent<SVGCircleElement>, id: string, index: number) => void }) {
  const { x, y, width, height } = item;
  const centerX = x + width / 2;
  const centerY = y + height / 2;
  const common = { fill: item.fill, stroke: item.stroke, strokeWidth: item.strokeWidth };
  const areaFill = item.hatch ? "url(#drawing-hatch)" : item.fill;
  const visibleHandleSize = Math.max(28, Math.min(48, resizeHandleSize * 0.55));
  const label = item.text ? <text dominantBaseline="middle" fill="#0f172a" fontFamily="sans-serif" fontSize={Math.min(23, item.fontSize)} fontWeight="600" pointerEvents="none" textAnchor="middle" x={centerX} y={centerY}>{item.text}</text> : null;
  let body;
  switch (item.kind) {
    case "rect":
    case "symbol":
      body = <><rect data-editor-overlay="true" fill="transparent" height={Math.max(Math.abs(height), hitSize)} pointerEvents="all" width={Math.max(Math.abs(width), hitSize)} x={centerX - Math.max(Math.abs(width), hitSize) / 2} y={centerY - Math.max(Math.abs(height), hitSize) / 2} /><rect {...common} fill={areaFill} strokeDasharray={item.dashed ? "8 5" : undefined} height={Math.max(1, Math.abs(height))} rx={item.kind === "symbol" ? 16 : 4} width={Math.max(1, Math.abs(width))} x={Math.min(x, x + width)} y={Math.min(y, y + height)} />{label}</>;
      break;
    case "ellipse":
      body = <><rect data-editor-overlay="true" fill="transparent" height={Math.max(Math.abs(height), hitSize)} pointerEvents="all" width={Math.max(Math.abs(width), hitSize)} x={centerX - Math.max(Math.abs(width), hitSize) / 2} y={centerY - Math.max(Math.abs(height), hitSize) / 2} /><ellipse {...common} cx={centerX} cy={centerY} rx={Math.max(1, Math.abs(width) / 2)} ry={Math.max(1, Math.abs(height) / 2)} />{label}</>;
      break;
    case "polygon":
      body = <><rect data-editor-overlay="true" fill="transparent" height={Math.max(Math.abs(height), hitSize)} pointerEvents="all" width={Math.max(Math.abs(width), hitSize)} x={centerX - Math.max(Math.abs(width), hitSize) / 2} y={centerY - Math.max(Math.abs(height), hitSize) / 2} /><polygon {...common} fill={areaFill} strokeDasharray={item.dashed ? "8 5" : undefined} points={(item.points ?? []).map((point) => `${x + width * point.x},${y + height * point.y}`).join(" ")} />{label}</>;
      break;
    case "line":
    case "arrow":
      body = <><line markerEnd={item.kind === "arrow" ? "url(#drawing-arrow)" : undefined} stroke={item.stroke} strokeDasharray={item.dashed ? "8 5" : undefined} strokeWidth={Math.max(1, item.strokeWidth)} x1={x} x2={x + width} y1={y} y2={y + height} /><line data-editor-overlay="true" stroke="transparent" strokeWidth={hitSize} x1={x} x2={x + width} y1={y} y2={y + height} /></>;
      break;
    case "wall":
      body = <><line stroke={item.stroke} strokeDasharray={item.dashed ? "8 5" : undefined} strokeLinecap="square" strokeWidth={item.strokeWidth} x1={x} x2={x + width} y1={y} y2={y + height} /><line data-editor-overlay="true" stroke="transparent" strokeWidth={hitSize} x1={x} x2={x + width} y1={y} y2={y + height} /></>;
      break;
    case "window":
      body = <><line stroke={item.stroke} strokeWidth="2" x1={x} x2={x + width} y1={y - 5} y2={y + height - 5} /><line stroke={item.stroke} strokeWidth="2" x1={x} x2={x + width} y1={y + 5} y2={y + height + 5} /><line stroke={item.stroke} strokeWidth="2" x1={x} x2={x} y1={y - 9} y2={y + 9} /><line stroke={item.stroke} strokeWidth="2" x1={x + width} x2={x + width} y1={y + height - 9} y2={y + height + 9} /><line data-editor-overlay="true" stroke="transparent" strokeWidth={hitSize} x1={x} x2={x + width} y1={y} y2={y + height} /></>;
      break;
    case "door":
      body = <><rect data-editor-overlay="true" fill="transparent" height={Math.max(Math.abs(height), hitSize)} pointerEvents="all" width={Math.max(Math.abs(width), hitSize)} x={centerX - Math.max(Math.abs(width), hitSize) / 2} y={centerY - Math.max(Math.abs(height), hitSize) / 2} />{item.doorStyle === "double" ? <><path d={`M${x} ${y + height} L${x} ${y + height / 2} A${Math.abs(width / 2)} ${Math.abs(height / 2)} 0 0 1 ${centerX} ${y + height}`} fill="none" stroke={item.stroke} strokeWidth="1.8" /><path d={`M${x + width} ${y + height} L${x + width} ${y + height / 2} A${Math.abs(width / 2)} ${Math.abs(height / 2)} 0 0 0 ${centerX} ${y + height}`} fill="none" stroke={item.stroke} strokeWidth="1.8" /></> : <path d={item.swing === "right" ? `M${x + width} ${y + height} L${x + width} ${y} A${Math.abs(width)} ${Math.abs(height)} 0 0 0 ${x} ${y + height}` : `M${x} ${y + height} L${x} ${y} A${Math.abs(width)} ${Math.abs(height)} 0 0 1 ${x + width} ${y + height}`} fill="none" stroke={item.stroke} strokeWidth="1.8" />}<line stroke={item.stroke} strokeWidth="3" x1={x} x2={x + width} y1={y + height} y2={y + height} /><circle cx={item.doorStyle === "double" ? x : item.swing === "right" ? x + width : x} cy={y + height} fill="#ffffff" r="3" stroke={item.stroke} strokeWidth="2" /></>;
      break;
    case "stairs":
      body = <><rect data-editor-overlay="true" fill="transparent" height={Math.max(Math.abs(height), hitSize)} pointerEvents="all" width={Math.max(Math.abs(width), hitSize)} x={centerX - Math.max(Math.abs(width), hitSize) / 2} y={centerY - Math.max(Math.abs(height), hitSize) / 2} /><rect fill="#ffffff" height={Math.abs(height)} stroke={item.stroke} strokeWidth={item.strokeWidth} width={Math.abs(width)} x={Math.min(x, x + width)} y={Math.min(y, y + height)} />{item.stairsStyle === "l" ? <><path d={`M${x + width * 0.48} ${y}V${y + height * 0.52}H${x + width}`} fill="none" stroke={item.stroke} strokeWidth="2" />{Array.from({ length: 5 }, (_, index) => <path d={`M${x} ${y + height * (index + 1) / 11}H${x + width * 0.48} M${x + width * (0.55 + index * 0.09)} ${y + height * 0.52}V${y + height}`} key={index} stroke={item.stroke} strokeWidth="1.4" />)}<path d={`M${x + width * 0.24} ${y + height * 0.42}V${y + height * 0.65}H${x + width * 0.86}`} fill="none" markerEnd="url(#drawing-arrow)" stroke={item.stroke} strokeWidth="2" /></> : item.stairsStyle === "u" ? <><line stroke={item.stroke} strokeWidth="2" x1={centerX} x2={centerX} y1={y} y2={y + height} />{Array.from({ length: 6 }, (_, index) => <path d={`M${x} ${y + height * (index + 1) / 7}H${centerX} M${centerX} ${y + height * (index + 1) / 7}H${x + width}`} key={index} stroke={item.stroke} strokeWidth="1.4" />)}<path d={`M${x + width * 0.25} ${y + height * 0.82}V${y + height * 0.18} M${x + width * 0.75} ${y + height * 0.18}V${y + height * 0.82}`} fill="none" markerEnd="url(#drawing-arrow)" stroke={item.stroke} strokeWidth="2" /></> : <>{Array.from({ length: 7 }, (_, index) => <line key={index} stroke={item.stroke} strokeWidth="1.5" x1={x} x2={x + width} y1={y + height * (index + 1) / 8} y2={y + height * (index + 1) / 8} />)}<line markerEnd="url(#drawing-arrow)" stroke={item.stroke} strokeWidth="2" x1={centerX} x2={centerX} y1={y + height * 0.85} y2={y + height * 0.2} /></>}</>;
      break;
    case "callout":
      body = <><rect data-editor-overlay="true" fill="transparent" height={Math.max(Math.abs(height), hitSize)} pointerEvents="all" width={Math.max(Math.abs(width), hitSize)} x={Math.min(x, x + width)} y={Math.min(y, y + height)} /><ellipse cx={x + 28} cy={y + 20} fill="#ffffff" rx="27" ry="18" stroke={item.stroke} strokeWidth={item.strokeWidth} /><text dominantBaseline="middle" fill={item.stroke} fontFamily="sans-serif" fontSize={item.fontSize} fontWeight="700" textAnchor="middle" x={x + 28} y={y + 20}>{item.text || "1"}</text><line stroke={item.stroke} strokeWidth={Math.max(1, item.strokeWidth - 0.5)} x1={x + 55} x2={x + width} y1={y + 20} y2={y + height} /></>;
      break;
    case "dimension": {
      const length = Math.hypot(width, height) || 1;
      const tx = -height / length * 8;
      const ty = width / length * 8;
      body = <><line stroke={item.stroke} strokeWidth="1.5" x1={x} x2={x + width} y1={y} y2={y + height} /><path d={`M${x - tx} ${y - ty}L${x + tx} ${y + ty} M${x + width - tx} ${y + height - ty}L${x + width + tx} ${y + height + ty}`} fill="none" stroke={item.stroke} strokeWidth="2" /><text dominantBaseline="middle" fill="#334155" fontFamily="sans-serif" fontSize={item.fontSize} textAnchor="middle" x={centerX - tx * 2} y={centerY - ty * 2}>{item.text}</text><line data-editor-overlay="true" stroke="transparent" strokeWidth={hitSize} x1={x} x2={x + width} y1={y} y2={y + height} /></>;
      break;
    }
    case "text":
      body = <><rect data-editor-overlay="true" fill="transparent" height={Math.max(item.fontSize * 1.3, hitSize)} pointerEvents="all" width={Math.max(Math.min(Math.abs(width), (item.text || "ข้อความ").length * item.fontSize * 0.8), hitSize)} x={x} y={y - hitSize * 0.25} /><text dominantBaseline="hanging" fill={item.fill} fontFamily="sans-serif" fontSize={item.fontSize} fontWeight="700" x={x} y={y}>{item.text || "ข้อความ"}</text></>;
      break;
  }
  return (
    <g
      aria-label={item.text || drawingKindLabels[item.kind]}
      className={onPointerDown ? "cursor-move" : undefined}
      data-element-id={item.id}
      onPointerDown={onPointerDown ? (event) => onPointerDown(event, item.id) : undefined}
      transform={`rotate(${item.rotation} ${centerX} ${centerY})`}
    >
      {body}
      {selected ? <rect data-editor-overlay="true" fill="none" height={Math.max(24, Math.abs(height)) + 12} pointerEvents="none" stroke="#2563eb" strokeDasharray="9 6" strokeWidth="2" width={Math.max(24, Math.abs(width)) + 12} x={Math.min(x, x + width) - 6} y={Math.min(y, y + height) - 6} /> : null}
      {selected && onResizePointerDown ? <g data-editor-overlay="true">
        <rect aria-label="ลากเพื่อปรับขนาด" data-editor-overlay="true" fill="transparent" height={resizeHandleSize} onPointerDown={(event) => onResizePointerDown(event, item.id)} pointerEvents="all" width={resizeHandleSize} x={x + width - resizeHandleSize / 2} y={y + height - resizeHandleSize / 2} />
        <rect fill="#2563eb" height={visibleHandleSize} pointerEvents="none" rx="5" stroke="#ffffff" strokeWidth="3" width={visibleHandleSize} x={x + width - visibleHandleSize / 2} y={y + height - visibleHandleSize / 2} />
      </g> : null}
      {selected && item.kind === "polygon" && onVertexPointerDown ? item.points?.map((point, index) => <g data-editor-overlay="true" key={index}><circle aria-label={`ลากจุดที่ ${index + 1}`} cx={x + width * point.x} cy={y + height * point.y} fill="transparent" onPointerDown={(event) => { event.stopPropagation(); onVertexPointerDown(event, item.id, index); }} pointerEvents="all" r={resizeHandleSize / 2} /><circle cx={x + width * point.x} cy={y + height * point.y} fill="#ffffff" pointerEvents="none" r={Math.max(7, resizeHandleSize * 0.17)} stroke="#1d4ed8" strokeWidth="2" /></g>) : null}
    </g>
  );
}

type Props = {
  drawing: DrawingDocument;
  previewElement?: DrawingElement | null;
  selectedId?: string | null;
  resizeHandleSize?: number;
  viewBox?: string;
  onElementPointerDown?: (event: PointerEvent<SVGGElement>, id: string) => void;
  onResizePointerDown?: (event: PointerEvent<SVGRectElement>, id: string) => void;
  onVertexPointerDown?: (event: PointerEvent<SVGCircleElement>, id: string, index: number) => void;
  onControlPointerDown?: (event: PointerEvent<SVGRectElement>, id: string, handle: ControlHandle) => void;
  onBackgroundPointerDown?: (event: PointerEvent<SVGSVGElement>) => void;
  onPointerMove?: (event: PointerEvent<SVGSVGElement>) => void;
  onPointerUp?: (event: PointerEvent<SVGSVGElement>) => void;
  onPointerCancel?: (event: PointerEvent<SVGSVGElement>) => void;
  onLostPointerCapture?: (event: PointerEvent<SVGSVGElement>) => void;
  className?: string;
  touchControls?: boolean;
};

export const DrawingArtwork = forwardRef<SVGSVGElement, Props>(function DrawingArtwork({ drawing, previewElement, selectedId, resizeHandleSize = 44, viewBox, onElementPointerDown, onResizePointerDown, onVertexPointerDown, onControlPointerDown, onBackgroundPointerDown, onPointerMove, onPointerUp, onPointerCancel, onLostPointerCapture, className, touchControls = false }, ref) {
  const selected = drawing.elements.find((item) => item.id === selectedId);
  return (
    <svg
      aria-label={`แบบ${drawing.title} ภาพประกอบไม่มีสเกล`}
      className={className}
      onPointerDown={onBackgroundPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      onLostPointerCapture={onLostPointerCapture}
      ref={ref}
      role="img"
      viewBox={viewBox ?? `0 0 ${DRAWING_WIDTH} ${DRAWING_HEIGHT}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <marker id="drawing-arrow" markerHeight="10" markerWidth="10" orient="auto" refX="9" refY="5"><path d="M0 0 L10 5 L0 10 Z" fill="context-stroke" /></marker>
        <pattern id="drawing-hatch" patternUnits="userSpaceOnUse" width="10" height="10"><rect width="10" height="10" fill="#ffffff" /><path d="M0 0L10 10 M10 0L0 10" fill="none" stroke="#d98aab" strokeWidth="0.8" /></pattern>
      </defs>
      <rect fill="#ffffff" height={DRAWING_HEIGHT} width={DRAWING_WIDTH} x="0" y="0" />
      {drawing.elements.map((item) => <DiagramElement hitSize={touchControls ? resizeHandleSize : 26} item={item} key={item.id} onPointerDown={onElementPointerDown} onResizePointerDown={touchControls ? undefined : onResizePointerDown} onVertexPointerDown={onVertexPointerDown} resizeHandleSize={resizeHandleSize} selected={item.id === selectedId} />)}
      {previewElement ? <g opacity="0.65" pointerEvents="none"><DiagramElement hitSize={0} item={previewElement} resizeHandleSize={resizeHandleSize} selected={false} /></g> : null}
      {touchControls && selected && onControlPointerDown ? <TouchSelectionControls item={selected} onPointerDown={onControlPointerDown} size={resizeHandleSize} /> : null}
    </svg>
  );
});

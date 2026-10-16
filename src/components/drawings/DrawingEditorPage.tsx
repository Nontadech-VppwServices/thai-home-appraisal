"use client";

import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Copy, Download, ImagePlus, Redo2, RotateCcw, RotateCw, Save, SlidersHorizontal, Trash2, Type, Undo2, X, ZoomIn, ZoomOut } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore, type KeyboardEvent, type PointerEvent } from "react";
import { canEdit, canView, ownerTeamLabel } from "@/domain/access";
import type { AppraisalJob } from "@/domain/appraisal";
import { DRAWING_HEIGHT, DRAWING_WIDTH, createDrawingMaterial, drawingKindLabels, drawingMaterialCategories, drawingMaterials, drawingPalette, moveElement, type DrawingDocument, type DrawingElement, type DrawingMaterialCategory, type DrawingMaterialId } from "@/domain/drawings";
import { isLinearKind, movePolygonVertex, pickDrawingElement, resizeDrawingElement, snapDrawingPoint, type ResizeHandle } from "@/domain/drawingGeometry";
import { getJob, saveDrawing, subscribeToJobs } from "@/infrastructure/storage/appraisalStore";
import { AccessBanner, Button, EmptyState, Field, Input, LinkButton, Select } from "../ui";
import { MissingJob } from "../JobContext";
import { useAccess } from "../useAccess";
import { DrawingArtwork, type ControlHandle } from "./DrawingArtwork";
import { DrawingImageImport } from "./DrawingImageImport";
import { MobilePropertySheet } from "./MobilePropertySheet";

type View = { x: number; y: number; width: number; height: number };
type Gesture = { mode: "move" | "resize" | "vertex" | "pan" | "draw"; id?: string; handle?: ResizeHandle; vertexIndex?: number; startX: number; startY: number; view: View; drawing: DrawingDocument; changed: boolean };
const initialView: View = { x: 0, y: 0, width: DRAWING_WIDTH, height: DRAWING_HEIGHT };

function emptyJob(): AppraisalJob | null { return null; }
function newId(): string { return globalThis.crypto?.randomUUID?.() ?? `element-${Date.now()}-${Math.random().toString(36).slice(2)}`; }
function clamp(value: number, min: number, max: number) { return Math.max(min, Math.min(max, value)); }

export function DrawingEditorPage({ jobId, drawingId }: { jobId: string; drawingId: string }) {
  const { permission, team } = useAccess();
  const level = permission("drawings");
  const job = useSyncExternalStore(subscribeToJobs, () => getJob(jobId), emptyJob);
  if (!job) return <MissingJob />;
  const drawing = job.drawings.find((item) => item.id === drawingId);
  if (!drawing) return <EmptyState title="ไม่พบแบบแปลง" description="แบบนี้อาจถูกลบไปแล้ว" action={<LinkButton href={`/jobs/${jobId}/drawings`}>กลับไปรายการแบบ</LinkButton>} />;
  const editable = (team === "teamB" || team === "admin") && canEdit(level) && (job.status === "assigned" || job.status === "changesRequested");
  return <DrawingEditor drawing={drawing} editable={editable} jobId={jobId} level={level} />;
}

function DrawingEditor({ drawing: initial, editable, jobId, level }: { drawing: DrawingDocument; editable: boolean; jobId: string; level: "none" | "read" | "edit" }) {
  const [drawing, setDrawing] = useState(initial);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [history, setHistory] = useState<{ past: DrawingDocument[]; future: DrawingDocument[] }>({ past: [], future: [] });
  const [view, setView] = useState<View>(initialView);
  const [saveMessage, setSaveMessage] = useState("บันทึกแล้ว");
  const [showProperties, setShowProperties] = useState(false);
  const [showImageImport, setShowImageImport] = useState(false);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [textDraft, setTextDraft] = useState("");
  const [symbol, setSymbol] = useState(drawingPalette[initial.type][0]);
  const [materialCategory, setMaterialCategory] = useState<DrawingMaterialCategory>("draw");
  const [activeMaterial, setActiveMaterial] = useState<DrawingMaterialId | null>(null);
  const [freeAngle, setFreeAngle] = useState(false);
  const [draftElement, setDraftElement] = useState<DrawingElement | null>(null);
  const [resizeHandleSize, setResizeHandleSize] = useState(44);
  const [touchControls, setTouchControls] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const propertiesButtonRef = useRef<HTMLButtonElement>(null);
  const propertiesCloseRef = useRef<HTMLButtonElement>(null);
  const selectedDockRef = useRef<HTMLElement>(null);
  const drawingRef = useRef(drawing);
  const viewRef = useRef(view);
  const gestureRef = useRef<Gesture | null>(null);
  const pointersRef = useRef(new Map<number, { x: number; y: number }>());
  const pinchRef = useRef<{ distance: number; centerX: number; centerY: number; view: View } | null>(null);
  const textEditRef = useRef<{ id: string; original: string; draft: string } | null>(null);
  const draftRef = useRef<DrawingElement | null>(null);

  const selected = drawing.elements.find((item) => item.id === selectedId) ?? null;
  const activeMaterialDefinition = drawingMaterials.find((item) => item.id === activeMaterial) ?? null;
  const visibleMaterials = drawingMaterials.filter((item) => item.category === materialCategory);

  function updateView(next: View) {
    viewRef.current = next;
    setView(next);
  }

  useEffect(() => {
    const query = window.matchMedia("(max-width: 767px), (pointer: coarse)");
    const mobileQuery = window.matchMedia("(max-width: 767px)");
    const update = () => setTouchControls(query.matches);
    const updateMobile = () => setIsMobile(mobileQuery.matches);
    update();
    updateMobile();
    query.addEventListener("change", update);
    mobileQuery.addEventListener("change", updateMobile);
    return () => {
      query.removeEventListener("change", update);
      mobileQuery.removeEventListener("change", updateMobile);
    };
  }, []);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    // iOS in-app browsers may scroll the page despite touch-action on SVG children.
    // Only cancel native scrolling while a canvas gesture owns a touch pointer.
    const preventCanvasScroll = (event: TouchEvent) => {
      if (pointersRef.current.size > 0 && event.cancelable) event.preventDefault();
    };
    svg.addEventListener("touchmove", preventCanvasScroll, { passive: false });
    return () => svg.removeEventListener("touchmove", preventCanvasScroll);
  }, []);

  useEffect(() => {
    if (!isMobile || !showProperties) return;
    const previousOverflow = document.body.style.overflow;
    const opener = propertiesButtonRef.current;
    document.body.style.overflow = "hidden";
    propertiesCloseRef.current?.focus();
    const onEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); setShowProperties(false); }
      if (event.key !== "Tab") return;
      const panel = document.getElementById("drawing-properties");
      const focusable = panel?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href]');
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onEscape);
      opener?.focus();
    };
  }, [isMobile, showProperties]);

  useEffect(() => {
    if (!editingTextId) return;
    const input = document.getElementById("drawing-text-draft") as HTMLInputElement | null;
    input?.focus();
    input?.select();
  }, [editingTextId]);

  useEffect(() => {
    if (isMobile && selectedId) selectedDockRef.current?.scrollTo({ left: 0 });
  }, [isMobile, selectedId]);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const { width, height } = svg.getBoundingClientRect();
    if (!width || !height) return;
    const viewWidth = initial.type === "room" && width < 600 ? 720 : 1000;
    const viewHeight = viewWidth * height / width;
    updateView({ x: (DRAWING_WIDTH - viewWidth) / 2, y: (DRAWING_HEIGHT - viewHeight) / 2, width: viewWidth, height: viewHeight });
  }, [initial.type]);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const updateHandle = () => {
      const matrix = svg.getScreenCTM();
      const scale = matrix ? Math.hypot(matrix.a, matrix.b) : 1;
      setResizeHandleSize(Math.max(28, 44 / Math.max(scale, 0.01)));
    };
    updateHandle();
    const observer = new ResizeObserver(updateHandle);
    observer.observe(svg);
    return () => observer.disconnect();
  }, [view]);

  function persist(next: DrawingDocument) {
    try { saveDrawing(jobId, next); setSaveMessage("บันทึกแล้ว"); }
    catch { setSaveMessage("บันทึกไม่สำเร็จ ตรวจพื้นที่จัดเก็บและลองอีกครั้ง"); }
  }

  function commit(next: DrawingDocument) {
    if (!editable) return;
    const previous = drawingRef.current;
    setHistory((state) => ({ past: [...state.past.slice(-49), previous], future: [] }));
    drawingRef.current = next;
    setDrawing(next);
    persist(next);
  }

  function applyImportedElements(elements: DrawingElement[]): string | null {
    if (!editable || drawingRef.current.type !== "housePlan") return "สถานะนี้นำเข้ารูปวาดไม่ได้";
    const previous = drawingRef.current;
    const next = { ...previous, elements: [...previous.elements, ...elements] };
    try { saveDrawing(jobId, next); }
    catch (cause) { return cause instanceof Error ? cause.message : "บันทึกเส้นที่นำเข้าไม่สำเร็จ"; }
    setHistory((state) => ({ past: [...state.past.slice(-49), previous], future: [] }));
    drawingRef.current = next;
    setDrawing(next);
    setSaveMessage("บันทึกแล้ว");
    return null;
  }

  function updateSelected(update: (item: DrawingElement) => DrawingElement) {
    if (!selectedId || !editable) return;
    commit({ ...drawingRef.current, elements: drawingRef.current.elements.map((item) => item.id === selectedId ? update(item) : item) });
  }

  function finishTextEdit(save: boolean) {
    const edit = textEditRef.current;
    if (!edit) return;
    textEditRef.current = null;
    setEditingTextId(null);
    if (save && edit.draft !== edit.original && drawingRef.current.elements.some((item) => item.id === edit.id)) {
      commit({ ...drawingRef.current, elements: drawingRef.current.elements.map((item) => item.id === edit.id ? { ...item, text: edit.draft } : item) });
    }
  }

  function selectElement(id: string | null) {
    if (id !== selectedId) finishTextEdit(true);
    if (id) setActiveMaterial(null);
    setSelectedId(id);
  }

  function beginTextEdit() {
    if (!selected || !editable) return;
    textEditRef.current = { id: selected.id, original: selected.text, draft: selected.text };
    setTextDraft(selected.text);
    setEditingTextId(selected.id);
  }

  function chooseMaterial(materialId: DrawingMaterialId) {
    if (!editable) return;
    const material = drawingMaterials.find((entry) => entry.id === materialId);
    if (!material) return;
    if (material.mode === "draw") {
      finishTextEdit(true);
      setSelectedId(null);
      setActiveMaterial(materialId);
      setShowProperties(false);
      return;
    }
    const item = createDrawingMaterial(materialId, newId(), view.x + view.width * 0.42, view.y + view.height * 0.4, symbol);
    commit({ ...drawingRef.current, elements: [...drawingRef.current.elements, item] });
    selectElement(item.id);
    setShowProperties(false);
  }

  function removeSelected() {
    if (!selectedId || !editable) return;
    finishTextEdit(false);
    commit({ ...drawingRef.current, elements: drawingRef.current.elements.filter((item) => item.id !== selectedId) });
    setSelectedId(null);
  }

  function copySelected() {
    if (!selected || !editable) return;
    const copy = { ...selected, id: newId(), x: selected.x + 24, y: selected.y + 24 };
    commit({ ...drawingRef.current, elements: [...drawingRef.current.elements, copy] });
    selectElement(copy.id);
  }

  function undo() {
    if (!editable || history.past.length === 0) return;
    finishTextEdit(false);
    const previous = history.past[history.past.length - 1];
    setHistory({ past: history.past.slice(0, -1), future: [drawingRef.current, ...history.future] });
    drawingRef.current = previous;
    setDrawing(previous);
    setSelectedId(null);
    persist(previous);
  }

  function redo() {
    if (!editable || history.future.length === 0) return;
    finishTextEdit(false);
    const next = history.future[0];
    setHistory({ past: [...history.past, drawingRef.current], future: history.future.slice(1) });
    drawingRef.current = next;
    setDrawing(next);
    setSelectedId(null);
    persist(next);
  }

  function point(event: { clientX: number; clientY: number }): { x: number; y: number } {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const matrix = svg.getScreenCTM();
    if (!matrix) return { x: 0, y: 0 };
    const p = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
    return { x: p.x, y: p.y };
  }

  function rememberPointer(event: PointerEvent<SVGElement>) {
    if (event.pointerType === "touch") {
      event.preventDefault();
      setTouchControls(true);
    }
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    svgRef.current?.setPointerCapture(event.pointerId);
    if (pointersRef.current.size === 2) {
      if (gestureRef.current?.changed) persist(drawingRef.current);
      draftRef.current = null;
      setDraftElement(null);
      const [a, b] = [...pointersRef.current.values()];
      pinchRef.current = { distance: Math.hypot(a.x - b.x, a.y - b.y), centerX: (a.x + b.x) / 2, centerY: (a.y + b.y) / 2, view: viewRef.current };
      gestureRef.current = null;
    }
  }

  function beginElement(event: PointerEvent<SVGGElement>, id: string) {
    event.stopPropagation();
    if (activeMaterial && drawingMaterials.find((entry) => entry.id === activeMaterial)?.mode === "draw") {
      beginDraw(event);
      return;
    }
    if (pointersRef.current.size > 0) { rememberPointer(event); return; }
    const useTouchControls = touchControls || event.pointerType === "touch";
    const pickedId = useTouchControls ? pickDrawingElement(drawingRef.current.elements, point(event), resizeHandleSize / 2) ?? id : id;
    selectElement(pickedId);
    setShowProperties(false);
    rememberPointer(event);
    if (!editable || useTouchControls) return;
    const p = point(event);
    gestureRef.current = { mode: "move", id: pickedId, startX: p.x, startY: p.y, view: viewRef.current, drawing: drawingRef.current, changed: false };
  }

  function beginDraw(event: PointerEvent<SVGElement>) {
    if (!editable || !activeMaterial || pointersRef.current.size > 0) return;
    const material = drawingMaterials.find((entry) => entry.id === activeMaterial);
    if (!material || material.mode !== "draw") return;
    rememberPointer(event);
    const start = point(event);
    const item = createDrawingMaterial(activeMaterial, newId(), start.x, start.y, symbol);
    const draft = { ...item, width: 0, height: 0 };
    draftRef.current = draft;
    setDraftElement(draft);
    gestureRef.current = { mode: "draw", id: draft.id, startX: start.x, startY: start.y, view: viewRef.current, drawing: drawingRef.current, changed: false };
    setSaveMessage("ลากเพื่อวาด…");
  }

  function beginResize(event: PointerEvent<SVGRectElement>, id: string) {
    event.stopPropagation();
    if (pointersRef.current.size > 0) { rememberPointer(event); return; }
    setShowProperties(false);
    rememberPointer(event);
    if (!editable) return;
    const p = point(event);
    const item = drawingRef.current.elements.find((element) => element.id === id);
    gestureRef.current = { mode: "resize", id, handle: item && isLinearKind(item.kind) ? "end" : "se", startX: p.x, startY: p.y, view: viewRef.current, drawing: drawingRef.current, changed: false };
  }

  function beginVertex(event: PointerEvent<SVGCircleElement>, id: string, vertexIndex: number) {
    event.stopPropagation();
    if (pointersRef.current.size > 0) { rememberPointer(event); return; }
    selectElement(id);
    rememberPointer(event);
    if (!editable) return;
    const p = point(event);
    gestureRef.current = { mode: "vertex", id, vertexIndex, startX: p.x, startY: p.y, view: viewRef.current, drawing: drawingRef.current, changed: false };
  }

  function beginControl(event: PointerEvent<SVGRectElement>, id: string, handle: ControlHandle) {
    event.stopPropagation();
    if (pointersRef.current.size > 0) { rememberPointer(event); return; }
    selectElement(id);
    rememberPointer(event);
    if (!editable) return;
    const p = point(event);
    gestureRef.current = { mode: handle === "move" ? "move" : "resize", handle: handle === "move" ? undefined : handle, id, startX: p.x, startY: p.y, view: viewRef.current, drawing: drawingRef.current, changed: false };
  }

  function beginBackground(event: PointerEvent<SVGSVGElement>) {
    if (event.target !== event.currentTarget && (event.target as Element).tagName.toLowerCase() !== "rect") return;
    if (pointersRef.current.size > 0) { rememberPointer(event); return; }
    if (activeMaterial && drawingMaterials.find((entry) => entry.id === activeMaterial)?.mode === "draw") {
      beginDraw(event);
      return;
    }
    rememberPointer(event);
    gestureRef.current = { mode: "pan", startX: event.clientX, startY: event.clientY, view: viewRef.current, drawing: drawingRef.current, changed: false };
  }

  function movePointer(event: PointerEvent<SVGSVGElement>) {
    if (!pointersRef.current.has(event.pointerId)) return;
    if (event.pointerType === "touch") event.preventDefault();
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const pointers = [...pointersRef.current.values()];
    if (pointers.length === 2 && pinchRef.current && svgRef.current) {
      const [a, b] = pointers;
      const ratio = Math.hypot(a.x - b.x, a.y - b.y) / Math.max(1, pinchRef.current.distance);
      const width = clamp(pinchRef.current.view.width / ratio, 220, 1800);
      const height = width * svgRef.current.clientHeight / svgRef.current.clientWidth;
      const offsetX = ((a.x + b.x) / 2 - svgRef.current.getBoundingClientRect().left) / svgRef.current.clientWidth;
      const offsetY = ((a.y + b.y) / 2 - svgRef.current.getBoundingClientRect().top) / svgRef.current.clientHeight;
      updateView({ x: pinchRef.current.view.x + (pinchRef.current.view.width - width) * offsetX + (pinchRef.current.centerX - (a.x + b.x) / 2) * width / svgRef.current.clientWidth, y: pinchRef.current.view.y + (pinchRef.current.view.height - height) * offsetY + (pinchRef.current.centerY - (a.y + b.y) / 2) * height / svgRef.current.clientHeight, width, height });
      return;
    }
    const gesture = gestureRef.current;
    if (!gesture) return;
    if (gesture.mode === "draw") {
      const start = { x: gesture.startX, y: gesture.startY };
      const endpoint = snapDrawingPoint(start, point(event), freeAngle || event.altKey);
      const draft = draftRef.current;
      if (!draft) return;
      const next = { ...draft, width: endpoint.x - start.x, height: endpoint.y - start.y };
      gesture.changed = Math.hypot(next.width, next.height) >= 1;
      draftRef.current = next;
      setDraftElement(next);
      return;
    }
    if (gesture.mode === "pan" && svgRef.current) {
      if (Math.abs(event.clientX - gesture.startX) + Math.abs(event.clientY - gesture.startY) < 6) return;
      gesture.changed = true;
      const dx = (event.clientX - gesture.startX) * gesture.view.width / svgRef.current.clientWidth;
      const dy = (event.clientY - gesture.startY) * gesture.view.height / svgRef.current.clientHeight;
      updateView({ ...gesture.view, x: gesture.view.x - dx, y: gesture.view.y - dy });
      return;
    }
    if (!editable) return;
    const p = point(event);
    const dx = p.x - gesture.startX;
    const dy = p.y - gesture.startY;
    if (Math.abs(dx) + Math.abs(dy) < 1) return;
    if (!gesture.changed) {
      gesture.changed = true;
      setSaveMessage("กำลังแก้ไข…");
      setHistory((state) => ({ past: [...state.past.slice(-49), gesture.drawing], future: [] }));
    }
    const next = { ...gesture.drawing, elements: gesture.drawing.elements.map((item) => {
      if (item.id !== gesture.id) return item;
      return gesture.mode === "move" ? { ...item, x: item.x + dx, y: item.y + dy } : gesture.mode === "vertex" ? movePolygonVertex(item, gesture.vertexIndex ?? -1, { x: dx, y: dy }) : resizeDrawingElement(item, gesture.handle ?? "se", { x: dx, y: dy });
    }) };
    drawingRef.current = next;
    setDrawing(next);
  }

  function endPointer(event: PointerEvent<SVGSVGElement>) {
    if (!pointersRef.current.has(event.pointerId)) return;
    const gesture = gestureRef.current;
    if (gesture?.mode === "draw") {
      const draft = draftRef.current;
      if (event.type === "pointerup" && draft && Math.hypot(draft.width, draft.height) >= 12) {
        commit({ ...drawingRef.current, elements: [...drawingRef.current.elements, draft] });
      } else {
        setSaveMessage("ยกเลิกเส้นสั้นเกินไป");
      }
      draftRef.current = null;
      setDraftElement(null);
    }
    if (gesture?.changed && gesture.mode !== "pan" && gesture.mode !== "draw") persist(drawingRef.current);
    const wasPinching = pinchRef.current !== null;
    if (event.type === "pointerup" && gesture?.mode === "pan" && !gesture.changed && !wasPinching) selectElement(null);
    pointersRef.current.delete(event.pointerId);
    if (pointersRef.current.size < 2) pinchRef.current = null;
    gestureRef.current = null;
    if (svgRef.current?.hasPointerCapture(event.pointerId)) svgRef.current.releasePointerCapture(event.pointerId);
    if (wasPinching && pointersRef.current.size === 1) {
      const remaining = [...pointersRef.current.values()][0];
      gestureRef.current = { mode: "pan", startX: remaining.x, startY: remaining.y, view: viewRef.current, drawing: drawingRef.current, changed: false };
    }
  }

  function zoom(factor: number) {
    const current = viewRef.current;
    const width = clamp(current.width * factor, 220, 1800);
    const svg = svgRef.current;
    const height = svg ? width * svg.clientHeight / svg.clientWidth : width * DRAWING_HEIGHT / DRAWING_WIDTH;
    updateView({ x: current.x + (current.width - width) / 2, y: current.y + (current.height - height) / 2, width, height });
  }

  function keyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement || event.target instanceof HTMLSelectElement) return;
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") { event.preventDefault(); if (event.shiftKey) redo(); else undo(); return; }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "y") { event.preventDefault(); redo(); return; }
    if (event.key === "Escape" && activeMaterial) { event.preventDefault(); setActiveMaterial(null); draftRef.current = null; setDraftElement(null); setSaveMessage("ออกจากโหมดวาดแล้ว"); return; }
    if (!selected || !editable) return;
    if (event.key === "Delete" || event.key === "Backspace") { event.preventDefault(); removeSelected(); return; }
    const directions: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
    const delta = directions[event.key];
    if (delta) { event.preventDefault(); const step = event.shiftKey ? 10 : 1; updateSelected((item) => ({ ...item, x: item.x + delta[0] * step, y: item.y + delta[1] * step })); }
  }

  function saveNow() {
    persist(drawingRef.current);
  }

  function svgBlob(): Blob | null {
    if (!svgRef.current) return null;
    const copy = svgRef.current.cloneNode(true) as SVGSVGElement;
    copy.querySelectorAll("[data-editor-overlay]").forEach((item) => item.remove());
    copy.setAttribute("viewBox", `0 0 ${DRAWING_WIDTH} ${DRAWING_HEIGHT}`);
    copy.setAttribute("width", String(DRAWING_WIDTH));
    copy.setAttribute("height", String(DRAWING_HEIGHT));
    return new Blob([new XMLSerializer().serializeToString(copy)], { type: "image/svg+xml;charset=utf-8" });
  }

  function download(blob: Blob, extension: string) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${drawing.title.replace(/[/\\<>:"|?*]/g, "-") || "diagram"}.${extension}`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function exportFile(format: "svg" | "png") {
    const source = svgBlob();
    if (!source) return;
    if (format === "svg") { download(source, "svg"); return; }
    try {
      await document.fonts.ready;
      const url = URL.createObjectURL(source);
      const image = new Image();
      image.src = url;
      await image.decode();
      const canvas = document.createElement("canvas");
      canvas.width = DRAWING_WIDTH * 2;
      canvas.height = DRAWING_HEIGHT * 2;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Canvas unavailable");
      context.scale(2, 2);
      context.drawImage(image, 0, 0);
      URL.revokeObjectURL(url);
      const png = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
      if (!png) throw new Error("PNG unavailable");
      download(png, "png");
    } catch { setSaveMessage("ส่งออก PNG ไม่สำเร็จ กรุณาลอง SVG"); }
  }

  return (
    <div className="drawing-editor" onKeyDown={keyDown} tabIndex={-1}>
      <header className="drawing-editor-header">
        <Link aria-label="กลับไปรายการแบบ" className="drawing-icon-button" href={`/jobs/${jobId}/drawings`}><ArrowLeft size={20} /></Link>
        <div className="min-w-0 grow"><p className="text-xs font-semibold text-accent">แบบแปลง · ไม่มีสเกล · ระยะกรอกเอง</p><h1 className="truncate text-base font-bold sm:text-xl">{drawing.title}</h1></div>
        <span aria-live="polite" className="hidden text-xs text-muted sm:block">{saveMessage}</span>
        <button aria-controls="drawing-properties" aria-expanded={showProperties} aria-label={showProperties ? "ปิดชื่อแบบและรายการวัตถุ" : "เปิดชื่อแบบและรายการวัตถุ"} className="drawing-properties-trigger md:hidden" onClick={() => setShowProperties((open) => !open)} ref={propertiesButtonRef} type="button"><SlidersHorizontal size={18} /><span>รายการ</span></button>
        {editable ? <Button aria-label="บันทึกแบบ" onClick={saveNow} size="sm" variant="primary"><Save size={16} /><span className="hidden sm:inline">บันทึก</span></Button> : null}
      </header>
      {!canView(level) ? <AccessBanner level="none" ownerLabel={ownerTeamLabel("drawings")} /> : !editable ? <AccessBanner level="read" ownerLabel={ownerTeamLabel("drawings")} /> : null}
      <div aria-label="เครื่องมือแก้ไขแบบ" className="drawing-command-bar">
        <Button disabled={!editable || history.past.length === 0} onClick={undo} size="sm"><Undo2 size={16} />ย้อนกลับ</Button>
        <Button disabled={!editable || history.future.length === 0} onClick={redo} size="sm"><Redo2 size={16} />ทำซ้ำ</Button>
        <Button onClick={() => zoom(0.8)} size="sm"><ZoomIn size={16} />ซูมเข้า</Button>
        <Button onClick={() => zoom(1.25)} size="sm"><ZoomOut size={16} />ซูมออก</Button>
        <Button onClick={() => updateView(initialView)} size="sm">พอดีจอ</Button>
        {editable && drawing.type === "housePlan" ? <Button onClick={() => setShowImageImport(true)} size="sm"><ImagePlus size={16} />นำเข้ารูปวาด</Button> : null}
        <Button onClick={() => exportFile("png")} size="sm"><Download size={16} />PNG</Button>
        <Button onClick={() => exportFile("svg")} size="sm"><Download size={16} />SVG</Button>
      </div>
      <div className="drawing-editor-body">
        <div className="drawing-canvas-shell">
          <DrawingArtwork className="drawing-canvas" drawing={drawing} previewElement={draftElement} onBackgroundPointerDown={beginBackground} onControlPointerDown={editable ? beginControl : undefined} onElementPointerDown={editable ? beginElement : undefined} onLostPointerCapture={endPointer} onPointerCancel={endPointer} onPointerMove={movePointer} onPointerUp={endPointer} onResizePointerDown={editable ? beginResize : undefined} onVertexPointerDown={editable ? beginVertex : undefined} ref={svgRef} resizeHandleSize={resizeHandleSize} selectedId={selectedId} touchControls={touchControls} viewBox={`${view.x} ${view.y} ${view.width} ${view.height}`} />
          <p className="drawing-canvas-hint">{activeMaterialDefinition?.mode === "draw" ? `ลากบนแปลนเพื่อวาด${activeMaterialDefinition.label} · ${freeAngle ? "มุมอิสระ" : "ล็อกมุมทุก 45°"}${!touchControls ? " · กด Alt เพื่อวาดอิสระชั่วคราว" : ""}` : touchControls ? selected ? "จับไอคอนกลางเพื่อย้าย · จับมุมหรือขอบเพื่อยืดหด" : "แตะวัตถุเพื่อเลือก · ลากพื้นหลังเพื่อเลื่อน · ใช้สองนิ้วซูม" : "คลิกเพื่อเลือก · ลากเพื่อย้าย · ลากพื้นหลังเพื่อเลื่อน"}</p>
        </div>
        <MobilePropertySheet isMobile={isMobile} onClose={() => setShowProperties(false)} open={showProperties}>
        <aside aria-label={isMobile ? showProperties ? "ชื่อแบบและรายการวัตถุ" : selected ? `แก้ไข${drawingKindLabels[selected.kind]}` : "ชื่อแบบและรายการวัตถุ" : undefined} aria-modal={isMobile && showProperties ? true : undefined} aria-orientation={isMobile && selected && !showProperties ? "horizontal" : undefined} className={`drawing-properties ${showProperties ? "drawing-properties-open" : ""} ${isMobile && selected && !showProperties ? "drawing-properties-contextual" : ""}`} id="drawing-properties" ref={selectedDockRef} role={isMobile && showProperties ? "dialog" : isMobile && selected ? "toolbar" : undefined}>
          <div className="drawing-properties-heading flex items-center justify-between gap-2"><h2 className="font-bold">{isMobile && selected && !showProperties ? `แก้ไข: ${selected.text || drawingKindLabels[selected.kind]}` : isMobile ? "ชื่อแบบและรายการวัตถุ" : "คุณสมบัติ"}</h2>{isMobile && selected && !showProperties ? <Button onClick={() => selectElement(null)} size="sm">ยกเลิกการเลือก</Button> : <button aria-label="ปิดแผงคุณสมบัติ" className="drawing-icon-button md:hidden" onClick={() => setShowProperties(false)} ref={propertiesCloseRef} type="button"><X size={19} /></button>}</div>
          {(!isMobile || showProperties) ? <>
          <Field htmlFor="drawing-title" label="ชื่อแบบ"><Input disabled={!editable} id="drawing-title" maxLength={100} onChange={(event) => commit({ ...drawingRef.current, title: event.target.value })} value={drawing.title} /></Field>
          <div className="grid gap-1 border-t border-line pt-3">
            <h3 className="text-sm font-bold">วัตถุในแบบ</h3>
            <div className="grid max-h-32 gap-1 overflow-y-auto">
              {drawing.elements.map((item, index) => <button aria-pressed={selectedId === item.id} className={`min-h-11 rounded-control px-2 text-left text-xs ${selectedId === item.id ? "bg-accent-soft text-accent-ink" : "hover:bg-surface-2"}`} key={item.id} onClick={() => { selectElement(item.id); if (isMobile) setShowProperties(false); }} type="button">{index + 1}. {item.text || drawingKindLabels[item.kind]}</button>)}
            </div>
          </div>
          </> : null}
          {selected && (!isMobile || !showProperties) ? <>
            <p className="text-xs text-muted">วัตถุที่เลือก: {drawingKindLabels[selected.kind]}</p>
            {isMobile && editable ? <div className="grid grid-cols-2 gap-2"><Button onClick={copySelected} size="sm"><Copy size={16} />คัดลอก</Button><Button onClick={removeSelected} size="sm" variant="danger"><Trash2 size={16} />ลบวัตถุ</Button></div> : null}
            {(selected.kind === "text" || selected.kind === "symbol" || selected.kind === "dimension" || selected.text) ? isMobile ? editingTextId === selected.id ? <div className="grid gap-2"><Field htmlFor="drawing-text-draft" label="แก้ข้อความ"><Input id="drawing-text-draft" maxLength={120} onChange={(event) => { if (textEditRef.current) textEditRef.current.draft = event.target.value; setTextDraft(event.target.value); }} onKeyDown={(event) => { if (event.key === "Enter") finishTextEdit(true); if (event.key === "Escape") finishTextEdit(false); }} value={textDraft} /></Field><div className="grid grid-cols-2 gap-2"><Button onClick={() => finishTextEdit(true)} size="sm" variant="primary">เสร็จสิ้น</Button><Button onClick={() => finishTextEdit(false)} size="sm">ยกเลิก</Button></div></div> : <Button disabled={!editable} onClick={beginTextEdit} size="sm"><Type size={16} />แก้ข้อความ</Button> : <Field htmlFor="drawing-text" label="ข้อความบนวัตถุ"><Input disabled={!editable} id="drawing-text" maxLength={120} onChange={(event) => updateSelected((item) => ({ ...item, text: event.target.value }))} value={selected.text} /></Field> : null}
            <div className="grid grid-cols-2 gap-2">
              {(["x", "y", "width", "height"] as const).map((key) => <Field htmlFor={`drawing-${key}`} key={key} label={{ x: "ตำแหน่ง X", y: "ตำแหน่ง Y", width: "กว้าง", height: "สูง" }[key]}><Input disabled={!editable} id={`drawing-${key}`} onChange={(event) => updateSelected((item) => ({ ...item, [key]: Number(event.target.value) || 0 }))} type="number" value={Math.round(selected[key])} /></Field>)}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Field htmlFor="drawing-fill" label="สีพื้น"><Input disabled={!editable} id="drawing-fill" onChange={(event) => updateSelected((item) => ({ ...item, fill: event.target.value }))} type="color" value={selected.fill} /></Field>
              <Field htmlFor="drawing-stroke" label="สีขอบ"><Input disabled={!editable} id="drawing-stroke" onChange={(event) => updateSelected((item) => ({ ...item, stroke: event.target.value }))} type="color" value={selected.stroke} /></Field>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Field htmlFor="drawing-stroke-width" label="น้ำหนักเส้น"><Input disabled={!editable} id="drawing-stroke-width" max={24} min={1} onChange={(event) => updateSelected((item) => ({ ...item, strokeWidth: Number(event.target.value) || 1 }))} type="number" value={selected.strokeWidth} /></Field>
              <Field htmlFor="drawing-font-size" label="ขนาดตัวอักษร"><Input disabled={!editable} id="drawing-font-size" max={64} min={12} onChange={(event) => updateSelected((item) => ({ ...item, fontSize: Number(event.target.value) || 12 }))} type="number" value={selected.fontSize} /></Field>
            </div>
            {(["rect", "polygon"] as const).includes(selected.kind as "rect" | "polygon") ? <label className="flex min-h-11 items-center gap-2 text-sm"><input checked={selected.hatch === true} disabled={!editable} onChange={(event) => updateSelected((item) => ({ ...item, hatch: event.target.checked }))} type="checkbox" />แรเงาพื้นที่</label> : null}
            {(["line", "wall", "rect", "polygon"] as const).includes(selected.kind as "line" | "wall" | "rect" | "polygon") ? <label className="flex min-h-11 items-center gap-2 text-sm"><input checked={selected.dashed === true} disabled={!editable} onChange={(event) => updateSelected((item) => ({ ...item, dashed: event.target.checked }))} type="checkbox" />เส้นประ</label> : null}
            {selected.kind === "door" ? <Field htmlFor="drawing-swing" label="ทิศเปิดประตู"><Select disabled={!editable} id="drawing-swing" onChange={(event) => updateSelected((item) => ({ ...item, swing: event.target.value as "left" | "right" }))} value={selected.swing ?? "left"}><option value="left">บานพับซ้าย</option><option value="right">บานพับขวา</option></Select></Field> : null}
            {selected.kind === "door" ? <Field htmlFor="drawing-door-style" label="รูปแบบประตู"><Select disabled={!editable} id="drawing-door-style" onChange={(event) => updateSelected((item) => ({ ...item, doorStyle: event.target.value as "single" | "double" }))} value={selected.doorStyle ?? "single"}><option value="single">บานเดี่ยว</option><option value="double">บานคู่</option></Select></Field> : null}
            {selected.kind === "stairs" ? <Field htmlFor="drawing-stairs-style" label="รูปแบบบันได"><Select disabled={!editable} id="drawing-stairs-style" onChange={(event) => updateSelected((item) => ({ ...item, stairsStyle: event.target.value as "straight" | "l" | "u" }))} value={selected.stairsStyle ?? "straight"}><option value="straight">ทางตรง</option><option value="l">รูปตัว L</option><option value="u">รูปตัว U</option></Select></Field> : null}
            {selected.kind === "polygon" && selected.points ? <div className="grid gap-2 border-t border-line pt-3"><p className="text-xs font-semibold">จุดรูปทรง · ลากจุดบนแปลน หรือกรอกพิกัดสัมพัทธ์ 0–100</p>{selected.points.map((vertex, index) => <div className="grid grid-cols-[1fr_1fr_auto] gap-2" key={index}><Input aria-label={`จุด ${index + 1} X`} disabled={!editable} max={100} min={0} onChange={(event) => updateSelected((item) => ({ ...item, points: item.points?.map((point, position) => position === index ? { ...point, x: clamp(Number(event.target.value) / 100, 0, 1) } : point) }))} type="number" value={Math.round(vertex.x * 100)} /><Input aria-label={`จุด ${index + 1} Y`} disabled={!editable} max={100} min={0} onChange={(event) => updateSelected((item) => ({ ...item, points: item.points?.map((point, position) => position === index ? { ...point, y: clamp(Number(event.target.value) / 100, 0, 1) } : point) }))} type="number" value={Math.round(vertex.y * 100)} /><Button aria-label={`ลบจุดที่ ${index + 1}`} disabled={!editable || selected.points!.length <= 3} onClick={() => updateSelected((item) => ({ ...item, points: item.points?.filter((_, position) => position !== index) }))} size="sm"><Trash2 size={16} /></Button></div>)}<Button disabled={!editable || selected.points.length >= 20} onClick={() => updateSelected((item) => ({ ...item, points: [...(item.points ?? []), { x: 0.5, y: 0.5 }] }))} size="sm">เพิ่มจุด</Button></div> : null}
            {editable ? <>
              <div className="grid grid-cols-4 gap-2" role="group" aria-label="ขยับวัตถุ">
                {([[ArrowLeft, -10, 0, "ซ้าย"], [ArrowUp, 0, -10, "ขึ้น"], [ArrowDown, 0, 10, "ลง"], [ArrowRight, 10, 0, "ขวา"]] as const).map(([Icon, dx, dy, label]) => <button aria-label={`ขยับ${label}`} className="drawing-icon-button" key={label} onClick={() => updateSelected((item) => ({ ...item, x: item.x + dx, y: item.y + dy }))} type="button"><Icon size={18} /></button>)}
              </div>
              <div className="grid grid-cols-2 gap-2"><Button onClick={() => updateSelected((item) => ({ ...item, rotation: item.rotation - 15 }))} size="sm"><RotateCcw size={16} />ซ้าย 15°</Button><Button onClick={() => updateSelected((item) => ({ ...item, rotation: item.rotation + 15 }))} size="sm"><RotateCw size={16} />ขวา 15°</Button><Button onClick={() => updateSelected((item) => ({ ...item, rotation: item.rotation - 45 }))} size="sm"><RotateCcw size={16} />ซ้าย 45°</Button><Button onClick={() => updateSelected((item) => ({ ...item, rotation: item.rotation + 45 }))} size="sm"><RotateCw size={16} />ขวา 45°</Button></div>
              <div className="grid grid-cols-2 gap-2"><Button onClick={() => commit({ ...drawingRef.current, elements: moveElement(drawingRef.current.elements, selected.id, "up") })} size="sm">เลื่อนขึ้นชั้น</Button><Button onClick={() => commit({ ...drawingRef.current, elements: moveElement(drawingRef.current.elements, selected.id, "down") })} size="sm">เลื่อนลงชั้น</Button></div>
              {!isMobile ? <div className="grid grid-cols-2 gap-2"><Button onClick={copySelected} size="sm"><Copy size={16} />คัดลอก</Button><Button onClick={removeSelected} size="sm" variant="ghost"><Trash2 size={16} />ลบ</Button></div> : null}
            </> : null}
          </> : !isMobile ? <p className="text-sm text-muted">เลือกวัตถุในแบบเพื่อแก้ไข หรือเพิ่มวัตถุจากแถบด้านล่าง</p> : null}
        </aside>
        </MobilePropertySheet>
      </div>
      {editable && (!isMobile || !selected) ? <nav aria-label="โหมดเพิ่มวัตถุในแบบ" className="drawing-tool-tray">
        <Select aria-label="หมวดวัสดุ" onChange={(event) => { setMaterialCategory(event.target.value as DrawingMaterialCategory); setActiveMaterial(null); }} value={materialCategory}>{drawingMaterialCategories.map((category) => <option key={category.id} value={category.id}>{category.label}</option>)}</Select>
        {materialCategory === "annotation" ? <Select aria-label="ชื่อป้ายห้อง" onChange={(event) => setSymbol(event.target.value)} value={symbol}>{drawingPalette[drawing.type].map((name) => <option key={name}>{name}</option>)}</Select> : null}
        {visibleMaterials.map((material) => <Button aria-pressed={activeMaterial === material.id} key={material.id} onClick={() => chooseMaterial(material.id)} size="sm" variant={activeMaterial === material.id ? "primary" : "secondary"}>{material.label}</Button>)}
        {activeMaterialDefinition?.mode === "draw" ? <><Button onClick={() => setFreeAngle((value) => !value)} size="sm" variant={freeAngle ? "primary" : "secondary"}>{freeAngle ? "มุมอิสระ" : "ล็อก 45°"}</Button><Button onClick={() => { setActiveMaterial(null); draftRef.current = null; setDraftElement(null); }} size="sm">เสร็จ / เลือก</Button></> : null}
      </nav> : null}
      <p aria-live="polite" className="p-2 text-center text-xs text-muted sm:hidden">{saveMessage}</p>
      {showImageImport ? <DrawingImageImport onApply={applyImportedElements} onClose={() => setShowImageImport(false)} remainingSlots={300 - drawing.elements.length} /> : null}
    </div>
  );
}

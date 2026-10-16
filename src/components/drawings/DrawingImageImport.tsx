"use client";

import { useEffect, useRef, useState, type ChangeEvent, type PointerEvent } from "react";
import Image from "next/image";
import { createImportCandidates, importedElements, type ImportCandidate, type RawSegment } from "@/domain/drawingImport";
import type { DrawingElement } from "@/domain/drawings";
import { Button, Input, Select } from "../ui";

type Crop = { x: number; y: number; width: number; height: number };
type Size = { width: number; height: number };
type WorkerReply = { id: number; segments?: RawSegment[]; error?: string };

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

function newId(): string { return globalThis.crypto?.randomUUID?.() ?? `import-${Date.now()}-${Math.random().toString(36).slice(2)}`; }
function fullCrop(size: Size): Crop { return { x: 0, y: 0, width: size.width, height: size.height }; }

export function DrawingImageImport({ remainingSlots, onApply, onClose }: { remainingSlots: number; onApply: (elements: DrawingElement[]) => string | null; onClose: () => void }) {
  const sourceCanvas = useRef<HTMLCanvasElement>(null);
  const bitmap = useRef<ImageBitmap | null>(null);
  const worker = useRef<Worker | null>(null);
  const dragStart = useRef<{ x: number; y: number } | null>(null);
  const requestId = useRef(0);
  const [fileName, setFileName] = useState("");
  const [size, setSize] = useState<Size | null>(null);
  const [rotation, setRotation] = useState<0 | 90 | 180 | 270>(0);
  const [crop, setCrop] = useState<Crop | null>(null);
  const [preview, setPreview] = useState("");
  const [previewSize, setPreviewSize] = useState<Size | null>(null);
  const [candidates, setCandidates] = useState<ImportCandidate[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => () => { bitmap.current?.close(); worker.current?.terminate(); }, []);

  function drawImage(image: ImageBitmap, angle: 0 | 90 | 180 | 270) {
    const canvas = sourceCanvas.current;
    if (!canvas) return;
    const scale = Math.min(1, 1800 / Math.max(image.width, image.height));
    const originalWidth = Math.max(1, Math.round(image.width * scale));
    const originalHeight = Math.max(1, Math.round(image.height * scale));
    const swapped = angle === 90 || angle === 270;
    const nextSize = { width: swapped ? originalHeight : originalWidth, height: swapped ? originalWidth : originalHeight };
    canvas.width = nextSize.width;
    canvas.height = nextSize.height;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) throw new Error("เบราว์เซอร์นี้เปิดพื้นที่วาดภาพไม่ได้");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    if (angle === 90) { context.translate(canvas.width, 0); context.rotate(Math.PI / 2); }
    if (angle === 180) { context.translate(canvas.width, canvas.height); context.rotate(Math.PI); }
    if (angle === 270) { context.translate(0, canvas.height); context.rotate(-Math.PI / 2); }
    context.drawImage(image, 0, 0, originalWidth, originalHeight);
    context.setTransform(1, 0, 0, 1, 0, 0);
    setSize(nextSize);
    setCrop(fullCrop(nextSize));
    setCandidates([]);
    setPreview("");
    setPreviewSize(null);
    setError("");
  }

  async function chooseFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!allowedTypes.has(file.type) || file.size > 20 * 1024 * 1024) { setError("รองรับ JPG, PNG หรือ WebP ขนาดไม่เกิน 20 MB"); return; }
    setError("");
    try {
      const nextBitmap = await createImageBitmap(file);
      if (nextBitmap.width * nextBitmap.height > 16_000_000) { nextBitmap.close(); setError("ภาพใหญ่เกิน 16 ล้านพิกเซล กรุณาลดขนาดก่อนนำเข้า"); return; }
      bitmap.current?.close();
      bitmap.current = nextBitmap;
      setFileName(file.name);
      setRotation(0);
      drawImage(nextBitmap, 0);
    } catch { setError("เปิดภาพไม่ได้ กรุณาเลือกไฟล์ภาพที่สมบูรณ์"); }
  }

  function rotate() {
    if (!bitmap.current || busy) return;
    const next = ((rotation + 90) % 360) as 0 | 90 | 180 | 270;
    setRotation(next);
    drawImage(bitmap.current, next);
  }

  function position(event: PointerEvent<HTMLCanvasElement>) {
    const canvas = sourceCanvas.current!;
    const rect = canvas.getBoundingClientRect();
    return { x: Math.max(0, Math.min(canvas.width, (event.clientX - rect.left) * canvas.width / rect.width)), y: Math.max(0, Math.min(canvas.height, (event.clientY - rect.top) * canvas.height / rect.height)) };
  }

  function startCrop(event: PointerEvent<HTMLCanvasElement>) {
    if (!size || busy) return;
    dragStart.current = position(event);
    event.currentTarget.setPointerCapture(event.pointerId);
    setCrop({ ...dragStart.current, width: 1, height: 1 });
  }

  function moveCrop(event: PointerEvent<HTMLCanvasElement>) {
    if (!dragStart.current) return;
    const current = position(event);
    setCrop({ x: Math.min(current.x, dragStart.current.x), y: Math.min(current.y, dragStart.current.y), width: Math.abs(current.x - dragStart.current.x), height: Math.abs(current.y - dragStart.current.y) });
  }

  function endCrop(event: PointerEvent<HTMLCanvasElement>) {
    if (!dragStart.current) return;
    const current = position(event);
    const next = { x: Math.min(current.x, dragStart.current.x), y: Math.min(current.y, dragStart.current.y), width: Math.abs(current.x - dragStart.current.x), height: Math.abs(current.y - dragStart.current.y) };
    if (next.width < 30 || next.height < 30) setCrop(size ? fullCrop(size) : null);
    else setCrop(next);
    dragStart.current = null;
    setCandidates([]);
    setPreview("");
    setPreviewSize(null);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }

  function analyze() {
    if (!sourceCanvas.current || !crop || busy) return;
    if (crop.width < 100 || crop.height < 100) { setError("กรุณาเลือกพื้นที่อย่างน้อย 100 × 100 พิกเซล"); return; }
    const width = Math.max(1, Math.round(Math.min(1600 / Math.max(crop.width, crop.height), 1) * crop.width));
    const height = Math.max(1, Math.round(width * crop.height / crop.width));
    const canvas = document.createElement("canvas");
    canvas.width = width; canvas.height = height;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) { setError("เบราว์เซอร์นี้ประมวลผลภาพไม่ได้"); return; }
    context.drawImage(sourceCanvas.current, crop.x, crop.y, crop.width, crop.height, 0, 0, width, height);
    const pixels = context.getImageData(0, 0, width, height).data;
    setPreview(canvas.toDataURL("image/jpeg", 0.88));
    setPreviewSize({ width, height });
    setBusy(true);
    setError("");
    worker.current?.terminate();
    const nextWorker = new Worker(new URL("./drawingImport.worker.ts", import.meta.url));
    worker.current = nextWorker;
    const id = ++requestId.current;
    nextWorker.onmessage = (event: MessageEvent<WorkerReply>) => {
      if (event.data.id !== id) return;
      nextWorker.terminate(); worker.current = null;
      setBusy(false);
      if (event.data.error) { setError(event.data.error); return; }
      const found = createImportCandidates(event.data.segments ?? [], width, height);
      setCandidates(found);
      if (!found.length) setError("ไม่พบแนวเส้นตรงที่ชัดเจน ลองครอปให้เหลือเฉพาะผังหรือใช้ภาพที่สว่างขึ้น");
    };
    nextWorker.onerror = () => { nextWorker.terminate(); worker.current = null; setBusy(false); setError("ตัวตรวจเส้นเริ่มทำงานไม่ได้ กรุณาลองใหม่"); };
    nextWorker.postMessage({ id, width, height, pixels: pixels.buffer }, [pixels.buffer]);
  }

  function confirm() {
    if (!previewSize) return;
    const chosen = candidates.filter((candidate) => candidate.included);
    if (!chosen.length) { setError("เลือกเส้นอย่างน้อยหนึ่งเส้นก่อนสร้างวัตถุ"); return; }
    if (chosen.length > remainingSlots) { setError(`เลือกได้อีกไม่เกิน ${remainingSlots} เส้นในแปลนนี้`); return; }
    const elements = importedElements(chosen, previewSize.width, previewSize.height, newId);
    const failure = onApply(elements);
    if (failure) setError(failure);
    else onClose();
  }

  const selectedCount = candidates.filter((candidate) => candidate.included).length;
  return <div aria-label="นำเข้ารูปวาดเป็นเส้นแปลน" aria-modal="true" className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 p-3 sm:p-6" role="dialog">
    <div className="mx-auto max-w-6xl rounded-xl bg-surface p-4 shadow-xl sm:p-6">
      <div className="flex items-start justify-between gap-4"><div><h2 className="text-xl font-bold">แปลงรูปวาดเป็นเส้นที่แก้ไขได้</h2><p className="mt-1 text-sm text-muted">ประมวลผลในเบราว์เซอร์เท่านั้น · ครอปทีละชั้น · ตรวจเส้นก่อนบันทึก · ไม่อ่านลายมือหรือระยะ</p></div><Button onClick={onClose} size="sm">ปิด</Button></div>
      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="min-w-0">
          <label className="grid gap-2 text-sm font-semibold">เลือกรูป JPG, PNG หรือ WebP (ไม่เกิน 20 MB)
            <Input accept="image/jpeg,image/png,image/webp" onChange={chooseFile} type="file" />
          </label>
          {fileName ? <p className="mt-2 break-all text-xs text-muted">{fileName}</p> : null}
          <div className="mt-3 flex flex-wrap gap-2"><Button disabled={!size || busy} onClick={rotate} size="sm">หมุน 90°</Button><Button disabled={!size || busy} onClick={() => { if (size) { setCrop(fullCrop(size)); setCandidates([]); setPreview(""); } }} size="sm">เลือกทั้งภาพ</Button><Button disabled={!size || busy} onClick={analyze} size="sm" variant="primary">{busy ? "กำลังตรวจเส้น…" : "ตรวจเส้นในพื้นที่ที่เลือก"}</Button></div>
          <p className="mt-2 text-xs text-muted">ลากกรอบบนภาพเพื่อเลือกเฉพาะผังหนึ่งชั้น ภาพที่มีสองชั้นให้นำเข้าอีกครั้งในแปลนอีกแผ่น</p>
          <div className="mt-3 overflow-hidden rounded-lg border border-line bg-white">
            <div className="relative inline-block max-w-full align-top"><canvas className="block h-auto max-w-full touch-none cursor-crosshair" onPointerCancel={endCrop} onPointerDown={startCrop} onPointerMove={moveCrop} onPointerUp={endCrop} ref={sourceCanvas} style={{ display: size ? "block" : "none" }} />{size && crop ? <div className="pointer-events-none absolute border-2 border-blue-600 bg-blue-500/10" style={{ left: `${crop.x / size.width * 100}%`, top: `${crop.y / size.height * 100}%`, width: `${crop.width / size.width * 100}%`, height: `${crop.height / size.height * 100}%` }} /> : null}</div>
            {!size ? <p className="p-12 text-center text-sm text-muted">เลือกรูปเพื่อเริ่มครอปผัง</p> : null}
          </div>
          {preview && previewSize ? <div className="mt-4"><h3 className="mb-2 font-bold">พรีวิวเส้นที่ตรวจพบ</h3><div className="relative inline-block max-w-full border border-line bg-white"><Image alt="ภาพครอปสำหรับตรวจผล" className="block h-auto max-w-full" height={previewSize.height} src={preview} unoptimized width={previewSize.width} /><svg aria-label="เส้นที่เสนอจากภาพ" className="pointer-events-none absolute inset-0 h-full w-full" viewBox={`0 0 ${previewSize.width} ${previewSize.height}`}>{candidates.map((candidate) => candidate.included ? <line key={candidate.id} stroke={candidate.kind === "wall" ? "#e11d48" : "#2563eb"} strokeWidth={Math.max(3, Math.min(previewSize.width, previewSize.height) * 0.006)} x1={candidate.x1} x2={candidate.x2} y1={candidate.y1} y2={candidate.y2} /> : null)}</svg></div></div> : null}
        </div>
        <aside className="min-w-0"><h3 className="font-bold">ตรวจผลก่อนสร้าง</h3><p className="mt-1 text-xs text-muted">สีแดง = ผนัง · สีฟ้า = เส้นทั่วไป; เส้นระยะหรือเส้นที่ตรวจเกินให้ปิดออก</p>
          {candidates.length ? <><p className="mt-3 text-sm">เลือก {selectedCount} / {candidates.length} เส้น · เหลือพื้นที่ {remainingSlots} วัตถุ</p><div className="mt-2 max-h-96 space-y-2 overflow-y-auto">{candidates.map((candidate, index) => <div className="grid grid-cols-[auto_1fr] items-center gap-2 rounded-md border border-line p-2" key={candidate.id}><label className="flex items-center gap-2 text-sm"><input checked={candidate.included} onChange={(event) => setCandidates((items) => items.map((item) => item.id === candidate.id ? { ...item, included: event.target.checked } : item))} type="checkbox" />{index + 1}</label><Select aria-label={`ชนิดเส้น ${index + 1}`} onChange={(event) => setCandidates((items) => items.map((item) => item.id === candidate.id ? { ...item, kind: event.target.value as "wall" | "line" } : item))} value={candidate.kind}><option value="wall">ผนัง</option><option value="line">เส้นทั่วไป</option></Select></div>)}</div></> : <p className="mt-3 text-sm text-muted">ยังไม่มีเส้นที่เสนอ</p>}
          {error ? <p className="mt-3 rounded-md bg-danger-soft p-3 text-sm text-danger" role="alert">{error}</p> : null}
          <div className="mt-4 flex flex-wrap gap-2"><Button disabled={!candidates.length || busy || !selectedCount} onClick={confirm} variant="primary">สร้างวัตถุ {selectedCount} เส้น</Button><Button onClick={onClose}>ยกเลิก</Button></div>
          <p className="mt-3 text-xs text-muted">หลังยืนยันจะเก็บเฉพาะวัตถุ ไม่เก็บรูปต้นฉบับไว้ในงานประเมิน</p>
        </aside>
      </div>
    </div>
  </div>;
}

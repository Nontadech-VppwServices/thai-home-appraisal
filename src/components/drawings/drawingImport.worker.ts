import type { CV } from "@techstark/opencv-js";
import type { RawSegment } from "@/domain/drawingImport";

type Request = { id: number; width: number; height: number; pixels: ArrayBuffer };
type Response = { id: number; segments?: RawSegment[]; error?: string };

let cvPromise: Promise<{ cv: CV }> | null = null;

function getCv(): Promise<{ cv: CV }> {
  if (!cvPromise) cvPromise = import("@techstark/opencv-js").then(async (module) => {
    const cv = module.default as CV;
    // The distributed module is a thenable, but awaiting it directly does not
    // reliably settle. Wait for its documented runtime callback instead.
    if (typeof cv.Mat !== "function") {
      await new Promise<void>((resolve) => { cv.onRuntimeInitialized = resolve; });
    }
    return { cv };
  });
  return cvPromise;
}

self.onmessage = async (event: MessageEvent<Request>) => {
  const { id, width, height, pixels } = event.data;
  const reply = (message: Response) => self.postMessage(message);
  if (width < 100 || height < 100 || width * height > 4_000_000 || pixels.byteLength !== width * height * 4) {
    reply({ id, error: "พื้นที่ครอปไม่ถูกต้องหรือใหญ่เกินไป" });
    return;
  }
  let source: InstanceType<CV["Mat"]> | null = null;
  let gray: InstanceType<CV["Mat"]> | null = null;
  let blurred: InstanceType<CV["Mat"]> | null = null;
  let binary: InstanceType<CV["Mat"]> | null = null;
  let lines: InstanceType<CV["Mat"]> | null = null;
  try {
    const { cv } = await getCv();
    source = cv.matFromImageData(new ImageData(new Uint8ClampedArray(pixels), width, height));
    gray = new cv.Mat(); blurred = new cv.Mat(); binary = new cv.Mat(); lines = new cv.Mat();
    cv.cvtColor(source, gray, cv.COLOR_RGBA2GRAY);
    cv.GaussianBlur(gray, blurred, new cv.Size(3, 3), 0);
    cv.adaptiveThreshold(blurred, binary, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY_INV, 31, 12);
    const shortSide = Math.min(width, height);
    cv.HoughLinesP(binary, lines, 1, Math.PI / 180, 34, Math.max(28, shortSide * 0.055), Math.max(8, shortSide * 0.022));
    const raw = lines.data32S;
    const segments: RawSegment[] = [];
    for (let index = 0; index + 3 < raw.length && segments.length < 1200; index += 4) {
      segments.push({ x1: raw[index], y1: raw[index + 1], x2: raw[index + 2], y2: raw[index + 3] });
    }
    reply({ id, segments });
  } catch {
    reply({ id, error: "อ่านเส้นจากภาพไม่สำเร็จ กรุณาครอปให้ชัดขึ้นหรือลองภาพอื่น" });
  } finally {
    source?.delete(); gray?.delete(); blurred?.delete(); binary?.delete(); lines?.delete();
  }
};

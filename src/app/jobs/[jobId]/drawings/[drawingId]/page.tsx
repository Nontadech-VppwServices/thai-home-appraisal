import { DrawingEditorPage } from "@/components/drawings/DrawingEditorPage";

export default async function Page({ params }: { params: Promise<{ jobId: string; drawingId: string }> }) {
  const { jobId, drawingId } = await params;
  return <DrawingEditorPage jobId={jobId} drawingId={drawingId} />;
}

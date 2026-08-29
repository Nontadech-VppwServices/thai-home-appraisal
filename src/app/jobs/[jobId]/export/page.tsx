import { ExportPage } from "@/components/ExportPage";

export default async function Page({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  return <ExportPage jobId={jobId} />;
}

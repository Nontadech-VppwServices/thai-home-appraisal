import { ReportPage } from "@/components/ReportPage";

export default async function Page({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  return <ReportPage jobId={jobId} />;
}

import { HandoffPage } from "@/components/HandoffPage";

export default async function Page({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  return <HandoffPage jobId={jobId} />;
}

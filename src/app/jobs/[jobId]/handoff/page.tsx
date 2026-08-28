import { FuturePage } from "@/components/FuturePage";

export default async function Page({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  return <FuturePage jobId={jobId} route="handoff" />;
}

import { IntakePage } from "@/components/IntakePage";

export default async function Page({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  return <IntakePage jobId={jobId} />;
}

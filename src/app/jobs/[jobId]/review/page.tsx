import { ReviewPage } from "@/components/ReviewPage";

export default async function Page({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  return <ReviewPage jobId={jobId} />;
}

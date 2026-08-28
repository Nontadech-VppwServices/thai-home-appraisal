import { AppraisalWorkspace } from "@/components/AppraisalWorkspace";

export default async function Page({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  return <AppraisalWorkspace jobId={jobId} section="property" />;
}

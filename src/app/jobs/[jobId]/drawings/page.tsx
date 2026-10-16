import { DrawingsPage } from "@/components/drawings/DrawingsPage";

export default async function Page({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  return <DrawingsPage jobId={jobId} />;
}

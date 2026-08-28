import { ReferencesPage } from "@/components/ReferencesPage";

export default async function Page({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  return <ReferencesPage jobId={jobId} />;
}

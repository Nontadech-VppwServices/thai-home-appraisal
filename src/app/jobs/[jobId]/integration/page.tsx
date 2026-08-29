import { IntegrationPage } from "@/components/IntegrationPage";

export default async function Page({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  return <IntegrationPage jobId={jobId} />;
}

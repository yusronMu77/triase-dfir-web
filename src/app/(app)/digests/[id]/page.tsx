import { DigestDetailView } from "../../../../features/digest/digest-detail.view";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DigestDetailView id={id} />;
}

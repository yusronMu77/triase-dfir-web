import { CardDetailView } from "../../../../features/card/card-detail.view";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CardDetailView id={id} />;
}

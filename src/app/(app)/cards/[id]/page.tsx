import { notFound } from "next/navigation";
import { queueItems } from "../../../../data/fixtures";
import { CardDetailView } from "../../../../features/card/card-detail.view";

// This preview has a finite fixture set. Reject unknown IDs before streaming a page.
export const dynamicParams = false;
export function generateStaticParams() {
  return queueItems.map((item) => ({ id: item.id }));
}
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = queueItems.find((row) => row.id === id);
  if (!item) notFound();
  return <CardDetailView item={item} />;
}

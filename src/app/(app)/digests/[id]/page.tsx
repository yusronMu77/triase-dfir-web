import { notFound } from "next/navigation";
import { digests, findDigest } from "../../../../data/digests";
import { queueItems } from "../../../../data/fixtures";
import { DigestDetailView } from "../../../../features/digest/digest-detail.view";

export const dynamicParams = false;
export function generateStaticParams() {
  return digests.map((digest) => ({ id: digest.id }));
}
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const digest = findDigest(id);
  if (!digest) notFound();
  const items = queueItems.filter((item) => digest.cardIds.includes(item.id));
  return <DigestDetailView digest={digest} items={items} />;
}

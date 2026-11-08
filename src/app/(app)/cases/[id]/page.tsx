import { notFound } from "next/navigation";
import { cases, findCase } from "../../../../data/cases";
import { events, evidence } from "../../../../data/fixtures";
import { CaseDetailView } from "../../../../features/case/case-detail.view";

export const dynamicParams = false;
export function generateStaticParams() {
  return cases.map((row) => ({ id: row.id }));
}
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const row = findCase(id);
  if (!row) notFound();
  return <CaseDetailView row={row} events={events} evidence={evidence} />;
}

import { InlineLoading, SkeletonCard } from "@astria/ui";

export default function Loading() {
  return (
    <div className="a-stack">
      <InlineLoading>Memuat halaman…</InlineLoading>
      <SkeletonCard />
    </div>
  );
}

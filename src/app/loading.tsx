import { InlineLoading, SkeletonCard } from "@astria/ui";
export default function Loading() {
  return (
    <main className="a-main">
      <InlineLoading>Memuat halaman…</InlineLoading>
      <div className="showcase-grid">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </main>
  );
}

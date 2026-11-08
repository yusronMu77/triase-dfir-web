import { EmptyState, Icon } from "@astria/ui";
export default function NotFound() {
  return (
    <main className="a-main">
      <h1 className="a-sr-only">Halaman tidak ditemukan</h1>
      <EmptyState
        title="404 · Halaman tidak ditemukan"
        description="Periksa alamat atau kembali ke pustaka komponen."
        icon={<Icon name="file-search" size={32} />}
        action={<a href="/components">Kembali ke pustaka</a>}
      />
    </main>
  );
}

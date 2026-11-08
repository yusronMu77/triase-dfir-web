import { EmptyState, Icon } from "@astria/ui";
import Link from "next/link";

export default function NotFound() {
  return (
    <EmptyState
      title="404 · Halaman tidak ditemukan"
      description="ID kartu ini tidak ada."
      icon={<Icon name="file-search" size={32} />}
      action={<Link href="/cards">Kembali ke daftar kartu</Link>}
    />
  );
}

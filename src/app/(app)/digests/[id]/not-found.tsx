import { EmptyState, Icon } from "@astria/ui";
import Link from "next/link";

export default function NotFound() {
  return (
    <EmptyState
      title="404 · Halaman tidak ditemukan"
      description="ID digest ini tidak ada."
      icon={<Icon name="file-search" size={32} />}
      action={<Link href="/digests">Kembali ke daftar digest</Link>}
    />
  );
}

import { EmptyState, Icon } from "@astria/ui";
import Link from "next/link";

export default function NotFound() {
  return (
    <EmptyState
      title="404 · Halaman tidak ditemukan"
      description="Periksa alamat atau kembali ke beranda."
      icon={<Icon name="file-search" size={32} />}
      action={<Link href="/">Kembali ke beranda</Link>}
    />
  );
}

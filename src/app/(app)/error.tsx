"use client";
import { Alert, Button } from "@astria/ui";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <Alert
      tone="danger"
      title="Halaman gagal dimuat"
      action={
        <Button variant="secondary" onClick={reset}>
          Coba lagi
        </Button>
      }
    >
      Layanan tidak tersedia. Coba muat ulang halaman.
    </Alert>
  );
}

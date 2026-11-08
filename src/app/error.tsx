"use client";
import { Alert, Button } from "@astria/ui";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="a-main">
      <h1>Layanan tidak tersedia</h1>
      <Alert
        tone="danger"
        title="Halaman gagal dimuat"
        action={
          <Button variant="secondary" onClick={reset}>
            Coba lagi
          </Button>
        }
      >
        Coba muat ulang halaman.
      </Alert>
    </main>
  );
}

"use client";
import { Alert, AstriaWelcomePanel, FormPanel } from "@astria/ui";
import { useLogin } from "./use-login.hook";

export function LoginView() {
  const { submit } = useLogin();
  return (
    <div className="a-stack">
      <h1 className="a-sr-only">Masuk ke Astria</h1>
      <AstriaWelcomePanel title="Selamat datang di Astria">
        Triase insiden dan DFIR yang menunjuk bukti pada setiap klaim.
      </AstriaWelcomePanel>
      <FormPanel
        title="Masuk"
        description="Gunakan akun Astria Anda."
        fields={[
          { name: "username", label: "Nama pengguna", required: true },
          { name: "password", label: "Kata sandi", type: "password", required: true },
        ]}
        submitLabel="Masuk"
        successMessage="Berhasil masuk. Mengalihkan…"
        onSubmit={submit}
      >
        <Alert title="Pratinjau lokal">
          Kredensial tidak diperiksa. Masuk sungguhan memerlukan layanan identitas.
        </Alert>
      </FormPanel>
    </div>
  );
}

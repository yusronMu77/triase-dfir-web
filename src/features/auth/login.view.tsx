"use client";
import { Alert, Button, Field, Icon, Input } from "@astria/ui";
import { useLogin } from "./use-login.hook";

export function LoginView({ sessionExpired = false }: { sessionExpired?: boolean }) {
  const { submit, pending, error, signedIn } = useLogin();
  return (
    <section className="web-login" aria-labelledby="login-title">
      <header className="web-login-heading">
        <h1 id="login-title">Masuk ke Astria</h1>
        <p>Gunakan akun yang diberikan admin. Tidak ada pendaftaran mandiri.</p>
      </header>
      {error ? (
        <Alert tone="danger" title={error} id="login-error" />
      ) : sessionExpired ? (
        <Alert tone="warning" title="Sesi Anda berakhir">
          Masuk lagi untuk melanjutkan.
        </Alert>
      ) : null}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void submit(new FormData(event.currentTarget));
        }}
        aria-describedby={error ? "login-error" : undefined}
      >
        <fieldset className="web-login-fields" disabled={pending} aria-busy={pending}>
          <legend className="a-sr-only">Kredensial akun</legend>
          <Field label="Nama pengguna" hint="Huruf kecil, tanpa spasi" id="login-username">
            {(props) => (
              <Input
                {...props}
                name="username"
                required
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                placeholder="Masukkan nama pengguna"
              />
            )}
          </Field>
          <Field label="Kata sandi" hint="Minimal 12 karakter" id="login-password">
            {(props) => (
              <Input
                {...props}
                name="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="Masukkan kata sandi"
              />
            )}
          </Field>
          <Button type="submit" loading={pending} loadingLabel={signedIn ? "Mengalihkan…" : "Memeriksa…"}>
            Masuk
          </Button>
        </fieldset>
        <p className="a-sr-only" role="status">
          {signedIn ? "Berhasil masuk. Mengalihkan…" : pending ? "Memeriksa kredensial…" : ""}
        </p>
      </form>
      <div className="web-login-note">
        <Icon name="lock" size={16} />
        <p>
          Sesi berakhir setelah 30 menit tanpa aktivitas atau 8 jam sejak masuk.
          <br />
          Lupa kata sandi? Hubungi admin.
        </p>
      </div>
    </section>
  );
}

"use client";
import { Alert, Card, CardContent, CardHeader, PageHeader, RoleChip } from "@astria/ui";
import { QueryBoundary } from "../shared/query-boundary.view";
import { useCurrentAccount } from "./use-current-account.hook";

/** Accounts and roles cannot be managed yet: identity has the endpoints, the api has no route for them. */
export function UsersView() {
  const current = useCurrentAccount();
  return (
    <>
      <PageHeader title="Pengguna dan peran" description="Akun dan peran akses Astria." />
      <Alert tone="info" title="Kelola akun belum tersedia di API">
        Layanan identity sudah menyediakan endpoint akun, tetapi rute akun di API belum ada. Daftar pengguna
        dan pengubahan peran belum bisa dilakukan dari halaman ini.
      </Alert>
      <div className="a-stack">
        <Card>
          <CardHeader title="Akun yang sedang masuk" description="Peran dan sesi Anda saat ini." />
          <CardContent>
            <QueryBoundary
              loading={current.loading}
              error={current.error}
              onRetry={current.retry}
              empty={current.account === null}
              skeleton="cards"
            >
              {current.account && (
                <dl className="a-stack">
                  <div>
                    <dt className="a-muted">ID pengguna</dt>
                    <dd className="a-mono">{current.account.userId}</dd>
                  </div>
                  <div>
                    <dt className="a-muted">Peran</dt>
                    <dd className="a-row">
                      {current.account.roles.length === 0 ? (
                        <span className="a-muted">Belum ada peran yang dikenali</span>
                      ) : (
                        current.account.roles.map((role) => <RoleChip key={role} role={role} />)
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className="a-muted">Izin</dt>
                    <dd>{current.account.permissionCount} izin aktif</dd>
                  </div>
                  <div>
                    <dt className="a-muted">Konfirmasi kata sandi terakhir</dt>
                    <dd>{current.account.reauthLabel}</dd>
                  </div>
                </dl>
              )}
            </QueryBoundary>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

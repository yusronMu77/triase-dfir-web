"use client";
import {
  Alert,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  type Column,
  Dialog,
  DialogContent,
  Field,
  Input,
  PageHeader,
  PairingCode,
  PairingList,
} from "@astria/ui";
import { QueryBoundary } from "../shared/query-boundary.view";
import { UnavailableNotice } from "./admin-notices.view";
import type { IdentityRow } from "./identities.mapper";
import { useIdentities } from "./use-identities.hook";
import { usePairing } from "./use-pairing.hook";

export function IdentitiesView() {
  const identities = useIdentities();
  const pairing = usePairing();

  const columns: Column<IdentityRow>[] = [
    { id: "owner", header: "Pengguna", cell: (row) => row.ownerLabel },
    { id: "channel", header: "Kanal", cell: (row) => row.channelName },
    { id: "status", header: "Status", cell: (row) => <Badge tone={row.tone}>{row.statusLabel}</Badge> },
    { id: "updated", header: "Diubah", cell: (row) => row.updatedLabel },
    {
      id: "action",
      header: "Tindakan",
      cell: (row) =>
        row.canRevoke ? (
          <Button variant="danger" size="sm" onClick={() => identities.requestRevoke(row)}>
            Cabut
          </Button>
        ) : (
          "—"
        ),
    },
  ];

  return (
    <>
      <PageHeader title="Identitas dan pairing" description="Hubungkan akun chat dengan identitas Astria." />
      <div className="showcase-detail-grid">
        <div className="a-stack">
          {identities.unavailable ? (
            <UnavailableNotice title="Daftar ikatan belum tersedia">
              Fitur ini belum tersedia di layanan gateway. Daftar akan muncul setelah layanan menyediakannya.
            </UnavailableNotice>
          ) : (
            <QueryBoundary
              loading={identities.loading}
              error={identities.error}
              onRetry={identities.retry}
              empty={identities.empty}
              emptyState={
                <Alert tone="info" title="Belum ada ikatan kanal">
                  Hubungkan akun chat dengan kode pairing di samping.
                </Alert>
              }
            >
              <PairingList rows={identities.rows} columns={columns} rowKey={(row) => row.id} />
            </QueryBoundary>
          )}
          {identities.revokeError && !identities.target && (
            <Alert tone="danger" title="Ikatan gagal dicabut">
              {identities.revokeError}
            </Alert>
          )}
        </div>
        <div className="a-stack">
          <PairingCard pairing={pairing} />
        </div>
      </div>
      <Dialog
        open={identities.target !== null}
        onOpenChange={(open) => {
          if (!open) identities.cancelRevoke();
        }}
      >
        <DialogContent
          title="Cabut ikatan kanal?"
          description={`Notifikasi ke ${identities.target?.channelName ?? "kanal"} untuk akun ini dihentikan. Akun bisa dihubungkan lagi dengan kode pairing baru.`}
          busy={identities.revoking}
        >
          {identities.revokeError && (
            <Alert tone="danger" title="Ikatan gagal dicabut">
              {identities.revokeError}
            </Alert>
          )}
          <div className="a-row">
            <Button variant="ghost" onClick={identities.cancelRevoke} disabled={identities.revoking}>
              Batal
            </Button>
            <Button
              variant="danger"
              loading={identities.revoking}
              loadingLabel="Mencabut…"
              onClick={() => void identities.confirmRevoke()}
            >
              Cabut ikatan
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

type PairingModel = ReturnType<typeof usePairing>;

/** Issues a one-time code for the signed-in user. The code is shown once; "Buat kode baru" issues another. */
function PairingCard({ pairing }: { pairing: PairingModel }) {
  return (
    <>
      <Card>
        <CardHeader
          title="Terbitkan kode pairing"
          description="Kirim kode ini hanya kepada bot resmi Astria."
        />
        <CardContent>
          <form
            className="a-stack"
            onSubmit={(event) => {
              event.preventDefault();
              const element = event.currentTarget;
              const channel = String(new FormData(element).get("channel") ?? "");
              void pairing.issue(channel);
            }}
          >
            <Field
              label="Kanal tujuan (opsional)"
              hint="Kosongkan agar kode bisa dipakai di kanal mana pun."
              error={pairing.error ?? undefined}
            >
              {(props) => (
                <Input {...props} name="channel" autoComplete="off" maxLength={64} disabled={pairing.busy} />
              )}
            </Field>
            <div>
              <Button type="submit" loading={pairing.busy} loadingLabel="Menerbitkan…">
                Terbitkan kode
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      {pairing.pairing && (
        <PairingCode
          code={pairing.pairing.code}
          expiresAt={pairing.pairing.expiresAt}
          onRegenerate={() => void pairing.regenerate()}
        />
      )}
    </>
  );
}

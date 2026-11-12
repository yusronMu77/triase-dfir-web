"use client";
import { Alert, Badge, Button, type Column, DeliveryLog, Field, PageHeader, Select } from "@astria/ui";
import { QueryBoundary } from "../shared/query-boundary.view";
import { UnavailableNotice } from "./admin-notices.view";
import { type DeliveryRow, STATUS_FILTER_OPTIONS } from "./deliveries.mapper";
import { useDeliveries } from "./use-deliveries.hook";

export function DeliveriesView() {
  const deliveries = useDeliveries();

  const columns: Column<DeliveryRow>[] = [
    { id: "time", header: "Waktu", cell: (row) => row.updatedLabel },
    { id: "channel", header: "Kanal", cell: (row) => row.channel },
    { id: "subject", header: "Perihal", cell: (row) => row.subject },
    { id: "status", header: "Status", cell: (row) => <Badge tone={row.tone}>{row.statusLabel}</Badge> },
    { id: "attempts", header: "Percobaan", cell: (row) => row.attempts },
    {
      id: "note",
      header: "Catatan",
      cell: (row) => row.lastError ?? "—",
    },
    {
      id: "action",
      header: "Tindakan",
      cell: (row) =>
        row.retryable && deliveries.canRetry ? (
          <div>
            <Button
              variant="secondary"
              size="sm"
              disabled={deliveries.retrying !== null}
              loading={deliveries.retrying === row.id}
              loadingLabel="Mengirim ulang…"
              onClick={() => void deliveries.retryDelivery(row)}
            >
              Coba kirim ulang
            </Button>
            {deliveries.retryError?.id === row.id && (
              <p className="a-field-error" role="alert">
                {deliveries.retryError.message}
              </p>
            )}
          </div>
        ) : (
          "—"
        ),
    },
  ];

  return (
    <>
      <PageHeader title="Log pengiriman" description="Hasil pengiriman notifikasi per kanal." />
      {deliveries.unavailable ? (
        <UnavailableNotice title="Log pengiriman belum tersedia">
          Fitur ini belum tersedia di layanan gateway. Halaman ini akan terisi setelah layanan menyediakannya.
        </UnavailableNotice>
      ) : (
        <div className="a-stack">
          <StatusFilter value={deliveries.status} onChange={deliveries.changeFilter} />
          <QueryBoundary
            loading={deliveries.loading}
            error={deliveries.error}
            onRetry={deliveries.retry}
            empty={deliveries.empty}
            emptyState={
              <Alert tone="info" title="Belum ada pengiriman">
                Belum ada pesan dengan status ini.
              </Alert>
            }
          >
            <DeliveryLog rows={deliveries.rows} columns={columns} rowKey={(row) => row.id} />
          </QueryBoundary>
        </div>
      )}
    </>
  );
}

function StatusFilter({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <Field label="Filter status">
      {(props) => (
        <Select {...props} value={value} onChange={(event) => onChange(event.target.value)}>
          {STATUS_FILTER_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      )}
    </Field>
  );
}

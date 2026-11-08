"use client";
import {
  Badge,
  Button,
  ChannelForm,
  ChannelsList,
  ChannelTestError,
  ChannelTestSuccess,
  type Column,
  EmailChannelForm,
  PageHeader,
  WebhookChannelForm,
  WhatsAppChannelPlan,
} from "@astria/ui";
import type { ChannelRow } from "../../data/admin";
import { useChannels } from "./use-channels.hook";
import { useConfigForm } from "./use-config-form.hook";

const statusTone = { Terhubung: "success", "Perlu tes": "warning", Nonaktif: "neutral" } as const;

export function ChannelsView({ rows }: { rows: ChannelRow[] }) {
  const channels = useChannels(rows);
  const { submit } = useConfigForm("Kanal");
  const columns: Column<ChannelRow>[] = [
    { id: "name", header: "Kanal", cell: (row) => row.name, sortValue: (row) => row.name },
    { id: "type", header: "Jenis", cell: (row) => row.type },
    {
      id: "status",
      header: "Status",
      cell: (row) => <Badge tone={statusTone[row.status]}>{row.status}</Badge>,
    },
    { id: "detail", header: "Detail", cell: (row) => row.detail },
    {
      id: "test",
      header: "Tes",
      cell: (row) => (
        <Button variant="secondary" disabled={channels.testing} onClick={() => channels.test(row.id)}>
          Tes {row.name}
        </Button>
      ),
    },
  ];
  const tested = channels.result && rows.find((row) => row.id === channels.result?.id);
  return (
    <>
      <PageHeader title="Kanal notifikasi" description="Tujuan pengiriman dan status koneksi" />
      <div className="a-stack">
        <div role="status" aria-live="polite">
          {channels.result?.ok === true && (
            <ChannelTestSuccess>Pesan uji ke {tested?.name} terkirim.</ChannelTestSuccess>
          )}
          {channels.result?.ok === false && (
            <ChannelTestError>Pesan uji ke {tested?.name} gagal. Periksa koneksi.</ChannelTestError>
          )}
        </div>
        <ChannelsList rows={rows} columns={columns} rowKey={(row) => row.id} />
        <div className="showcase-grid">
          <ChannelForm onSubmit={submit} />
          <EmailChannelForm onSubmit={submit} />
          <WebhookChannelForm onSubmit={submit} />
          <WhatsAppChannelPlan />
        </div>
      </div>
    </>
  );
}

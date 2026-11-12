"use client";
import { EmptyState, PageHeader } from "@astria/ui";
import { QueryBoundary } from "../shared/query-boundary.view";
import { SettingGroups } from "./setting-fields.view";
import { useConfigForm } from "./use-config-form.hook";

/** General settings: every non-operational key, grouped by its scope. Operational keys live on /configuration. */
export function SettingsView() {
  const form = useConfigForm("settings");
  return (
    <>
      <PageHeader title="Pengaturan" description="Jadwal, tautan publik, perintah chat, dan retensi data." />
      <QueryBoundary
        loading={form.loading}
        error={form.error}
        onRetry={form.retry}
        empty={form.empty}
        emptyState={
          <EmptyState
            title="Belum ada pengaturan umum"
            description="Tidak ada kunci umum yang bisa diubah saat ini."
          />
        }
      >
        <SettingGroups form={form} />
      </QueryBoundary>
    </>
  );
}

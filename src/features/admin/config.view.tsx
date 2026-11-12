"use client";
import { EmptyState, PageHeader } from "@astria/ui";
import { QueryBoundary } from "../shared/query-boundary.view";
import { ReauthDialog, SecretFields, SettingGroups } from "./setting-fields.view";
import { useConfigForm } from "./use-config-form.hook";

export function ConfigView() {
  const form = useConfigForm("configuration");
  return (
    <>
      <PageHeader
        title="Konfigurasi"
        description="Pengaturan Core yang dapat diubah admin, beserta sumber setiap nilai."
      />
      <QueryBoundary
        loading={form.loading}
        error={form.error}
        onRetry={form.retry}
        empty={form.empty}
        emptyState={
          <EmptyState
            title="Belum ada pengaturan"
            description="Layanan konfigurasi belum mengembalikan kunci pengaturan."
          />
        }
      >
        <div className="a-stack">
          <SettingGroups form={form} />
          <SecretFields form={form} />
        </div>
      </QueryBoundary>
      <ReauthDialog form={form} />
    </>
  );
}

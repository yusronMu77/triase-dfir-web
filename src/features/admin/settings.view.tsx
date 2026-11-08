"use client";
import { GeneralSettings, PageHeader } from "@astria/ui";
import { useConfigForm } from "./use-config-form.hook";

export function SettingsView() {
  const { submit } = useConfigForm("Pengaturan");
  return (
    <>
      <PageHeader title="Pengaturan" description="Preferensi waktu dan tampilan operasional" />
      <GeneralSettings onSubmit={submit} />
    </>
  );
}

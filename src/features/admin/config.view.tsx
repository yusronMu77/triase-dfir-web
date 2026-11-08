"use client";
import { ConfigForm, PageHeader } from "@astria/ui";
import { useConfigForm } from "./use-config-form.hook";

export function ConfigView() {
  const { submit } = useConfigForm("Konfigurasi");
  return (
    <>
      <PageHeader title="Konfigurasi" description="Ambang dan kebijakan triase" />
      <ConfigForm onSubmit={submit} />
    </>
  );
}

"use client";
import { AstriaGuidance, FormPanel, PageHeader } from "@astria/ui";
import { useHandoverForm } from "./use-handover-form.hook";

export function HandoverView() {
  const { submit } = useHandoverForm();
  return (
    <>
      <PageHeader title="Serah terima" description="Catatan untuk analis shift berikutnya" />
      <div className="a-stack">
        <AstriaGuidance title="Tulis yang perlu dilanjutkan" expression="handover">
          Sebut ID kartu dan bukti yang masih terbuka. Jangan salin log mentah ke catatan.
        </AstriaGuidance>
        <FormPanel
          title="Catatan serah terima"
          fields={[
            {
              name: "shift",
              label: "Shift berikutnya",
              type: "select",
              options: [
                { value: "siang", label: "Siang · 14:00" },
                { value: "malam", label: "Malam · 22:00" },
                { value: "pagi", label: "Pagi · 06:00" },
              ],
            },
            { name: "open", label: "Kartu masih terbuka", type: "number", min: 0, defaultValue: "0" },
            { name: "summary", label: "Ringkasan", type: "textarea", required: true },
          ]}
          submitLabel="Kirim serah terima"
          onSubmit={submit}
        />
      </div>
    </>
  );
}

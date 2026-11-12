"use client";
import { Alert, AstriaGuidance, Button, FormPanel, PageHeader } from "@astria/ui";
import { describeError } from "../../lib/http/api-error";
import { QueryBoundary } from "../shared/query-boundary.view";
import { handoverFields } from "./handover.mapper";
import { useHandoverForm } from "./use-handover-form.hook";

export function HandoverView() {
  const handover = useHandoverForm();
  return (
    <>
      <PageHeader title="Serah terima" description="Catatan untuk analis shift berikutnya" />
      <div className="a-stack">
        <AstriaGuidance title="Tulis yang perlu dilanjutkan" expression="handover">
          Sebut ID kartu dan bukti yang masih terbuka. Jangan salin log mentah ke catatan.
        </AstriaGuidance>
        {handover.draftMissing && (
          <Alert tone="info" title="Draf otomatis belum tersedia">
            Isi catatan secara manual.
          </Alert>
        )}
        {handover.draftError && (
          <Alert
            tone="warning"
            title="Draf tidak dapat dimuat"
            action={
              <Button variant="secondary" size="sm" onClick={handover.retryDraft}>
                Coba lagi
              </Button>
            }
          >
            {describeError(handover.draftError)}
          </Alert>
        )}
        <QueryBoundary
          loading={handover.draftLoading}
          error={null}
          onRetry={handover.retryDraft}
          skeleton="cards"
        >
          {/* Remount once the draft is known so the fields pick up the prefilled values. */}
          <FormPanel
            key={handover.draft.loaded ? "draf" : "kosong"}
            title="Catatan serah terima"
            fields={handoverFields(handover.draft)}
            submitLabel="Kirim serah terima"
            successMessage="Serah terima tersimpan."
            onSubmit={handover.submit}
          />
        </QueryBoundary>
      </div>
    </>
  );
}

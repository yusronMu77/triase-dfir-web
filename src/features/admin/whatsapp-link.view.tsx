"use client";
import {
  Alert,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  Dialog,
  DialogContent,
  InlineLoading,
} from "@astria/ui";
import { useWhatsAppLink } from "./use-whatsapp-link.hook";

const QR_SIZE = 256;

/** Pairs the WhatsApp bot number from the browser: scan the QR, see the masked number, or unlink. */
export function WhatsAppLinkCard() {
  const wa = useWhatsAppLink();
  if (wa.unavailable) return null;
  const linked = wa.link?.terhubung === true;
  return (
    <Card>
      <CardHeader
        title="Bot WhatsApp"
        description="Nomor bot yang mengirim notifikasi dan menjawab perintah chat (uji)."
        action={
          wa.link && (
            <Badge tone={linked ? "success" : "warning"}>{linked ? "Tertaut" : "Belum tertaut"}</Badge>
          )
        }
      />
      <CardContent className="a-stack">
        {wa.loading && <InlineLoading>Memuat status bot…</InlineLoading>}
        {wa.error && (
          <Alert tone="warning" title="Status bot tidak tersedia">
            {wa.error}
          </Alert>
        )}
        {wa.error && (
          <div className="a-row">
            <Button variant="secondary" onClick={wa.retry}>
              Coba lagi
            </Button>
          </div>
        )}
        {linked && (
          <>
            <p>Tertaut ke {wa.link?.nomor_tersamar ?? "nomor tidak diketahui"}.</p>
            <div className="a-row">
              <Button variant="danger" onClick={wa.openConfirm}>
                Putuskan tautan
              </Button>
            </div>
          </>
        )}
        {!linked && wa.link?.qr && (
          <>
            <ol>
              <li>Buka WhatsApp di HP nomor bot.</li>
              <li>Pilih Perangkat tertaut, lalu Tautkan perangkat.</li>
              <li>Pindai QR ini. QR berganti otomatis.</li>
            </ol>
            {/* biome-ignore lint/performance/noImgElement: data URL QR, not an optimisable asset */}
            <img src={wa.link.qr} alt="QR untuk menautkan bot WhatsApp" width={QR_SIZE} height={QR_SIZE} />
          </>
        )}
        {wa.link && !linked && !wa.link.qr && <InlineLoading>Menunggu QR dari WhatsApp…</InlineLoading>}
      </CardContent>
      <Dialog
        open={wa.confirming}
        onOpenChange={(open) => {
          if (!open) wa.cancelConfirm();
        }}
      >
        <DialogContent
          title="Putuskan tautan bot WhatsApp?"
          description="Bot berhenti mengirim notifikasi dan menjawab perintah sampai QR baru dipindai. Ikatan nomor pengguna tetap tersimpan."
          busy={wa.unlinking}
        >
          {wa.unlinkError && (
            <Alert tone="danger" title="Tautan gagal diputus">
              {wa.unlinkError}
            </Alert>
          )}
          <div className="a-row">
            <Button variant="ghost" onClick={wa.cancelConfirm} disabled={wa.unlinking}>
              Batal
            </Button>
            <Button
              variant="danger"
              loading={wa.unlinking}
              loadingLabel="Memutus…"
              onClick={() => void wa.unlink()}
            >
              Putuskan tautan
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

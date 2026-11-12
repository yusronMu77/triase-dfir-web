"use client";
import {
  Alert,
  Button,
  Card,
  CardContent,
  CardHeader,
  EmptyState,
  Field,
  Input,
  Select,
  Textarea,
} from "@astria/ui";
import Link from "next/link";
import { conclusionLabels, nextStatuses, statusLabel } from "../../services/cards.mapper";
import type { CardConclusion, CardSummary } from "../../services/cards.types";
import type { useCardActions } from "./use-card-actions.hook";

export type CardActions = ReturnType<typeof useCardActions>;

const feedbackOptions = [
  { value: "benar", label: "Benar" },
  { value: "salah_positif", label: "Salah positif" },
  { value: "perlu_dfir", label: "Perlu analisis DFIR" },
] as const;

const conclusionOptions = Object.entries(conclusionLabels) as [CardConclusion, string][];

/**
 * Forms of the card detail. Each form passes its FormData to the hook, which validates and sends it. Views keep no
 * state of their own; the hook decides what happens.
 */
export function CardActionsView({
  card,
  write,
  deepDive,
  actions,
}: {
  card: CardSummary;
  write: boolean;
  deepDive: boolean;
  actions: CardActions;
}) {
  if (!write && !deepDive) {
    return (
      <Card>
        <CardContent>
          <EmptyState title="Tidak ada aksi" description="Peran Anda hanya dapat melihat kartu ini." />
        </CardContent>
      </Card>
    );
  }
  const statusChoices = nextStatuses[card.status];

  return (
    <div className="a-stack">
      {write && (
        <>
          <Card>
            <CardHeader title="Status dan kesimpulan" description={`Saat ini: ${statusLabel(card.status)}`} />
            <CardContent>
              {statusChoices.length === 0 ? (
                <p className="a-muted">
                  Kartu selesai dibuka kembali oleh sistem saat versi kartu baru masuk, bukan oleh pengguna.
                </p>
              ) : (
                <form
                  className="a-stack"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void actions.changeStatus(new FormData(event.currentTarget));
                  }}
                >
                  <Field label="Status baru" error={actions.errorOf("status") ?? undefined}>
                    {(props) => (
                      <Select {...props} name="status" defaultValue="">
                        <option value="" disabled>
                          Pilih status
                        </option>
                        {statusChoices.map((status) => (
                          <option key={status} value={status}>
                            {statusLabel(status)}
                          </option>
                        ))}
                      </Select>
                    )}
                  </Field>
                  <Field label="Kesimpulan" hint="Wajib untuk status Selesai.">
                    {(props) => (
                      <Select {...props} name="kesimpulan" defaultValue="">
                        <option value="">Belum dipilih</option>
                        {conclusionOptions.map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </Select>
                    )}
                  </Field>
                  <Field label="Catatan kesimpulan">
                    {(props) => <Textarea {...props} name="catatan" rows={2} maxLength={8000} />}
                  </Field>
                  <div>
                    <Button type="submit" loading={actions.busy("status")} loadingLabel="Menyimpan…">
                      Simpan status
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader
              title="Pemilik"
              description={card.pemilik ? `Dipegang oleh ${card.pemilik}` : "Belum ada pemilik"}
            />
            <CardContent>
              <form
                className="a-stack"
                onSubmit={(event) => {
                  event.preventDefault();
                  void actions.changeOwner(new FormData(event.currentTarget));
                }}
              >
                <Field
                  label="Nama pemilik"
                  hint="Kosongkan untuk melepas pemilik."
                  error={actions.errorOf("owner") ?? undefined}
                >
                  {(props) => (
                    <Input
                      {...props}
                      name="pemilik"
                      defaultValue={card.pemilik ?? ""}
                      maxLength={64}
                      autoComplete="off"
                    />
                  )}
                </Field>
                <div>
                  <Button
                    type="submit"
                    variant="secondary"
                    loading={actions.busy("owner")}
                    loadingLabel="Menyimpan…"
                  >
                    Simpan pemilik
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="Prioritas" description={`Saat ini ${card.prioritas}`} />
            <CardContent>
              <form
                className="a-stack"
                onSubmit={(event) => {
                  event.preventDefault();
                  void actions.changePriority(new FormData(event.currentTarget));
                }}
              >
                <Field label="Prioritas baru" error={actions.errorOf("priority") ?? undefined}>
                  {(props) => (
                    <Select {...props} name="prioritas" defaultValue={card.prioritas}>
                      <option value="P1">P1</option>
                      <option value="P2">P2</option>
                      <option value="P3">P3</option>
                      <option value="P4">P4</option>
                    </Select>
                  )}
                </Field>
                <Field label="Alasan (wajib)">
                  {(props) => <Textarea {...props} name="alasan" rows={2} maxLength={8000} />}
                </Field>
                <div>
                  <Button
                    type="submit"
                    variant="secondary"
                    loading={actions.busy("priority")}
                    loadingLabel="Menyimpan…"
                  >
                    Simpan prioritas
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="Komentar" description="Terlihat oleh semua analis yang membuka kartu ini." />
            <CardContent>
              <form
                className="a-stack"
                onSubmit={async (event) => {
                  event.preventDefault();
                  const form = event.currentTarget;
                  if (await actions.addComment(new FormData(form))) form.reset();
                }}
              >
                <Field label="Komentar" error={actions.errorOf("comment") ?? undefined}>
                  {(props) => <Textarea {...props} name="isi" rows={3} maxLength={20000} />}
                </Field>
                <div>
                  <Button
                    type="submit"
                    variant="secondary"
                    loading={actions.busy("comment")}
                    loadingLabel="Mengirim…"
                  >
                    Kirim komentar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="Umpan balik analis" description="Penilaian Anda terhadap alert ini." />
            <CardContent>
              <form
                className="a-stack"
                onSubmit={async (event) => {
                  event.preventDefault();
                  const form = event.currentTarget;
                  if (await actions.sendFeedback(new FormData(form))) form.reset();
                }}
              >
                <Field label="Penilaian" error={actions.errorOf("feedback") ?? undefined}>
                  {(props) => (
                    <Select {...props} name="label" defaultValue="">
                      <option value="" disabled>
                        Pilih penilaian
                      </option>
                      {feedbackOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Select>
                  )}
                </Field>
                <Field label="Catatan (opsional)">
                  {(props) => <Textarea {...props} name="catatan" rows={2} maxLength={8000} />}
                </Field>
                <div>
                  <Button
                    type="submit"
                    variant="secondary"
                    loading={actions.busy("feedback")}
                    loadingLabel="Mengirim…"
                  >
                    Kirim umpan balik
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </>
      )}

      {deepDive && (
        <Card>
          <CardHeader title="Analisis DFIR" description="Meminta kasus deep-dive untuk kartu ini." />
          <CardContent>
            <div className="a-stack">
              <div>
                <Button
                  variant="secondary"
                  loading={actions.busy("deepDive")}
                  loadingLabel="Meminta…"
                  onClick={() => void actions.requestDeepDive()}
                >
                  Minta analisis DFIR
                </Button>
              </div>
              {actions.errorOf("deepDive") && (
                <Alert tone="danger" title="Permintaan belum berhasil">
                  {actions.errorOf("deepDive")}
                </Alert>
              )}
              {actions.deepDiveCaseId && (
                <Alert
                  tone="success"
                  title="Permintaan analisis diterima"
                  action={
                    <Link className="showcase-link" href={`/cases/${actions.deepDiveCaseId}`}>
                      Buka kasus
                    </Link>
                  }
                >
                  Kasus {actions.deepDiveCaseId} sedang disiapkan oleh layanan DFIR.
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

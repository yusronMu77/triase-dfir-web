"use client";
import {
  Alert,
  Badge,
  Card,
  CardContent,
  CardHeader,
  CaseOverview,
  EmptyState,
  EntityRow,
  EvidenceChip,
  PageHeader,
  StatusBadge,
  TechniqueChip,
  TimelineItem,
  type Tone,
} from "@astria/ui";
import Link from "next/link";
import {
  bandToSeverity,
  type CardNarrative,
  conclusionLabels,
  evidenceAnchor,
  formatWaktu,
  slaOf,
  statusLabel,
  statusToTicket,
  toCardFacts,
  toCardNarrative,
  toTimelineEvents,
  verificationView,
} from "../../services/cards.mapper";
import type { CardDetail, PenjelasEntry } from "../../services/cards.types";
import { QueryBoundary } from "../shared/query-boundary.view";
import { CardActionsView } from "./card-actions.view";
import { CardEvidenceView } from "./card-evidence.view";
import { useCardActions } from "./use-card-actions.hook";
import { useCardDetail } from "./use-card-detail.hook";

export function CardDetailView({ id }: { id: string }) {
  const detail = useCardDetail(id);
  const actions = useCardActions(detail.card);
  const hidden = !detail.allowed && !detail.sessionLoading && !detail.sessionError;

  return (
    <>
      <div className="showcase-screen-title">
        <Link href="/cards">← Kembali ke antrean</Link>
      </div>
      {hidden ? (
        <EmptyState
          title="Kartu tidak tersedia"
          description="Peran Anda tidak memiliki akses ke detail kartu."
        />
      ) : (
        <QueryBoundary
          loading={detail.loading}
          error={detail.sessionError ?? detail.error}
          onRetry={detail.sessionError ? detail.retrySession : detail.retry}
          skeleton="cards"
        >
          {detail.card && <CardBody card={detail.card} detail={detail} actions={actions} />}
        </QueryBoundary>
      )}
    </>
  );
}

type Detail = ReturnType<typeof useCardDetail>;
type Actions = ReturnType<typeof useCardActions>;

function CardBody({ card, detail, actions }: { card: CardDetail; detail: Detail; actions: Actions }) {
  const facts = toCardFacts(card.dokumen);
  const narrative = toCardNarrative(card.dokumen);
  const verification = verificationView(card.status_verifikasi);
  const sla = slaOf(card, Date.now());
  const events = toTimelineEvents(card.aktivitas);
  const penjelas = Object.entries(card.penjelas ?? {});
  const penjelasMissing = card.bagian_tidak_tersedia.includes("penjelas");
  const hasFacts = facts.entitas.length > 0 || facts.teknik.length > 0 || facts.korelasi.length > 0;

  return (
    <>
      <PageHeader
        title={card.card_id}
        description={card.judul}
        action={<StatusBadge status={statusToTicket[card.status]} />}
      />
      <div className="showcase-detail-grid">
        <div className="a-stack">
          <CaseOverview
            id={card.card_id}
            title="Ringkasan kartu"
            band={bandToSeverity[card.band]}
            score={card.skor}
            entities={[
              { label: "Status", value: statusLabel(card.status) },
              {
                label: "Prioritas",
                value: `${card.prioritas} (${card.prioritas_sumber === "analis" ? "diubah analis" : "dari band"})`,
              },
              { label: "Pemilik", value: card.pemilik ?? "Belum ada" },
              { label: "SLA", value: sla.sla },
              { label: "Pola", value: card.pola || "-" },
              {
                label: "Kesimpulan",
                value: card.kesimpulan ? conclusionLabels[card.kesimpulan] : "Belum ada",
              },
              {
                label: "Verifikasi",
                value: (
                  <Badge tone={verification.tone} title={card.status_verifikasi}>
                    {card.status_verifikasi || "-"}
                  </Badge>
                ),
              },
              { label: "Versi", value: `v${card.versi}` },
              { label: "Diperbarui", value: formatWaktu(card.diperbarui_pada) },
            ]}
          >
            {card.label.length > 0 && (
              <div className="a-row">
                {card.label.map((label) => (
                  <Badge key={label}>{label}</Badge>
                ))}
              </div>
            )}
            {card.kesimpulan_catatan && <p className="a-muted">{card.kesimpulan_catatan}</p>}
          </CaseOverview>

          <NarrativeCard narrative={narrative} status={card.status_verifikasi} verification={verification} />

          <Card>
            <CardHeader title="Faktor skor" />
            <CardContent>
              {facts.faktor.length > 0 ? (
                facts.faktor.map((factor) => (
                  <EntityRow
                    key={factor.nama}
                    label={factor.nama}
                    value={`${factor.nilai}${factor.alasan ? ` · ${factor.alasan}` : ""}`}
                  />
                ))
              ) : (
                <EmptyState title="Faktor skor belum tersedia" />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="Entitas, teknik, dan korelasi" />
            <CardContent>
              {facts.entitas.map((entity) => (
                <div key={`${entity.jenis}-${entity.nilai}`} className="a-stack">
                  <EntityRow
                    label={entity.jenis}
                    value={`${entity.nilai}${entity.peran ? ` (${entity.peran})` : ""}`}
                  />
                  {entity.bukti.length > 0 && (
                    <div className="a-row">
                      {entity.bukti.map((evidenceId) => (
                        <EvidenceChip key={evidenceId} href={`#${evidenceAnchor(evidenceId)}`}>
                          {evidenceId}
                        </EvidenceChip>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {facts.teknik.length > 0 && (
                <div className="a-row">
                  {facts.teknik.map((technique) => (
                    // One technique can serve several tactics (T1053.005: execution, persistence, ...).
                    <TechniqueChip key={`${technique.id}-${technique.taktik ?? ""}`}>
                      {technique.id}
                      {technique.taktik ? ` · ${technique.taktik}` : ""}
                    </TechniqueChip>
                  ))}
                </div>
              )}
              {facts.korelasi.map((finding) => (
                <p key={finding} className="a-mono a-muted">
                  {finding}
                </p>
              ))}
              {!hasFacts && <EmptyState title="Belum ada entitas" />}
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="Penjelasan alert" description="Dari katalog penjelasan yang aktif" />
            <CardContent>
              {penjelasMissing && (
                <Alert tone="warning" title="Penjelasan belum tersedia">
                  Layanan konfigurasi belum dapat dihubungi. Kartu tetap dapat ditinjau.
                </Alert>
              )}
              {!penjelasMissing && penjelas.length === 0 && (
                <EmptyState
                  title="Belum ada penjelasan"
                  description="Aturan kartu ini belum punya penjelasan di katalog aktif."
                />
              )}
              {penjelas.map(([ruleId, entry]) => (
                <PenjelasItem key={ruleId} ruleId={ruleId} entry={entry} />
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="a-stack">
          <CardActionsView
            card={card}
            write={detail.permissions.write}
            deepDive={detail.permissions.deepDive}
            actions={actions}
          />
          <CardEvidenceView state={detail.evidence} />
          <Card>
            <CardHeader title="Aktivitas" description="Komentar, label, dan perubahan terbaru" />
            <CardContent>
              {events.length > 0 ? (
                <ol className="a-timeline">
                  {events.map((event) => (
                    <TimelineItem
                      key={event.id}
                      title={event.title}
                      time={event.time}
                      dateTime={event.dateTime}
                    >
                      {event.description}
                    </TimelineItem>
                  ))}
                </ol>
              ) : (
                <EmptyState title="Belum ada aktivitas" />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

function EvidenceChips({ ids }: { ids: string[] }) {
  if (!ids.length) return null;
  return (
    <div className="a-row">
      {ids.map((evidenceId) => (
        <EvidenceChip key={evidenceId} href={`#${evidenceAnchor(evidenceId)}`}>
          {evidenceId}
        </EvidenceChip>
      ))}
    </div>
  );
}

/** Narrative after the verifier: each claim keeps the evidence IDs stored in the card document. */
function NarrativeCard({
  narrative,
  status,
  verification,
}: {
  narrative: CardNarrative;
  status: string;
  verification: { label: string; tone: Tone; description: string };
}) {
  return (
    <Card>
      <CardHeader
        title="Narasi dan klaim"
        description={verification.description}
        action={
          <Badge tone={verification.tone} title={status}>
            {verification.label}
          </Badge>
        }
      />
      <CardContent>
        {narrative.empty ? (
          <EmptyState
            title="Tidak ada narasi model"
            description={
              status === "TEMPLAT"
                ? "Pemeriksa menolak narasi model; gunakan faktor skor dan entitas di bawah."
                : "Dokumen kartu belum memuat narasi."
            }
          />
        ) : (
          <div className="a-stack">
            {narrative.hypothesis && (
              <div className="a-stack">
                <strong>Hipotesis utama</strong>
                <p>{narrative.hypothesis.text}</p>
                <EvidenceChips ids={narrative.hypothesis.evidence} />
              </div>
            )}
            {narrative.claims.length > 0 && (
              <div className="a-stack">
                <strong>Klaim ({narrative.claims.length})</strong>
                <ol className="a-stack" aria-label="Klaim narasi">
                  {narrative.claims.map((claim, index) => (
                    // Claims have no ID of their own; the position is stable within one card version.
                    // biome-ignore lint/suspicious/noArrayIndexKey: claim order is fixed per card version
                    <li key={index} className="a-stack">
                      <span>{claim.text}</span>
                      <EvidenceChips ids={claim.evidence} />
                    </li>
                  ))}
                </ol>
              </div>
            )}
            {narrative.counter.length > 0 && (
              <div>
                <strong>Hipotesis tandingan</strong>
                <ul>
                  {narrative.counter.map((item) => (
                    <li key={item.text}>
                      {item.text}
                      {item.rebuttal ? ` · Pembantah: ${item.rebuttal}` : ""}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <ListBlock title="Belum diketahui" items={narrative.unknowns} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PenjelasItem({ ruleId, entry }: { ruleId: string; entry: PenjelasEntry }) {
  return (
    <article className="a-stack web-card-explanation">
      <strong>{entry.judul}</strong>
      <small className="a-mono a-muted">{ruleId}</small>
      <p>{entry.penjelasan}</p>
      <ListBlock title="Penyebab jinak" items={entry.penyebab_jinak} />
      <ListBlock title="Yang dicek" items={entry.yang_dicek} />
      <ListBlock title="Rujukan" items={entry.rujukan} />
    </article>
  );
}

function ListBlock({ title, items }: { title: string; items?: string[] }) {
  if (!items?.length) return null;
  return (
    <div>
      <strong>{title}</strong>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

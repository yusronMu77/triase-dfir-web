"use client";
import { Alert, Badge, Card, CardContent, CardHeader, EmptyState, EntityRow, EvidenceChip } from "@astria/ui";
import { evidenceAnchor, formatWaktu } from "../../services/cards.mapper";
import type { CardEvidence, EvidenceItem } from "../../services/cards.types";
import { QueryBoundary } from "../shared/query-boundary.view";

export type EvidenceState = {
  data: CardEvidence | null;
  loading: boolean;
  error: unknown;
  retry: () => void;
};

/** Sanitized evidence of one card. Raw event data never reaches the browser, so only these fields are shown. */
export function CardEvidenceView({ state }: { state: EvidenceState }) {
  const empty = !!state.data && state.data.evidence.length === 0 && state.data.tidak_ditemukan.length === 0;
  return (
    <Card>
      <CardHeader title="Bukti" description="Ringkasan tersanitasi. Isi mentah tidak ditampilkan." />
      <CardContent>
        <QueryBoundary
          loading={state.loading}
          error={state.error}
          onRetry={state.retry}
          empty={empty}
          emptyState={<EmptyState title="Belum ada bukti" description="Kartu ini belum menunjuk bukti." />}
        >
          {state.data && (
            <div className="a-stack">
              {state.data.evidence.map((item) => (
                <EvidenceEntry key={item.evidence_id} item={item} />
              ))}
              {state.data.tidak_ditemukan.length > 0 && (
                <Alert tone="warning" title="Sebagian bukti tidak ditemukan">
                  {state.data.tidak_ditemukan.join(", ")}
                </Alert>
              )}
            </div>
          )}
        </QueryBoundary>
      </CardContent>
    </Card>
  );
}

function EvidenceEntry({ item }: { item: EvidenceItem }) {
  const anchor = evidenceAnchor(item.evidence_id);
  return (
    <article id={anchor} className="a-stack">
      <div className="a-row">
        <EvidenceChip href={`#${anchor}`}>{item.evidence_id}</EvidenceChip>
        {item.injection_suspect && <Badge tone="warning">Perlu kehati-hatian</Badge>}
      </div>
      <EntityRow label="Waktu" value={formatWaktu(item.occurred_at)} />
      <EntityRow label="Host" value={item.host} />
      {item.account && <EntityRow label="Akun" value={item.account} />}
      <EntityRow label="Jenis" value={item.kind} />
      {Object.entries(item.fields).map(([key, value]) => (
        <EntityRow key={key} label={key} value={value} />
      ))}
      {item.excerpt && <p className="a-muted">{item.excerpt}</p>}
    </article>
  );
}

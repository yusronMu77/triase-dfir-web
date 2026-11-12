"use client";
import {
  Alert,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  Checkbox,
  Field,
  PageHeader,
  Select,
} from "@astria/ui";
import { QueryBoundary } from "../shared/query-boundary.view";
import {
  type ChannelRow,
  MAX_DETAIL_OPTIONS,
  MIN_BAND_OPTIONS,
  type PolicyDraft,
  type TestOutcome,
} from "./channels.mapper";
import { useChannels } from "./use-channels.hook";

const TRANSPORT_TONES = { aktif: "success", nonaktif: "danger", "tidak diketahui": "neutral" } as const;

export function ChannelsView() {
  const channels = useChannels();
  return (
    <>
      <PageHeader
        title="Kanal notifikasi"
        description="Kebijakan kanal di Core dan status transport di gateway."
      />
      <QueryBoundary
        loading={channels.loading}
        error={channels.error}
        onRetry={channels.retry}
        empty={channels.empty}
        skeleton="cards"
      >
        <div className="a-stack">
          {channels.missing.includes("status_gateway") && (
            <Alert tone="warning" title="Status transport tidak tersedia">
              Status gateway belum dapat dibaca. Kebijakan tetap ditampilkan.
            </Alert>
          )}
          {channels.outcome && <TestResult outcome={channels.outcome} />}
          {channels.rows.map((row) => (
            <ChannelCard key={row.channelId} row={row} channels={channels} />
          ))}
        </div>
      </QueryBoundary>
    </>
  );
}

type ChannelsModel = ReturnType<typeof useChannels>;

function TestResult({ outcome }: { outcome: TestOutcome }) {
  return (
    <div role="status" aria-live="polite">
      <Alert tone={outcome.tone} title={outcome.title}>
        {outcome.message}
      </Alert>
    </div>
  );
}

function ChannelCard({ row, channels }: { row: ChannelRow; channels: ChannelsModel }) {
  const draft: PolicyDraft = channels.draftFor(row);
  const dirty =
    draft.active !== row.saved.active ||
    draft.maxDetail !== row.saved.maxDetail ||
    draft.minBand !== row.saved.minBand;
  const busy = channels.busy === row.channelId;
  const error = channels.policyError?.channelId === row.channelId ? channels.policyError.message : undefined;
  return (
    <Card>
      <CardHeader
        title={row.name}
        description={`Kanal ${row.channelId} · versi kebijakan ${row.version}`}
        action={<Badge tone={TRANSPORT_TONES[row.transport]}>Transport: {row.transport}</Badge>}
      />
      <CardContent className="a-stack">
        <form
          className="a-stack"
          onSubmit={(event) => {
            event.preventDefault();
            void channels.savePolicy(row);
          }}
        >
          <Checkbox
            label={draft.active ? "Kanal aktif" : "Kanal nonaktif"}
            checked={draft.active}
            disabled={!channels.canAdmin || busy}
            onChange={(event) => channels.setDraft(row, { active: event.target.checked })}
          />
          <Field label="Detail maksimum">
            {(props) => (
              <Select
                {...props}
                value={draft.maxDetail}
                disabled={!channels.canAdmin || busy}
                onChange={(event) =>
                  channels.setDraft(row, {
                    maxDetail: event.target.value as PolicyDraft["maxDetail"],
                  })
                }
              >
                {MAX_DETAIL_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Ambang band minimum" hint="Band di bawah ambang ini tidak dikirim ke kanal.">
            {(props) => (
              <Select
                {...props}
                value={draft.minBand}
                disabled={!channels.canAdmin || busy}
                onChange={(event) =>
                  channels.setDraft(row, { minBand: event.target.value as PolicyDraft["minBand"] })
                }
              >
                {MIN_BAND_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          {channels.conflictId === row.channelId && (
            <Alert tone="warning" title="Kebijakan berubah di tempat lain">
              Nilai terbaru sudah dimuat. Periksa lalu simpan lagi.
            </Alert>
          )}
          {error && (
            <Alert tone="danger" title="Kebijakan gagal disimpan">
              {error}
            </Alert>
          )}
          <div className="a-row">
            <Button
              type="submit"
              variant="secondary"
              disabled={!channels.canAdmin || !dirty || busy}
              loading={busy && dirty}
              loadingLabel="Menyimpan…"
            >
              Simpan kebijakan
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={!channels.canAdmin || busy}
              onClick={() => void channels.testChannel(row.channelId)}
            >
              Tes {row.name}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

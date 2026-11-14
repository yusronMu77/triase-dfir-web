import { describe, expect, it } from "vitest";
import { ApiError } from "../../lib/http/api-error";
import type { CaseCustodyDto, CaseDto, CaseTimelineItemDto } from "../../services/case.types";
import {
  describeReportError,
  isCaseId,
  shortHash,
  toCaseCustody,
  toCaseSummary,
  toTimelineEvent,
} from "./case.mapper";

const dto: CaseDto = {
  case_id: "CS-20261112-001",
  status: "draf_sebagian",
  card_id: "IC-20261112-0007",
  card_version: 3,
  requested_by: "usr_analis",
  window: { start: "2026-11-11T17:00:00Z", end: "2026-11-11T18:00:00Z" },
  keterbatasan: ["Linimasa hanya memuat event ter-normalisasi."],
  created_at: "2026-11-12T01:00:00.000000Z",
  updated_at: "2026-11-12T01:05:30.000000Z",
  report: { version: 1, html_sha256: "a".repeat(64) },
};

const item: CaseTimelineItemDto = {
  item_id: "TL-20261112-001-00001",
  case_id: "CS-20261112-001",
  ts_utc: "2026-11-11T17:10:00Z",
  evidence_id: "EV-9",
  source_id: "hayabusa",
  host: "WS-FIN-02",
  account: "svc-backup",
  kind: "logon",
  ringkasan: "Logon dari aset tidak biasa.",
  injection_suspect: false,
};

describe("isCaseId", () => {
  it("accepts the CS-YYYYMMDD-NNN shape and rejects everything else", () => {
    expect(isCaseId("CS-20261112-001")).toBe(true);
    expect(isCaseId("CS-20261112-1234")).toBe(true);
    expect(isCaseId("cs-20261112-001")).toBe(false);
    expect(isCaseId("IC-20261112-001")).toBe(false);
    expect(isCaseId("CS-2026111-001")).toBe(false);
    expect(isCaseId("CS-20261112-001/../x")).toBe(false);
  });
});

describe("toCaseSummary", () => {
  it("maps the case DTO to display values in WIB", () => {
    const summary = toCaseSummary(dto);
    expect(summary.id).toBe("CS-20261112-001");
    expect(summary.statusLabel).toBe("Draf sebagian");
    expect(summary.statusTone).toBe("warning");
    expect(summary.windowLabel).toBe("2026-11-12 00:00 WIB sampai 2026-11-12 01:00 WIB");
    expect(summary.createdAt).toBe("2026-11-12 08:00:00 WIB");
    expect(summary.report).toEqual({ version: 1, sha256: "a".repeat(64) });
    expect(summary.limitations).toEqual(dto.keterbatasan);
  });

  it("handles a case without window or report and an unknown status", () => {
    const summary = toCaseSummary({ ...dto, status: "status_baru", window: null, report: null });
    expect(summary.statusLabel).toBe("status_baru");
    expect(summary.statusTone).toBe("neutral");
    expect(summary.windowLabel).toBe("-");
    expect(summary.report).toBeNull();
  });
});

describe("toTimelineEvent", () => {
  it("builds a timeline entry with the evidence id and no HTML", () => {
    const event = toTimelineEvent(item);
    expect(event).toMatchObject({
      id: "TL-20261112-001-00001",
      dateTime: "2026-11-11T17:10:00Z",
      time: "2026-11-12 00:10:00 WIB",
      title: "logon · WS-FIN-02 (svc-backup)",
    });
    expect(event.description).toBe("Logon dari aset tidak biasa. Bukti: EV-9.");
  });

  it("flags suspected injection and falls back when the summary is empty", () => {
    const event = toTimelineEvent({ ...item, account: null, injection_suspect: true, ringkasan: "" });
    expect(event.title).toBe("logon · WS-FIN-02 · Ditandai mencurigakan (kemungkinan injeksi)");
    expect(event.description).toBe("Tanpa ringkasan. Bukti: EV-9.");
  });
});

describe("describeReportError", () => {
  it("explains a 409 as a missing report", () => {
    expect(describeReportError(new ApiError("", 409, "LAPORAN_BELUM_ADA"))).toBe(
      "Laporan belum dibuat untuk kasus ini.",
    );
  });

  it("falls back to the shared message for other errors", () => {
    expect(describeReportError(new ApiError("", 503, undefined))).toBe(
      "Layanan sedang tidak tersedia. Coba lagi beberapa saat lagi.",
    );
  });
});

describe("toCaseCustody", () => {
  const entry = (seq: number, action: string): CaseCustodyDto["entries"][number] => ({
    case_id: "CS-20261112-001",
    seq,
    ts: "2026-11-12T01:00:00.123456Z",
    actor: "svc:dfir",
    action,
    artifact_id: seq === 2 ? "EV-hb01-000001" : null,
    sha256: seq === 2 ? "c".repeat(64) : null,
    detail: null,
    prev_hash: String(seq - 1).repeat(64),
    entry_hash: String(seq).repeat(64),
  });

  it("keeps order, hashes and the raw timestamp exactly as dfir sent them", () => {
    const custody = toCaseCustody({
      case_id: "CS-20261112-001",
      chain_ok: true,
      entries: [entry(1, "KASUS_DIBUAT"), entry(2, "HASH_COCOK")],
    });
    expect(custody.chainOk).toBe(true);
    expect(custody.rows.map((r) => r.seq)).toEqual([1, 2]);
    expect(custody.rows[1]).toMatchObject({
      actionLabel: "Hash bukti cocok",
      actionTone: "success",
      artifactId: "EV-hb01-000001",
      sha256: "c".repeat(64),
      prevHash: "1".repeat(64),
      entryHash: "2".repeat(64),
      ts: "2026-11-12T01:00:00.123456Z",
    });
  });

  it("marks hash mismatches as danger and shows unknown actions by their code", () => {
    const custody = toCaseCustody({
      case_id: "CS-20261112-001",
      chain_ok: false,
      entries: [entry(1, "HASH_TIDAK_COCOK"), entry(2, "AKSI_BARU")],
    });
    expect(custody.chainOk).toBe(false);
    expect(custody.rows[0]?.actionTone).toBe("danger");
    expect(custody.rows[1]).toMatchObject({ actionLabel: "AKSI_BARU", actionTone: "neutral" });
  });

  it("treats a missing or non-boolean chain_ok as not verified", () => {
    const broken = { case_id: "CS-20261112-001", entries: [] } as unknown as CaseCustodyDto;
    expect(toCaseCustody(broken)).toEqual({ rows: [], chainOk: false });
  });
});

describe("shortHash", () => {
  it("shortens a hash and shows a dash when there is none", () => {
    expect(shortHash("abcdef0123456789")).toBe("abcdef012345…");
    expect(shortHash(null)).toBe("-");
  });
});

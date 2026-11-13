import { describe, expect, it } from "vitest";
import type { AuditEntry, VerifyResult } from "../../services/audit.types";
import { formatAuditTime, shortHash, toAuditRow, toVerifyView } from "./audit.mapper";

const hash = "c".repeat(64);
const entry: AuditEntry = {
  seq: 7,
  occurred_at: "2026-11-12T01:02:03Z",
  recorded_at: "2026-11-12T01:02:04Z",
  actor: "analis01",
  actor_type: "user",
  action: "ingest.file.imported",
  target_type: "ingest_job",
  target_id: "ING-20261112-0000ABCD",
  via: "sync",
  idempotency_key: "k-7",
  payload: {},
  payload_hash: "d".repeat(64),
  prev_hash: "e".repeat(64),
  entry_hash: hash,
};

const verify: VerifyResult = {
  job_id: "ver_1",
  status: "selesai",
  from_seq: 1,
  to_seq: null,
  checked: 120,
  ok: true,
  first_bad_seq: null,
  reason: null,
  anchor_match: true,
  started_at: "2026-11-12T01:00:00Z",
  finished_at: "2026-11-12T01:00:02Z",
};

describe("shortHash", () => {
  it("keeps short values and shortens long hashes to the first 10 and last 6 characters", () => {
    expect(shortHash("abc")).toBe("abc");
    expect(shortHash(hash)).toBe(`${"c".repeat(10)}…${"c".repeat(6)}`);
  });
});

describe("formatAuditTime", () => {
  it("formats a valid timestamp in WIB", () => {
    const text = formatAuditTime("2026-11-12T01:02:03Z");
    expect(text).toContain("2026");
    expect(text).toMatch(/WIB$/);
    // 01:02:03 UTC is 08:02:03 in Jakarta. Indonesian locale writes the time with dots.
    expect(text).toMatch(/08[.:]02[.:]03/);
  });
  it("returns the raw text when the timestamp is not a date", () => {
    expect(formatAuditTime("bukan-tanggal")).toBe("bukan-tanggal");
  });
});

describe("toAuditRow", () => {
  it("maps the columns and keeps the full hash", () => {
    const row = toAuditRow(entry);
    expect(row).toMatchObject({
      seq: 7,
      actor: "analis01",
      action: "ingest.file.imported",
      subject: "ingest_job: ING-20261112-0000ABCD",
      hashFull: hash,
    });
    expect(row.hashShort).toBe(shortHash(hash));
  });
});

describe("toVerifyView", () => {
  it("is idle before any verification", () => {
    expect(toVerifyView(null)).toEqual({ kind: "idle" });
  });

  it("shows progress while the job runs", () => {
    expect(toVerifyView({ ...verify, status: "berjalan", ok: null, checked: 40 })).toEqual({
      kind: "running",
      checked: 40,
    });
  });

  it("reports an intact chain with the anchor result", () => {
    expect(toVerifyView(verify)).toMatchObject({
      kind: "valid",
      checked: 120,
      fromSeq: 1,
      toSeq: null,
      anchorText: "Cocok dengan anchor",
    });
  });

  it("says when no anchor falls inside the range", () => {
    const view = toVerifyView({ ...verify, anchor_match: null });
    expect(view.kind === "valid" && view.anchorText).toBe("Tidak ada anchor di rentang ini");
  });

  it("names the first broken entry and the reason", () => {
    expect(
      toVerifyView({
        ...verify,
        ok: false,
        first_bad_seq: 42,
        reason: "prev_hash_tidak_cocok",
        anchor_match: false,
      }),
    ).toEqual({
      kind: "broken",
      checked: 120,
      firstBadSeq: 42,
      reasonText: "hash sebelumnya tidak cocok",
      anchorText: "Tidak cocok dengan anchor",
    });
  });

  it("reports a failed job", () => {
    expect(toVerifyView({ ...verify, status: "gagal", ok: null })).toEqual({ kind: "failed", checked: 120 });
  });
});

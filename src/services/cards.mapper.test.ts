import { describe, expect, it } from "vitest";
import {
  activityDescription,
  bandToSeverity,
  formatDurasi,
  formatWaktu,
  slaOf,
  statusToTicket,
  toCardFacts,
  toCardNarrative,
  toQueueItem,
  toTimelineEvents,
  verificationView,
} from "./cards.mapper";
import type { CardActivity, CardDocument, CardSummary } from "./cards.types";

const minute = 60_000;
const base = Date.parse("2026-11-12T03:00:00Z");

function card(overrides: Partial<CardSummary> = {}): CardSummary {
  return {
    card_id: "IC-20261112-001",
    judul: "Dugaan pengambilalihan akun layanan svc-backup",
    pola: "P-AKUN-DIAMBILALIH",
    band: "KRITIS",
    skor: 71,
    status: "baru",
    prioritas: "P1",
    prioritas_sumber: "band",
    pemilik: null,
    kesimpulan: null,
    label: [],
    status_verifikasi: "lolos",
    versi: 1,
    row_version: 3,
    tanggapan_awal_target: new Date(base + 15 * minute).toISOString(),
    tanggapan_awal_at: null,
    terlambat: false,
    dibuat_pada: new Date(base).toISOString(),
    diperbarui_pada: new Date(base).toISOString(),
    ...overrides,
  };
}

describe("band and status mapping", () => {
  it("maps every server band and status to a UI value", () => {
    expect(bandToSeverity).toEqual({ KRITIS: "critical", TINGGI: "high", SEDANG: "medium", RENDAH: "low" });
    expect(statusToTicket).toEqual({
      baru: "new",
      ditinjau: "reviewed",
      diselidiki: "investigating",
      eskalasi: "escalated",
      selesai: "done",
    });
  });
});

describe("slaOf", () => {
  it("shows the time left, and warns when a quarter of the window or less remains", () => {
    expect(slaOf(card(), base)).toEqual({ sla: "Sisa 15 m", slaState: "ok" });
    expect(slaOf(card(), base + 12 * minute)).toEqual({ sla: "Sisa 3 m", slaState: "warning" });
    expect(slaOf(card({ tanggapan_awal_target: new Date(base + 120 * minute).toISOString() }), base)).toEqual(
      {
        sla: "Sisa 2 j 0 m",
        slaState: "ok",
      },
    );
  });

  it("marks an overdue card as breached, from the server flag or from the clock", () => {
    expect(slaOf(card({ terlambat: true }), base)).toEqual({ sla: "Terlambat", slaState: "breached" });
    expect(slaOf(card(), base + 16 * minute)).toEqual({ sla: "Terlambat", slaState: "breached" });
  });

  it("reports a card that already has a first response", () => {
    const answered = card({ tanggapan_awal_at: new Date(base + minute).toISOString() });
    expect(slaOf(answered, base)).toEqual({ sla: "Sudah ditanggapi", slaState: "ok" });
    expect(slaOf({ ...answered, terlambat: true }, base).slaState).toBe("breached");
  });

  it("says so when there is no target instead of inventing one", () => {
    expect(slaOf(card({ tanggapan_awal_target: null }), base)).toEqual({
      sla: "Tenggat belum ada",
      slaState: "ok",
    });
  });
});

describe("toQueueItem", () => {
  it("builds the row the queue table shows, with a link to the detail page", () => {
    const item = toQueueItem(card({ pemilik: "analis01", pola: "" }), base);
    expect(item).toMatchObject({
      id: "IC-20261112-001",
      title: "Dugaan pengambilalihan akun layanan svc-backup",
      band: "critical",
      score: 71,
      status: "new",
      assignee: "analis01",
      href: "/cards/IC-20261112-001",
      asset: "-",
      meta: undefined,
    });
  });

  it("leaves the owner empty when no one is assigned", () => {
    expect(toQueueItem(card(), base).assignee).toBeUndefined();
  });
});

describe("formatting", () => {
  it("formats a timestamp in Indonesian with WIB, and tolerates bad input", () => {
    const text = formatWaktu("2026-11-12T03:00:00Z");
    expect(text).toContain("2026");
    expect(text.endsWith(" WIB")).toBe(true);
    expect(formatWaktu(null)).toBe("-");
    expect(formatWaktu("bukan tanggal")).toBe("-");
  });

  it("formats durations in hours and minutes", () => {
    expect(formatDurasi(40 * minute)).toBe("40 m");
    expect(formatDurasi(135 * minute)).toBe("2 j 15 m");
    expect(formatDurasi(-5 * minute)).toBe("0 m");
  });
});

describe("activity", () => {
  const activity = (overrides: Partial<CardActivity>): CardActivity => ({
    id: 7,
    ts: "2026-11-12T03:00:00Z",
    pelaku: "analis01",
    jenis: "comment",
    detail: {},
    ...overrides,
  });

  it("describes each kind of activity in Indonesian", () => {
    expect(activityDescription(activity({ detail: { isi: "Cek sesi" } }))).toBe("Cek sesi");
    expect(activityDescription(activity({ jenis: "label", detail: { aksi: "hapus", label: "uji" } }))).toBe(
      "Label dihapus: uji",
    );
    expect(
      activityDescription(
        activity({
          jenis: "status_changed",
          detail: { dari: "baru", ke: "selesai", kesimpulan: "insiden_benar", alasan: "terkonfirmasi" },
        }),
      ),
    ).toBe("Status Baru menjadi Selesai. Kesimpulan: Insiden benar. Alasan: terkonfirmasi");
    expect(activityDescription(activity({ jenis: "assigned", detail: { dari: null, ke: "analis02" } }))).toBe(
      "Pemilik kosong menjadi analis02",
    );
    expect(
      activityDescription(activity({ jenis: "priority_changed", detail: { dari: "P2", ke: "P1" } })),
    ).toBe("Prioritas P2 menjadi P1");
  });

  it("returns no text for an unknown kind", () => {
    expect(activityDescription(activity({ jenis: "tidak_dikenal", detail: { isi: "x" } }))).toBeUndefined();
  });

  it("builds timeline events in the order given", () => {
    const events = toTimelineEvents([
      activity({ id: 9, jenis: "status_changed", detail: { dari: "baru", ke: "ditinjau" } }),
      activity({ id: 8 }),
    ]);
    expect(events.map((e) => e.id)).toEqual(["9", "8"]);
    expect(events[0].title).toBe("Status diubah oleh analis01");
    expect(events[1].description).toBeUndefined();
  });
});

describe("toCardFacts", () => {
  it("reads the parts of the document the screen shows and lists evidence ids once", () => {
    const facts = toCardFacts({
      kode: {
        faktor: [{ nama: "level_aturan", nilai: 30, alasan: "level tertinggi" }],
        entitas: [
          { jenis: "akun", nilai: "svc-backup", peran: "DIDUGA_TERBOBOL", bukti: ["EV-hb01-004217"] },
        ],
        teknik_attack: [{ id: "T1110.001", taktik: "credential-access" }],
        temuan_korelasi: ["K-LOGON-SUKSES-SETELAH-GAGAL"],
        bukti: [{ id: "EV-hb01-004217" }, { id: "EV-hb01-004231" }],
      },
    });
    expect(facts.faktor).toEqual([{ nama: "level_aturan", nilai: 30, alasan: "level tertinggi" }]);
    expect(facts.entitas[0]).toMatchObject({ jenis: "akun", bukti: ["EV-hb01-004217"] });
    expect(facts.teknik).toEqual([{ id: "T1110.001", taktik: "credential-access" }]);
    expect(facts.korelasi).toEqual(["K-LOGON-SUKSES-SETELAH-GAGAL"]);
    expect(facts.buktiIds).toEqual(["EV-hb01-004217", "EV-hb01-004231"]);
  });

  it("ignores malformed parts instead of failing", () => {
    // Deliberately wrong types: the document is stored as JSON and is not validated when it is read.
    const broken = {
      kode: { faktor: [{ nama: 1 }, "x"], entitas: "bukan daftar", teknik_attack: [{ taktik: "x" }] },
    } as unknown as CardDocument;
    const facts = toCardFacts(broken);
    expect(facts).toEqual({ faktor: [], entitas: [], teknik: [], korelasi: [], buktiIds: [] });
    expect(toCardFacts(null).buktiIds).toEqual([]);
  });
});

describe("verificationView", () => {
  it("labels the three verifier outcomes with distinct tones", () => {
    expect(verificationView("LULUS")).toMatchObject({ label: "Lulus pemeriksa", tone: "success" });
    expect(verificationView("SEBAGIAN")).toMatchObject({ label: "Sebagian lulus", tone: "warning" });
    expect(verificationView("TEMPLAT")).toMatchObject({ tone: "neutral" });
    expect(verificationView("TEMPLAT").label).toMatch(/Templat/);
  });

  it("shows an unknown status as received instead of guessing", () => {
    expect(verificationView("MENUNGGU")).toMatchObject({ label: "MENUNGGU", tone: "neutral" });
    expect(verificationView("").label).toBe("Belum diverifikasi");
  });
});

describe("toCardNarrative", () => {
  it("keeps every claim with exactly the evidence IDs stored in the document", () => {
    const dokumen: CardDocument = {
      model: {
        ringkasan: [
          {
            klaim: "Akun svc-backup diduga terbobol.",
            bukti: ["EV-hb01-000001", "EV-hb01-000022"],
            nilai_dikutip: null,
          },
          { klaim: "Akun adm-support dibuat dalam insiden.", bukti: ["EV-hb01-000027"] },
        ],
        hipotesis_utama: { teks: "Dugaan pengambilalihan akun.", bukti: ["EV-hb01-000001"] },
        hipotesis_tandingan: [{ teks: "Uji penetrasi terjadwal.", pembantah: "Tidak ada tiket uji." }],
        belum_diketahui: ["Hipotesis tandingan belum dinilai."],
      },
    };
    const narrative = toCardNarrative(dokumen);
    expect(narrative.empty).toBe(false);
    expect(narrative.claims).toEqual([
      { text: "Akun svc-backup diduga terbobol.", evidence: ["EV-hb01-000001", "EV-hb01-000022"] },
      { text: "Akun adm-support dibuat dalam insiden.", evidence: ["EV-hb01-000027"] },
    ]);
    expect(narrative.hypothesis).toEqual({
      text: "Dugaan pengambilalihan akun.",
      evidence: ["EV-hb01-000001"],
    });
    expect(narrative.counter).toEqual([
      { text: "Uji penetrasi terjadwal.", rebuttal: "Tidak ada tiket uji." },
    ]);
    expect(narrative.unknowns).toEqual(["Hipotesis tandingan belum dinilai."]);
  });

  it("is empty for a TEMPLAT card, whose model the verifier stores as {}", () => {
    expect(toCardNarrative({ model: {} }).empty).toBe(true);
    expect(toCardNarrative(null)).toEqual({
      claims: [],
      hypothesis: null,
      counter: [],
      unknowns: [],
      empty: true,
    });
  });

  it("drops malformed claims and non-text evidence IDs instead of inventing values", () => {
    const narrative = toCardNarrative({
      model: { ringkasan: [{ bukti: ["EV-1"] }, { klaim: "Valid.", bukti: ["EV-2", 7, null] }] },
    } as unknown as CardDocument);
    expect(narrative.claims).toEqual([{ text: "Valid.", evidence: ["EV-2"] }]);
  });
});

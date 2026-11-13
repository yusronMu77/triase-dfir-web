import { describe, expect, it } from "vitest";
import { ApiError } from "../../lib/http/api-error";
import type { DigestDetailDto, DigestSummaryDto } from "../../services/digest.types";
import {
  describeDocumentError,
  isPublished,
  narrationModeLabel,
  toDigestDetail,
  toDigestListItem,
  toDigestRunRequest,
  validateDigestRun,
} from "./digest.mapper";

const summary: DigestSummaryDto = {
  digest_id: "DG-20261112-0700",
  jenis: "harian",
  periode: "2026-11-11 07:00 WIB sampai 2026-11-12 07:00 WIB",
  periode_mulai: "2026-11-11T07:00:00+07:00",
  periode_selesai: "2026-11-12T07:00:00+07:00",
  status: "terbit",
  terlambat: false,
};

const detail: DigestDetailDto = {
  ...summary,
  terlambat_menit: null,
  dijadwalkan_pada: "2026-11-12T07:00:00+07:00",
  dijalankan_pada: "2026-11-12T00:01:02Z",
  percobaan: 1,
  mode_narasi: "templat",
  sha256: "b".repeat(64),
  versi_templat: "digest_harian-v1",
};

describe("toDigestListItem", () => {
  it("maps status to an Indonesian label and tone and builds the detail link", () => {
    expect(toDigestListItem(summary)).toEqual({
      id: "DG-20261112-0700",
      jenis: "Harian",
      periode: summary.periode,
      status: "terbit",
      statusLabel: "Terbit",
      statusTone: "success",
      terlambat: false,
      href: "/digests/DG-20261112-0700",
    });
  });

  it("keeps an unknown status visible instead of hiding it", () => {
    const item = toDigestListItem({ ...summary, status: "status_baru", jenis: "mingguan" });
    expect(item.statusLabel).toBe("status_baru");
    expect(item.statusTone).toBe("neutral");
    expect(item.jenis).toBe("mingguan");
  });
});

describe("toDigestDetail", () => {
  it("adds run metadata in WIB and the narration mode label", () => {
    const view = toDigestDetail(detail);
    expect(view.dijadwalkanPada).toBe("2026-11-12 07:00:00 WIB");
    expect(view.dijalankanPada).toBe("2026-11-12 07:01:02 WIB");
    expect(view.modeNarasi).toBe("Narasi dari template");
    expect(view.sha256).toBe("b".repeat(64));
    expect(view.percobaan).toBe(1);
  });

  it("shows a dash for a run that has not started", () => {
    const view = toDigestDetail({ ...detail, status: "terjadwal", dijalankan_pada: null, mode_narasi: null });
    expect(view.dijalankanPada).toBe("-");
    expect(view.modeNarasi).toBe("-");
  });
});

describe("narrationModeLabel and isPublished", () => {
  it("labels each narration mode and passes unknown values through", () => {
    expect(narrationModeLabel("online")).toBe("Narasi model (online)");
    expect(narrationModeLabel("mode_lain")).toBe("mode_lain");
  });

  it("treats only terbit as published", () => {
    expect(isPublished("terbit")).toBe(true);
    expect(isPublished("berjalan")).toBe(false);
  });
});

describe("describeDocumentError", () => {
  it("explains a 409 as an unpublished digest", () => {
    expect(describeDocumentError(new ApiError("", 409, "DIGEST_BELUM_TERBIT"))).toBe(
      "Dokumen digest belum terbit.",
    );
  });
});

describe("manual run form", () => {
  const form = (alasan?: string) => {
    const data = new FormData();
    if (alasan !== undefined) data.set("alasan", alasan);
    return data;
  };

  it("accepts an empty reason and sends only the job type", () => {
    expect(validateDigestRun(form(""))).toBe("");
    expect(toDigestRunRequest(form("   "))).toEqual({ jenis: "harian" });
  });

  it("sends a trimmed reason when one is given", () => {
    expect(toDigestRunRequest(form("  Uji ulang setelah ingest  "))).toEqual({
      jenis: "harian",
      alasan: "Uji ulang setelah ingest",
    });
  });

  it("rejects a reason longer than 500 characters", () => {
    expect(validateDigestRun(form("a".repeat(501)))).toBe("Alasan maksimal 500 karakter.");
    expect(validateDigestRun(form("a".repeat(500)))).toBe("");
  });
});

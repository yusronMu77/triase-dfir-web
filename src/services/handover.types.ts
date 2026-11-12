/**
 * Handover (serah terima) shapes. The api proxies `/handover/current` and `/handover` to scheduler, but scheduler
 * does not serve them yet (its README lists handover as deferred), and OpenAPI leaves the body untyped.
 * Field names below come from the scheduler note (`serah_terima.catatan`) and the api chat command
 * (`jumlah_terbuka`). Every field is optional on read, so a partial or missing draft still renders.
 */
export type HandoverDraftDto = {
  serah_id?: string;
  /** Draft note text for the shift. */
  catatan?: string;
  /** Number of cards still open at handover time. */
  jumlah_terbuka?: number;
};

/** Body of `POST /handover`. `shift` is sent from the form; the upstream contract for it is not defined yet. */
export type HandoverRequest = {
  catatan: string;
  jumlah_terbuka: number;
  shift: string;
};

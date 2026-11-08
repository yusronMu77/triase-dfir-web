"use client";
import {
  Alert,
  AstriaEmptyState,
  AstriaGuidance,
  AstriaMascot,
  AstriaWelcomePanel,
  AuditBroken,
  AuditLog,
  AuditValid,
  Avatar,
  Badge,
  BandChip,
  Button,
  Card,
  CardContent,
  CardHeader,
  CaseList,
  CaseOverview,
  CaseReport,
  CaseTimeline,
  ChannelForm,
  ChannelsList,
  ChannelTestError,
  ChannelTestSuccess,
  ChatComposer,
  ChatMessage,
  ChatPanel,
  Checkbox,
  ConfigForm,
  DataTable,
  DeliveryLog,
  Dialog,
  DialogClose,
  DialogContent,
  DialogTrigger,
  DigestList,
  EmailChannelForm,
  EmptyState,
  EntityRow,
  EvidenceChip,
  FactorRow,
  Field,
  GeneralSettings,
  Hypothesis,
  Icon,
  type IconName,
  InlineLoading,
  Input,
  iconMap,
  MetricsSummary,
  mascotExpressions,
  NarrationBadge,
  navigationForRole,
  PageHeader,
  PairingCode,
  PairingExpired,
  PairingList,
  PairingRevoked,
  RefreshIndicator,
  type Role,
  RoleChip,
  RouteProgress,
  Select,
  SettingsError,
  SettingsSaved,
  type Severity,
  SkeletonCard,
  SkeletonText,
  SLAChip,
  Spinner,
  SpinnerInverse,
  SpinnerSmall,
  StatusBadge,
  StepItem,
  Tab,
  TabList,
  TabPanel,
  Tabs,
  TechniqueChip,
  Textarea,
  type TicketStatus,
  UploadPanel,
  type UploadState,
  useToast,
  VerifierBadge,
  WebhookChannelForm,
  WhatsAppChannelPlan,
} from "@astria/ui";
import dynamic from "next/dynamic";
import { useState } from "react";
import { events, evidence, queueItems } from "../data/fixtures";
import { PreviewLayout } from "../layouts/preview.layout";

const MetricChart = dynamic(() => import("@astria/ui").then((module) => module.MetricChart), {
  loading: () => <InlineLoading>Memuat grafik…</InlineLoading>,
});
const pause = (ms = 700) => new Promise<void>((resolve) => setTimeout(resolve, ms));
const tabs = [
  ["foundations", "Dasar"],
  ["forms", "Formulir"],
  ["data", "Data & triase"],
  ["panels", "Panel"],
  ["feedback", "Status & memuat"],
  ["brand", "Identitas & chat"],
];
const sampleRows = [
  { id: "CS-20261110-003", name: "Akun layanan svc-backup", status: "Diselidiki", value: 71 },
  { id: "CS-20261110-001", name: "Persistensi WS-FIN-02", status: "Baru", value: 58 },
];
const columns = [
  {
    id: "id",
    header: "ID",
    cell: (row: (typeof sampleRows)[number]) => <span className="a-mono">{row.id}</span>,
    sortValue: (row: (typeof sampleRows)[number]) => row.id,
  },
  { id: "name", header: "Ringkasan", cell: (row: (typeof sampleRows)[number]) => row.name },
  { id: "status", header: "Status", cell: (row: (typeof sampleRows)[number]) => <Badge>{row.status}</Badge> },
  {
    id: "value",
    header: "Skor",
    cell: (row: (typeof sampleRows)[number]) => row.value,
    sortValue: (row: (typeof sampleRows)[number]) => row.value,
  },
];
const listProps = { rows: sampleRows, columns, rowKey: (row: (typeof sampleRows)[number]) => row.id };
function Example({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader title={title} description={description} />
      <CardContent>{children}</CardContent>
    </Card>
  );
}
export function ShowcaseView() {
  return (
    <PreviewLayout>
      <Showcase />
    </PreviewLayout>
  );
}
function Showcase() {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [role, setRole] = useState<Role>("analis");
  const [messages, setMessages] = useState<{ id: string; text: string }[]>([]);
  const [expiry, setExpiry] = useState("2099-11-10T10:00:00+07:00");
  const [tab, setTab] = useState("foundations");
  async function save() {
    await pause();
    if (error) throw new Error("Contoh kegagalan layanan. Data belum disimpan.");
    toast({ title: "Pratinjau berhasil", description: "Perubahan contoh hanya berlaku pada halaman ini." });
  }
  async function upload() {
    setUploadState("uploading");
    setProgress(15);
    await pause();
    setProgress(65);
    await pause();
    setProgress(100);
    setUploadState(error ? "error" : "success");
  }
  return (
    <>
      <PageHeader
        title="Pustaka komponen"
        description="Fondasi antarmuka Astria · Referensi Penpot, komponen React, dan pola siap pakai"
        action={
          <a className="showcase-link" href="/cards">
            Lihat contoh antrean <Icon name="chevron-right" size={16} />
          </a>
        }
      />
      <div className="a-stack">
        <AstriaGuidance
          title="Satu bahasa visual untuk seluruh Astria"
          action={<Badge tone="brand">174 varian desain</Badge>}
        >
          Kontrol, data triase, dan panel memakai token dan komponen yang sama. Semua data dan aksi di halaman
          ini adalah contoh lokal.
        </AstriaGuidance>
        <Tabs value={tab} onValueChange={setTab}>
          <TabList aria-label="Kategori komponen">
            {tabs.map(([value, label]) => (
              <Tab key={value} value={value}>
                {label}
              </Tab>
            ))}
          </TabList>
          <TabPanel value="foundations">
            <div className="a-stack">
              <MetricsSummary
                metrics={[
                  { label: "Acuan desain", value: "174", meta: "Varian diekspor dari Penpot" },
                  { label: "Ikon & logo", value: "43", meta: "SVG native tersedia" },
                  { label: "Tema", value: "Terang", meta: "Token semantik bersama" },
                  { label: "Ukuran", value: "3", meta: "Desktop · tablet · HP" },
                ]}
              />
              <Example
                title="Warna & permukaan"
                description="Warna kuat menyampaikan makna, teal menandai aksi."
              >
                <div className="showcase-swatches">
                  {[
                    ["Primary", "--color-action-primary", "#007A6A"],
                    ["Midnight", "--color-bg-inverse", "#112C3B"],
                    ["Paper", "--color-bg-canvas", "#F4F7F5"],
                    ["Signal", "--color-accent-signal", "#51E0BD"],
                  ].map(([label, token, hex]) => (
                    <div className="showcase-swatch" key={label}>
                      <span style={{ background: `var(${token})` }} />
                      <strong>{label}</strong>
                      <br />
                      <code>{hex}</code>
                    </div>
                  ))}
                </div>
              </Example>
              <div className="showcase-grid">
                <Example
                  title="Tombol"
                  description="Primary, secondary, ghost, danger, disabled, dan pending."
                >
                  <div className="showcase-state-row">
                    <Button onClick={() => toast({ title: "Tiket contoh diambil" })}>Ambil tiket</Button>
                    <Button variant="secondary" onClick={() => toast({ title: "Aksi sekunder" })}>
                      Tinjau bukti
                    </Button>
                    <Button variant="ghost" onClick={() => toast({ title: "Aksi dibatalkan" })}>
                      Batal
                    </Button>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="danger">Cabut akses</Button>
                      </DialogTrigger>
                      <DialogContent
                        title="Cabut akses contoh?"
                        description="Dialog ini memperagakan konfirmasi tindakan. Tidak ada akun yang diubah."
                      >
                        <div className="a-row a-end">
                          <DialogClose asChild>
                            <Button variant="secondary">Batal</Button>
                          </DialogClose>
                          <DialogClose asChild>
                            <Button
                              variant="danger"
                              onClick={() => toast({ title: "Konfirmasi contoh selesai" })}
                            >
                              Ya, cabut akses
                            </Button>
                          </DialogClose>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                  <div className="showcase-state-row">
                    <Button disabled>Tidak tersedia</Button>
                    <Button variant="secondary" disabled>
                      Dinonaktifkan
                    </Button>
                    <Button
                      loading={busy}
                      onClick={async () => {
                        setBusy(true);
                        await pause(1200);
                        setBusy(false);
                        toast({ title: "Contoh simpan selesai" });
                      }}
                    >
                      Simpan perubahan
                    </Button>
                  </div>
                </Example>
                <Example title="Tipografi & identitas">
                  <p style={{ fontSize: 24, fontWeight: 600 }}>Tinjau sinyal. Temukan bukti.</p>
                  <p>IBM Plex Sans · 14 px · Isi antarmuka yang ringkas dan terbaca.</p>
                  <p className="a-mono">IC-20261110-003 · EV-004217 · 71</p>
                  <div className="a-row">
                    <Avatar name="Rizky Aditya" />
                    {(["analis", "dfir", "pimpinan", "admin"] as Role[]).map((value) => (
                      <RoleChip key={value} role={value} />
                    ))}
                  </div>
                </Example>
              </div>
              <Example
                title="Ikon"
                description="41 ikon desain menggunakan Lucide; menu ditambahkan untuk navigasi responsif."
              >
                <div className="showcase-icon-grid">
                  {Object.keys(iconMap).map((name) => (
                    <div key={name}>
                      <Icon name={name as IconName} />
                      <small className="a-muted">{name}</small>
                    </div>
                  ))}
                </div>
              </Example>
            </div>
          </TabPanel>
          <TabPanel value="forms">
            <div className="a-stack">
              <div className="showcase-grid">
                <Example title="Kontrol formulir">
                  <Field label="Nama pengguna" hint="Gunakan akun organisasi." required>
                    {(props) => <Input {...props} required placeholder="nama.pengguna" />}
                  </Field>
                  <Field label="Alamat email" error="Format alamat email belum benar.">
                    {(props) => <Input {...props} type="email" defaultValue="alamat-tidak-valid" />}
                  </Field>
                  <Field label="Kanal">
                    {(props) => (
                      <Select {...props}>
                        <option>Telegram</option>
                        <option>Email</option>
                        <option>Webhook</option>
                      </Select>
                    )}
                  </Field>
                  <Field label="Catatan serah terima" hint="Sertakan ID bukti yang relevan.">
                    {(props) => <Textarea {...props} placeholder="Tuliskan tindak lanjut…" />}
                  </Field>
                  <Field label="ID sistem">
                    {(props) => <Input {...props} disabled value="ASTRIA-001" />}
                  </Field>
                  <Checkbox label="Kirim ringkasan saat tugas selesai" defaultChecked />
                </Example>
                <div className="a-stack">
                  <Example title="Keadaan simpan">
                    <Checkbox
                      label="Simulasikan kegagalan simpan / unggah"
                      checked={error}
                      onChange={(event) => setError(event.target.checked)}
                    />
                    <p className="a-muted">
                      Formulir mengunci isian saat menyimpan, menampilkan hasil, dan mempertahankan isian saat
                      gagal.
                    </p>
                  </Example>
                  <GeneralSettings onSubmit={save} />
                </div>
              </div>
              <ConfigForm onSubmit={save} />
              <ChannelForm onSubmit={save} />
              <div className="showcase-grid">
                <EmailChannelForm onSubmit={save} />
                <WebhookChannelForm onSubmit={save} />
              </div>
            </div>
          </TabPanel>
          <TabPanel value="data">
            <div className="a-stack">
              <div className="showcase-grid">
                <Example title="Band, status, dan SLA">
                  <div className="a-row">
                    {(["critical", "high", "medium", "low"] as Severity[]).map((band, i) => (
                      <BandChip key={band} band={band} score={[71, 58, 41, 18][i]} />
                    ))}
                  </div>
                  <div className="a-row">
                    {(["new", "reviewed", "investigating", "escalated", "done"] as TicketStatus[]).map(
                      (status) => (
                        <StatusBadge key={status} status={status} />
                      ),
                    )}
                  </div>
                  <div className="a-row">
                    <SLAChip>Sisa 38 mnt</SLAChip>
                    <SLAChip state="warning">Sisa 12 mnt</SLAChip>
                    <SLAChip state="breached">Lewat 4 mnt</SLAChip>
                  </div>
                  <div className="a-row">
                    <VerifierBadge result="pass">Lolos pemeriksa 5/5</VerifierBadge>
                    <VerifierBadge result="fail" />
                    <NarrationBadge />
                  </div>
                </Example>
                <Example title="Bukti & faktor skor">
                  <div className="a-row">
                    <EvidenceChip href="/cards/IC-20261110-003#EV-004217">EV-004217</EvidenceChip>
                    <TechniqueChip>T1110.001</TechniqueChip>
                  </div>
                  <EntityRow label="Aset" value="WS-ADM-04" icon={<Icon name="monitor" />} />
                  <EntityRow label="Akun" value="svc-backup" icon={<Icon name="user" />} />
                  {(["L", "T", "A", "K", "R"] as const).map((factor, i) => (
                    <FactorRow
                      key={factor}
                      factor={factor}
                      label={["Level", "Teknik", "Aset", "Korelasi", "Riwayat"][i]}
                      value={[18, 16, 15, 12, 10][i]}
                    />
                  ))}
                </Example>
              </div>
              <Example
                title="Tabel universal"
                description="Kolom bertipe, urutan naik/turun, keadaan kosong, memuat dan galat."
              >
                <DataTable {...listProps} caption="Contoh tabel kasus" />
              </Example>
              <div className="showcase-grid">
                <CaseOverview
                  id={queueItems[1].id}
                  title="Dugaan pengambilalihan akun layanan"
                  band="critical"
                  score={71}
                  entities={[
                    { label: "Aset", value: "WS-ADM-04" },
                    { label: "Akun", value: "svc-backup" },
                  ]}
                >
                  <Hypothesis
                    title="Hipotesis contoh"
                    evidence={evidence.map((e) => ({ ...e, href: `/cards/IC-20261110-003${e.href}` }))}
                  >
                    Autentikasi berulang dan perubahan akun perlu ditinjau bersama.
                  </Hypothesis>
                </CaseOverview>
                <CaseTimeline
                  events={events.map((event) => ({
                    ...event,
                    evidence: event.evidence.map((e) => ({ ...e, href: `/cards/IC-20261110-003${e.href}` })),
                  }))}
                />
              </div>
              <CaseReport verified action={<a href="/cards/IC-20261110-003">Lihat kartu</a>}>
                <h3>Ringkasan penyelidikan contoh</h3>
                <p>Periksa sumber bukti sebelum mengambil keputusan operasional.</p>
                <EvidenceChip href="/cards/IC-20261110-003#EV-004217">EV-004217</EvidenceChip>
              </CaseReport>
              <div className="showcase-grid">
                <MetricChart
                  title="Sebaran band"
                  data={[
                    { label: "Kritis", value: 2, band: "critical" },
                    { label: "Tinggi", value: 8, band: "high" },
                    { label: "Sedang", value: 12, band: "medium" },
                    { label: "Rendah", value: 4, band: "low" },
                  ]}
                />
                <MetricChart
                  title="Tren triase"
                  description="7 hari · Data contoh"
                  data={["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"].map((label, i) => ({
                    label,
                    value: [8, 12, 10, 18, 15, 9, 14][i],
                  }))}
                />
              </div>
            </div>
          </TabPanel>
          <TabPanel value="panels">
            <div className="a-stack">
              <UploadPanel
                state={uploadState}
                file={file}
                progress={progress}
                onFileSelect={(next) => {
                  setFile(next);
                  setUploadState("ready");
                }}
                onSubmit={upload}
                onReset={() => {
                  setFile(null);
                  setUploadState("idle");
                }}
                summary="Simulasi triase selesai. Berkas tidak dikirim ke layanan."
              />
              <Checkbox
                label="Simulasikan unggah gagal"
                checked={error}
                onChange={(event) => setError(event.target.checked)}
              />
              <div className="showcase-grid">
                <CaseList {...listProps} />
                <DigestList {...listProps} />
                <ChannelsList {...listProps} />
                <PairingList {...listProps} />
                <AuditLog {...listProps} />
                <DeliveryLog {...listProps} />
              </div>
              <div className="showcase-grid">
                <PairingCode
                  code="ASTRIA-4721"
                  expiresAt={expiry}
                  onRegenerate={() => setExpiry(new Date(Date.now() + 300000).toISOString())}
                />
                <Example title="Siklus pairing">
                  <Button variant="secondary" onClick={() => setExpiry("2020-01-01T00:00:00Z")}>
                    Simulasikan kode kedaluwarsa
                  </Button>
                  <PairingExpired />
                  <PairingRevoked />
                </Example>
              </div>
              <WhatsAppChannelPlan />
            </div>
          </TabPanel>
          <TabPanel value="feedback">
            <div className="a-stack">
              <div className="showcase-grid">
                <Example title="Pesan status">
                  <Alert title="Informasi">Narasi harus menyertakan ID bukti.</Alert>
                  <Alert tone="warning" title="Periksa sebelum melanjutkan">
                    Perubahan memerlukan konfirmasi.
                  </Alert>
                  <Alert
                    tone="danger"
                    title="Layanan tidak tersedia"
                    action={
                      <Button variant="secondary" onClick={() => toast({ title: "Percobaan ulang contoh" })}>
                        Coba lagi
                      </Button>
                    }
                  >
                    Data terakhir tetap tersedia.
                  </Alert>
                  <Alert tone="success" title="Berhasil">
                    Data contoh telah diperbarui.
                  </Alert>
                </Example>
                <Example title="Hasil operasi">
                  <AuditValid />
                  <AuditBroken />
                  <SettingsSaved />
                  <SettingsError />
                  <ChannelTestSuccess />
                  <ChannelTestError />
                </Example>
              </div>
              <div className="showcase-grid">
                <Example title="Memuat & memperbarui">
                  <div className="showcase-state-row">
                    <Spinner />
                    <SpinnerSmall />
                    <span style={{ background: "var(--primary)", padding: 8, borderRadius: 4 }}>
                      <SpinnerInverse />
                    </span>
                    <RefreshIndicator />
                  </div>
                  <InlineLoading>Memuat grafik…</InlineLoading>
                  <RouteProgress />
                  <SkeletonText />
                  <ol className="a-stack">
                    <StepItem step={1} title="Validasi berkas" state="complete">
                      Format dikenali.
                    </StepItem>
                    <StepItem step={2} title="Triase deterministik" state="active">
                      Menghitung skor dan prioritas.
                    </StepItem>
                    <StepItem step={3} title="Pemeriksaan narasi">
                      Menunggu triase selesai.
                    </StepItem>
                  </ol>
                </Example>
                <div className="a-stack">
                  <SkeletonCard />
                  <DataTable {...listProps} rows={[]} caption="Tabel sedang dimuat" loading />
                </div>
              </div>
              <div className="showcase-grid">
                <Card>
                  <AstriaEmptyState
                    action={
                      <Button
                        variant="secondary"
                        onClick={() => toast({ title: "Contoh antrean diperbarui" })}
                      >
                        Perbarui antrean
                      </Button>
                    }
                  />
                </Card>
                <Example title="Dialog dan notifikasi">
                  <EmptyState
                    title="Tidak ada hasil filter"
                    description="Coba kata kunci atau band lain."
                    action={
                      <Button variant="secondary" onClick={() => toast({ title: "Filter contoh direset" })}>
                        Reset filter
                      </Button>
                    }
                  />
                  <Button
                    variant="secondary"
                    onClick={() =>
                      toast({
                        title: "Perubahan tersimpan",
                        description: "Anda dapat melanjutkan tugas berikutnya.",
                      })
                    }
                  >
                    Tampilkan toast
                  </Button>
                </Example>
              </div>
            </div>
          </TabPanel>
          <TabPanel value="brand">
            <div className="a-stack">
              <div className="showcase-grid">
                <Example title="Navigasi mengikuti peran">
                  <Field label="Peran pratinjau">
                    {(props) => (
                      <Select
                        {...props}
                        value={role}
                        onChange={(event) => setRole(event.target.value as Role)}
                      >
                        <option value="analis">Analis</option>
                        <option value="dfir">DFIR</option>
                        <option value="pimpinan">Pimpinan</option>
                        <option value="admin">Admin</option>
                      </Select>
                    )}
                  </Field>
                  <div className="a-stack">
                    {navigationForRole(role).map((item) => (
                      <div className="a-row" key={item.href}>
                        <Icon name={item.icon} />
                        {item.label}
                      </div>
                    ))}
                  </div>
                  <p className="a-muted">
                    Menu mengikuti matriks desain. Otorisasi akses tetap harus ditegakkan di server aplikasi.
                  </p>
                </Example>
                <AstriaWelcomePanel title="Selamat datang di Astria">
                  Sinyal terstruktur, bukti terlihat, keputusan terarah.
                </AstriaWelcomePanel>
              </div>
              <Example
                title="Maskot Astria"
                description="12 ekspresi. Maskot mendampingi teks; tidak menentukan severity atau hasil pemeriksaan."
              >
                <div className="showcase-mascots">
                  {mascotExpressions.map((expression) => (
                    <figure key={expression}>
                      <AstriaMascot expression={expression} alt={`Astria ${expression}`} />
                      <figcaption>{expression}</figcaption>
                    </figure>
                  ))}
                </div>
              </Example>
              <div className="showcase-grid">
                <ChatPanel
                  channel="telegram"
                  composer={
                    <ChatComposer
                      onSend={async (message) => {
                        await pause(300);
                        setMessages((items) => [...items, { id: crypto.randomUUID(), text: message }]);
                      }}
                    />
                  }
                >
                  <ChatMessage time="09:38">
                    Kartu contoh IC-20261110-003 perlu ditinjau.
                    <br />
                    <a href="/cards/IC-20261110-003">Buka ringkasan kartu</a>
                  </ChatMessage>
                  {messages.map((message) => (
                    <ChatMessage key={message.id} outgoing>
                      {message.text}
                    </ChatMessage>
                  ))}
                </ChatPanel>
                <ChatPanel channel="whatsapp">
                  <ChatMessage time="09:40">
                    <strong>Notifikasi Astria</strong>
                    <p>Ringkasan minimal tersedia di dasbor.</p>
                    <a href="/cards/IC-20261110-003">Tinjau kartu</a>
                  </ChatMessage>
                  <ChatMessage outgoing time="09:41">
                    Contoh tampilan · Integrasi belum aktif.
                  </ChatMessage>
                </ChatPanel>
              </div>
            </div>
          </TabPanel>
        </Tabs>
      </div>
      <footer className="showcase-footer">
        Astria · Pustaka komponen · Data sintetis untuk pratinjau. Tidak terhubung ke layanan operasional.
      </footer>
    </>
  );
}

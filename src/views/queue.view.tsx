"use client";
import {
  Badge,
  Button,
  Field,
  Icon,
  Input,
  PageHeader,
  QueueTable,
  Select,
  type Severity,
  Tab,
  TabList,
  TabPanel,
  Tabs,
  type TicketStatus,
} from "@astria/ui";
import { useMemo, useState } from "react";
import { queueItems } from "../data/fixtures";
import { PreviewLayout } from "../layouts/preview.layout";
export function QueueView() {
  const [search, setSearch] = useState("");
  const [band, setBand] = useState("all");
  const [status, setStatus] = useState("all");
  const [asset, setAsset] = useState("all");
  const filtered = useMemo(
    () =>
      queueItems.filter(
        (row) =>
          (band === "all" || row.band === band) &&
          (status === "all" || row.status === status) &&
          (asset === "all" || row.asset === asset) &&
          `${row.id} ${row.title} ${row.asset} ${row.assignee || ""}`
            .toLowerCase()
            .includes(search.toLowerCase()),
      ),
    [search, band, status, asset],
  );
  return (
    <PreviewLayout activePath="/cards">
      <PageHeader
        title="Antrean"
        description="8 kartu contoh · Diurutkan menurut sisa SLA, lalu skor"
        action={<Badge tone="info">Pratinjau interaksi</Badge>}
      />
      <Tabs value={status} onValueChange={setStatus}>
        <TabList aria-label="Status kartu">
          {(
            [
              { value: "all", label: "Terbuka" },
              { value: "new", label: "Baru" },
              { value: "reviewed", label: "Ditinjau" },
              { value: "investigating", label: "Diselidiki" },
              { value: "escalated", label: "Eskalasi" },
            ] as { value: "all" | TicketStatus; label: string }[]
          ).map((tab) => (
            <Tab
              key={tab.value}
              value={tab.value}
              count={
                tab.value === "all"
                  ? queueItems.length
                  : queueItems.filter((row) => row.status === tab.value).length
              }
            >
              {tab.label}
            </Tab>
          ))}
        </TabList>
        {["all", "new", "reviewed", "investigating", "escalated"].map((value) => (
          <TabPanel value={value} key={value}>
            <div className="a-stack">
              <div className="showcase-toolbar">
                <Field label="Cari kartu">
                  {(props) => (
                    <Input
                      {...props}
                      type="search"
                      placeholder="Cari judul, host, akun, atau ID"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                    />
                  )}
                </Field>
                <Field label="Band">
                  {(props) => (
                    <Select {...props} value={band} onChange={(event) => setBand(event.target.value)}>
                      <option value="all">Semua band</option>
                      {(
                        [
                          { value: "critical", label: "Kritis" },
                          { value: "high", label: "Tinggi" },
                          { value: "medium", label: "Sedang" },
                          { value: "low", label: "Rendah" },
                        ] as { value: Severity; label: string }[]
                      ).map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Select>
                  )}
                </Field>
                <Field label="Aset">
                  {(props) => (
                    <Select {...props} value={asset} onChange={(event) => setAsset(event.target.value)}>
                      <option value="all">Semua aset</option>
                      {queueItems.map((row) => (
                        <option key={row.id}>{row.asset}</option>
                      ))}
                    </Select>
                  )}
                </Field>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setSearch("");
                    setBand("all");
                    setAsset("all");
                    setStatus("all");
                  }}
                >
                  <Icon name="refresh" size={16} />
                  Reset filter
                </Button>
              </div>
              <QueueTable
                items={filtered}
                footer={
                  <span role="status">
                    Menampilkan {filtered.length} dari {queueItems.length} kartu contoh
                  </span>
                }
              />
            </div>
          </TabPanel>
        ))}
      </Tabs>
    </PreviewLayout>
  );
}

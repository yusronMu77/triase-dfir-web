"use client";
import {
  Badge,
  Button,
  Field,
  Icon,
  Input,
  PageHeader,
  type QueueItem,
  QueueTable,
  Select,
  type Severity,
  Tab,
  TabList,
  TabPanel,
  Tabs,
  type TicketStatus,
} from "@astria/ui";
import { useCardQueue } from "./use-card-queue.hook";

const statusTabs: { value: "all" | TicketStatus; label: string }[] = [
  { value: "all", label: "Terbuka" },
  { value: "new", label: "Baru" },
  { value: "reviewed", label: "Ditinjau" },
  { value: "investigating", label: "Diselidiki" },
  { value: "escalated", label: "Eskalasi" },
];
const bandOptions: { value: Severity; label: string }[] = [
  { value: "critical", label: "Kritis" },
  { value: "high", label: "Tinggi" },
  { value: "medium", label: "Sedang" },
  { value: "low", label: "Rendah" },
];

export function CardQueueView({ items }: { items: QueueItem[] }) {
  const queue = useCardQueue(items);
  const { filters } = queue;
  return (
    <>
      <PageHeader
        title="Antrean"
        description={`${items.length} kartu contoh · Diurutkan menurut sisa SLA, lalu skor`}
        action={<Badge tone="info">Pratinjau interaksi</Badge>}
      />
      <Tabs value={filters.status} onValueChange={(value) => queue.setFilter("status", value)}>
        <TabList aria-label="Status kartu">
          {statusTabs.map((tab) => (
            <Tab key={tab.value} value={tab.value} count={queue.countByStatus(tab.value)}>
              {tab.label}
            </Tab>
          ))}
        </TabList>
        {statusTabs.map((tab) => (
          <TabPanel value={tab.value} key={tab.value}>
            <div className="a-stack">
              <div className="showcase-toolbar">
                <Field label="Cari kartu">
                  {(props) => (
                    <Input
                      {...props}
                      type="search"
                      placeholder="Cari judul, host, akun, atau ID"
                      value={filters.search}
                      onChange={(event) => queue.setFilter("search", event.target.value)}
                    />
                  )}
                </Field>
                <Field label="Band">
                  {(props) => (
                    <Select
                      {...props}
                      value={filters.band}
                      onChange={(event) => queue.setFilter("band", event.target.value)}
                    >
                      <option value="all">Semua band</option>
                      {bandOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Select>
                  )}
                </Field>
                <Field label="Aset">
                  {(props) => (
                    <Select
                      {...props}
                      value={filters.asset}
                      onChange={(event) => queue.setFilter("asset", event.target.value)}
                    >
                      <option value="all">Semua aset</option>
                      {items.map((row) => (
                        <option key={row.id}>{row.asset}</option>
                      ))}
                    </Select>
                  )}
                </Field>
                <Button variant="secondary" onClick={queue.reset}>
                  <Icon name="refresh" size={16} />
                  Reset filter
                </Button>
              </div>
              <QueueTable
                items={queue.filtered}
                footer={
                  <span role="status">
                    Menampilkan {queue.filtered.length} dari {queue.total} kartu contoh
                  </span>
                }
              />
            </div>
          </TabPanel>
        ))}
      </Tabs>
    </>
  );
}

"use client";
import { Button, EmptyState, Field, Icon, Input, PageHeader, QueueTable, Select } from "@astria/ui";
import { bandOptions, priorityOptions, statusFilterOptions } from "../../services/cards.mapper";
import type { CardBand, CardPriority, CardStatus } from "../../services/cards.types";
import { ErrorPanel, QueryBoundary } from "../shared/query-boundary.view";
import { type QueueFilters, useCardQueue } from "./use-card-queue.hook";

export function CardQueueView() {
  const queue = useCardQueue();
  const { filters, setFilter } = queue;

  return (
    <>
      <PageHeader
        title="Antrean"
        description="Kartu terbaru lebih dulu. Filter dikirim ke layanan; pencarian teks hanya pada kartu yang sudah dimuat."
      />
      {!queue.allowed && !queue.loading && !queue.error ? (
        <EmptyState
          title="Antrean kartu tidak tersedia"
          description="Peran Anda tidak memiliki akses ke antrean kartu."
        />
      ) : (
        <div className="a-stack">
          <div className="showcase-toolbar">
            <Field label="Status">
              {(props) => (
                <Select
                  {...props}
                  value={filters.status}
                  onChange={(event) => setFilter("status", event.target.value as QueueFilters["status"])}
                >
                  <option value="all">Semua status</option>
                  {statusFilterOptions.map((option: { value: CardStatus; label: string }) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            <Field label="Band">
              {(props) => (
                <Select
                  {...props}
                  value={filters.band}
                  onChange={(event) => setFilter("band", event.target.value as QueueFilters["band"])}
                >
                  <option value="all">Semua band</option>
                  {bandOptions.map((option: { value: CardBand; label: string }) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            <Field label="Prioritas">
              {(props) => (
                <Select
                  {...props}
                  value={filters.prioritas}
                  onChange={(event) =>
                    setFilter("prioritas", event.target.value as QueueFilters["prioritas"])
                  }
                >
                  <option value="all">Semua prioritas</option>
                  {priorityOptions.map((option: { value: CardPriority; label: string }) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            <Field label="Pemilik">
              {(props) => (
                <Input
                  {...props}
                  placeholder="Nama pengguna"
                  maxLength={64}
                  value={filters.pemilik}
                  onChange={(event) => setFilter("pemilik", event.target.value)}
                />
              )}
            </Field>
            <Field label="Host">
              {(props) => (
                <Input
                  {...props}
                  placeholder="Nama host"
                  maxLength={255}
                  value={filters.host}
                  onChange={(event) => setFilter("host", event.target.value)}
                />
              )}
            </Field>
            <Field label="Cari di daftar">
              {(props) => (
                <Input
                  {...props}
                  type="search"
                  placeholder="ID, judul, atau pemilik"
                  value={filters.cari}
                  onChange={(event) => setFilter("cari", event.target.value)}
                />
              )}
            </Field>
            <Button variant="secondary" onClick={queue.reset}>
              <Icon name="refresh" size={16} />
              Reset filter
            </Button>
          </div>
          <QueryBoundary
            loading={queue.loading}
            error={queue.error}
            onRetry={queue.retry}
            empty={queue.empty}
            emptyState={
              <EmptyState
                title="Belum ada kartu"
                description="Kartu muncul setelah triase menghasilkannya. Ubah filter bila perlu."
              />
            }
          >
            <QueueTable
              items={queue.items}
              footer={
                <span role="status">
                  Menampilkan {queue.items.length} dari {queue.loadedCount} kartu yang sudah dimuat
                </span>
              }
            />
          </QueryBoundary>
          {queue.refreshError && <ErrorPanel error={queue.refreshError} onRetry={queue.retry} />}
          {queue.hasMore && (
            <div className="a-row">
              <Button
                variant="secondary"
                loading={queue.loadingMore}
                loadingLabel="Memuat…"
                onClick={queue.loadMore}
              >
                Muat lebih banyak
              </Button>
            </div>
          )}
        </div>
      )}
    </>
  );
}

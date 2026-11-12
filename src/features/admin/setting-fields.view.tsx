"use client";
import {
  Alert,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  Checkbox,
  Dialog,
  DialogContent,
  Field,
  Input,
  Textarea,
} from "@astria/ui";
import { parseDraft, type SecretRow, type SettingRow } from "./config.mapper";
import type { ConfigFormModel } from "./use-config-form.hook";

const SOURCE_TONES = { bawaan: "neutral", berkas: "info", database: "brand", env: "warning" } as const;

/** One card per scope (model, score, ...). Locked keys (set by an env var) are shown but cannot be edited. */
export function SettingGroups({ form }: { form: ConfigFormModel }) {
  return (
    <div className="a-stack">
      {form.groups.map((group) => (
        <Card key={group.scope}>
          <CardHeader title={group.label} description={`Kunci ${group.scope}.*`} />
          <CardContent className="a-stack">
            {group.rows.map((row) => (
              <SettingField key={row.key} row={row} form={form} />
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function SettingField({ row, form }: { row: SettingRow; form: ConfigFormModel }) {
  const draft = form.draftFor(row);
  const dirty = draft !== row.draftText;
  const parsed = parseDraft(row.editKind, draft);
  const busy = form.savingKey === row.key;
  const disabled = !form.canEdit || row.locked || busy;
  const message = form.settingError?.key === row.key ? form.settingError.message : undefined;
  const onChange = (value: string) => form.setDraft(row.key, value);
  const fieldError = dirty && !parsed.ok ? parsed.message : undefined;

  return (
    <form
      className="a-stack"
      onSubmit={(event) => {
        event.preventDefault();
        void form.saveSetting(row);
      }}
    >
      <div className="a-row">
        <Badge tone={SOURCE_TONES[row.source]}>{row.sourceLabel}</Badge>
        {row.locked && <Badge tone="warning">Dikunci variabel lingkungan</Badge>}
        <span className="a-muted">
          Versi {row.version} · diubah {row.updatedLabel}
        </span>
      </div>
      <Field label={<span className="a-mono">{row.key}</span>} error={fieldError ?? message}>
        {(props) => {
          if (row.editKind === "bool") {
            return (
              <Checkbox
                id={props.id}
                label={draft === "true" ? "Aktif (true)" : "Nonaktif (false)"}
                checked={draft === "true"}
                disabled={disabled}
                onChange={(event) => onChange(event.target.checked ? "true" : "false")}
              />
            );
          }
          if (row.editKind === "json") {
            return (
              <Textarea
                {...props}
                rows={4}
                className="a-mono"
                value={draft}
                disabled={disabled}
                onChange={(event) => onChange(event.target.value)}
              />
            );
          }
          return (
            <Input
              {...props}
              type={row.editKind === "number" ? "number" : "text"}
              value={draft}
              disabled={disabled}
              onChange={(event) => onChange(event.target.value)}
            />
          );
        }}
      </Field>
      {form.conflictKey === row.key && (
        <Alert tone="warning" title="Nilai berubah di tempat lain">
          Nilai terbaru sudah dimuat. Periksa lalu simpan lagi.
        </Alert>
      )}
      <div>
        <Button
          type="submit"
          variant="secondary"
          size="sm"
          disabled={disabled || !dirty || !parsed.ok}
          loading={busy}
          loadingLabel="Menyimpan…"
        >
          Simpan
        </Button>
      </div>
    </form>
  );
}

/** Write-only secrets. The input is cleared as soon as the form is submitted, and no value is ever shown back. */
export function SecretFields({ form }: { form: ConfigFormModel }) {
  if (form.secrets.length === 0) return null;
  return (
    <Card>
      <CardHeader
        title="Rahasia"
        description="Tulis-saja. Nilai tidak pernah ditampilkan lagi; yang terlihat hanya status terisi."
      />
      <CardContent className="a-stack">
        {form.secrets.map((secret) => (
          <SecretForm key={secret.key} secret={secret} form={form} />
        ))}
      </CardContent>
    </Card>
  );
}

function SecretForm({ secret, form }: { secret: SecretRow; form: ConfigFormModel }) {
  const busy = form.secretBusy === secret.key;
  const status = secret.filled ? "Terisi" : "Belum diisi";
  return (
    <form
      className="a-stack"
      onSubmit={(event) => {
        event.preventDefault();
        const element = event.currentTarget;
        const data = new FormData(element);
        // Clear the DOM value at once; the hook keeps the value only for the request and one retry.
        element.reset();
        void form.saveSecret(secret.key, data);
      }}
    >
      <Field
        label={<span className="a-mono">{secret.key}</span>}
        hint={`${status} · versi ${secret.version}`}
      >
        {(props) => (
          <Input
            {...props}
            name="value"
            type="password"
            autoComplete="new-password"
            required
            maxLength={4096}
            disabled={!form.canSecrets || busy}
          />
        )}
      </Field>
      {form.secretError?.key === secret.key && (
        <Alert tone="danger" title="Rahasia gagal disimpan">
          {form.secretError.message}
        </Alert>
      )}
      <div>
        <Button
          type="submit"
          variant="secondary"
          disabled={!form.canSecrets}
          loading={busy}
          loadingLabel="Menyimpan…"
        >
          Simpan rahasia
        </Button>
      </div>
    </form>
  );
}

/** Asks for the password again when a secret write needs a fresh confirmation. The password is not stored. */
export function ReauthDialog({ form }: { form: ConfigFormModel }) {
  const { reauth } = form;
  return (
    <Dialog
      open={reauth.open}
      onOpenChange={(open) => {
        if (!open) reauth.cancel();
      }}
    >
      <DialogContent
        title="Konfirmasi kata sandi"
        description="Menulis rahasia butuh konfirmasi kata sandi yang baru. Rahasia yang tertunda dikirim setelah konfirmasi berhasil."
        busy={reauth.busy}
      >
        <form
          className="a-stack"
          onSubmit={(event) => {
            event.preventDefault();
            const element = event.currentTarget;
            const password = String(new FormData(element).get("password") ?? "");
            element.reset();
            void reauth.submit(password);
          }}
        >
          <Field label="Kata sandi" error={reauth.error ?? undefined}>
            {(props) => (
              <Input
                {...props}
                name="password"
                type="password"
                autoComplete="current-password"
                required
                disabled={reauth.busy}
              />
            )}
          </Field>
          <div className="a-row">
            <Button type="button" variant="ghost" onClick={reauth.cancel} disabled={reauth.busy}>
              Batal
            </Button>
            <Button type="submit" loading={reauth.busy} loadingLabel="Memeriksa…">
              Konfirmasi
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

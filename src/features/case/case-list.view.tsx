"use client";
import { Alert, Button, Card, CardContent, CardHeader, Field, Input, PageHeader } from "@astria/ui";
import { CASE_ID_HINT } from "./case.mapper";
import { useCaseLookup } from "./use-case-lookup.hook";

/** The api has no case list endpoint, so this screen opens a case by its ID instead of listing cases. */
export function CaseListView() {
  const lookup = useCaseLookup();
  return (
    <>
      <PageHeader title="Kasus DFIR" description="Penyelidikan dan tindak lanjut insiden" />
      <div className="a-stack">
        <Alert tone="info" title="Daftar kasus belum tersedia">
          Kasus dibuka dari detail kartu lewat "Minta analisis DFIR". Layanan belum menyediakan daftar semua
          kasus, jadi buka kasus dengan ID-nya di bawah.
        </Alert>
        <Card>
          <CardHeader
            title="Buka kasus menurut ID"
            description="Masukkan ID kasus yang Anda terima dari detail kartu."
          />
          <CardContent>
            <form
              className="a-stack"
              noValidate
              onSubmit={(event) => {
                event.preventDefault();
                lookup.submit();
              }}
            >
              <Field label="ID kasus" hint={CASE_ID_HINT} error={lookup.error || undefined}>
                {(props) => (
                  <Input
                    {...props}
                    value={lookup.value}
                    onChange={(event) => lookup.setValue(event.target.value)}
                    placeholder="CS-20261112-001"
                    autoComplete="off"
                    spellCheck={false}
                  />
                )}
              </Field>
              <div>
                <Button type="submit">Buka kasus</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

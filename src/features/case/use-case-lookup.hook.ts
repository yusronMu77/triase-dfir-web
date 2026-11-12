"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CASE_ID_HINT, isCaseId } from "./case.mapper";

/** "Buka kasus menurut ID": there is no case list endpoint, so an analyst opens a case by its ID. */
export function useCaseLookup() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState("");

  const submit = () => {
    const id = value.trim().toUpperCase();
    if (!isCaseId(id)) {
      setError(CASE_ID_HINT);
      return;
    }
    setError("");
    router.push(`/cases/${id}`);
  };

  return {
    value,
    error,
    setValue: (next: string) => {
      setValue(next);
      if (error) setError("");
    },
    submit,
  };
}

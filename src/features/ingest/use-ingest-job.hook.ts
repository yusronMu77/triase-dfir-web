"use client";
import { type UploadState, validateUpload } from "@astria/ui";
import { useCallback, useEffect, useRef, useState } from "react";
import { pause } from "../../lib/pause";

/** Local simulation of an upload job. The real job runs in the ingest service. */
export function useIngestJob(stepMs = 600) {
  const [state, setState] = useState<UploadState>("idle");
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState("");
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  const select = useCallback((next: File) => {
    const problem = validateUpload(next);
    setFile(next);
    setProgress(0);
    setSummary("");
    setError(problem);
    setState(problem ? "error" : "ready");
  }, []);
  const submit = useCallback(async () => {
    if (!file) return;
    setState("uploading");
    for (const step of [15, 65, 100]) {
      setProgress(step);
      await pause(stepMs);
      if (!alive.current) return;
    }
    setSummary(`${file.name} diterima untuk triase (pratinjau lokal, tidak dikirim ke layanan).`);
    setState("success");
  }, [file, stepMs]);
  const reset = useCallback(() => {
    setFile(null);
    setProgress(0);
    setError("");
    setSummary("");
    setState("idle");
  }, []);
  return { state, file, progress, error, summary, select, submit, reset };
}

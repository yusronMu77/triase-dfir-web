"use client";
import { type Role, type UploadState, useToast } from "@astria/ui";
import { useState } from "react";
import { pause } from "../../lib/pause";

/** State and simulated actions for the developer component gallery. Nothing leaves the page. */
export function useShowcase() {
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
    await pause(700);
    if (error) throw new Error("Contoh kegagalan layanan. Data belum disimpan.");
    toast({ title: "Pratinjau berhasil", description: "Perubahan contoh hanya berlaku pada halaman ini." });
  }
  async function upload() {
    setUploadState("uploading");
    setProgress(15);
    await pause(700);
    setProgress(65);
    await pause(700);
    setProgress(100);
    setUploadState(error ? "error" : "success");
  }
  return {
    toast,
    busy,
    setBusy,
    error,
    setError,
    uploadState,
    setUploadState,
    file,
    setFile,
    progress,
    setProgress,
    role,
    setRole,
    messages,
    setMessages,
    expiry,
    setExpiry,
    tab,
    setTab,
    save,
    upload,
  };
}

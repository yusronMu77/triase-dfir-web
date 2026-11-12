"use client";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { login } from "../../lib/auth-api";

export function validateLogin(username: string, password: string) {
  if (!username.trim()) return "Isi nama pengguna.";
  if (!password) return "Isi kata sandi.";
  if ([...username.trim()].length > 128 || [...password].length > 256) {
    return "Nama pengguna maksimal 128 karakter dan kata sandi maksimal 256 karakter.";
  }
  return "";
}

export function useLogin() {
  const router = useRouter();
  const client = useQueryClient();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [signedIn, setSignedIn] = useState(false);
  const submitting = useRef(false);
  const submit = useCallback(
    async (data: FormData) => {
      if (submitting.current) return;
      const username = String(data.get("username") ?? "").trim();
      const password = String(data.get("password") ?? "");
      const problem = validateLogin(username, password);
      setError(problem);
      if (problem) return;
      submitting.current = true;
      setPending(true);
      try {
        const { user } = await login(username, password);
        client.clear(); // A new session must not show data cached for the previous user.
        setSignedIn(true);
        router.replace(user.roles.length === 1 && user.roles[0] === "pimpinan" ? "/digests" : "/");
        router.refresh();
        // Keep controls locked until navigation completes; a second login would create another session.
      } catch (error) {
        setError(error instanceof Error ? error.message : "Gagal masuk. Silakan coba lagi.");
        submitting.current = false;
        setPending(false);
      }
    },
    [router, client],
  );
  return { submit, pending, error, signedIn };
}

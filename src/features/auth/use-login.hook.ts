"use client";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { pause } from "../../lib/pause";

export function validateLogin(username: string, password: string) {
  if (!username.trim()) return "Isi nama pengguna.";
  if (!password) return "Isi kata sandi.";
  return "";
}

/** Local preview only: credentials are never sent or checked. Real sign-in belongs to the identity service. */
export function useLogin() {
  const router = useRouter();
  const submit = useCallback(
    async (data: FormData) => {
      const problem = validateLogin(String(data.get("username") ?? ""), String(data.get("password") ?? ""));
      if (problem) throw new Error(problem);
      await pause(500);
      router.push("/");
    },
    [router],
  );
  return { submit };
}

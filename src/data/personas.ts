import type { Role } from "@astria/ui";

/** Sample identities for the local preview. No real accounts or credentials. */
export const personas: Record<Role, { name: string; subtitle: string }> = {
  analis: { name: "Rizky Aditya", subtitle: "Analis L1" },
  dfir: { name: "Nadia Putri", subtitle: "Analis DFIR L2" },
  pimpinan: { name: "Bagus Santoso", subtitle: "Pimpinan" },
  admin: { name: "Dimas Saputra", subtitle: "Administrator" },
};

export const roleOptions: { value: Role; label: string }[] = [
  { value: "analis", label: "Analis L1" },
  { value: "dfir", label: "Analis DFIR L2" },
  { value: "pimpinan", label: "Pimpinan" },
  { value: "admin", label: "Administrator" },
];

export const isRole = (value: string): value is Role => roleOptions.some((option) => option.value === value);

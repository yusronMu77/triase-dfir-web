import { LoginView } from "../../../features/auth/login.view";

export default async function Page({ searchParams }: { searchParams: Promise<{ reason?: string }> }) {
  const { reason } = await searchParams;
  return <LoginView sessionExpired={reason === "session-expired"} />;
}

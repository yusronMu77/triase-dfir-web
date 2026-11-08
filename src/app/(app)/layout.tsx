import type { ReactNode } from "react";
import { AnalystLayout } from "../../features/shell/analyst.layout";

export default function Layout({ children }: { children: ReactNode }) {
  return <AnalystLayout>{children}</AnalystLayout>;
}

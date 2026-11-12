"use client";
import { AstriaMascot, Icon, Logo } from "@astria/ui";
import type { ReactNode } from "react";

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="web-auth" id="main-content">
      <aside className="web-auth-intro" aria-label="Tentang Astria">
        {/* The SVG canvas includes clear space; Penpot uses the artwork's tight view box. */}
        <Logo reverse src="/astria-logo-reverse.svg#svgView(viewBox(116,62,760.96875,176))" />
        <AstriaMascot expression="welcome" framing="full" />
        <h2>Triase insiden yang setiap klaimnya menunjuk bukti.</h2>
        <ul>
          <li>
            <Icon name="check" size={24} />
            Skor dan keputusan dihitung kode, bukan model.
          </li>
          <li>
            <Icon name="check" size={24} />
            Narasi model hanya lolos bila tiap klaim punya ID bukti.
          </li>
          <li>
            <Icon name="check" size={24} />
            Setiap login dan perubahan tercatat di audit berantai hash.
          </li>
        </ul>
        <small>Kartika Cyber Hackathon 2026 · versi demo</small>
      </aside>
      <div className="web-auth-body">
        <header className="web-auth-mobile-brand">
          <div>
            <Logo src="/astria-logo.svg#svgView(viewBox(116,62,760.96875,176))" />
            <p>Pendamping analisis bukti.</p>
          </div>
          <AstriaMascot expression="waiting" framing="half" />
        </header>
        {children}
      </div>
    </main>
  );
}

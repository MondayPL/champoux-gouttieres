"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/suivi", label: "Suivi 2026" },
  { href: "/compte-rendu", label: "Compte rendu" },
  { href: "/couleurs", label: "Couleurs" },
  { href: "/reparations", label: "Réparations" },
  { href: "/villes", label: "Villes" },
  { href: "/calendrier", label: "Calendrier" },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-3 py-2.5 sm:px-4">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 font-semibold text-slate-900"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-600 text-sm text-white">
            CG
          </span>
          <span className="hidden md:inline">Champoux Gouttières</span>
        </Link>
        <nav className="flex max-w-full items-center gap-0.5 overflow-x-auto text-sm">
          {links.map((l) => {
            const active =
              pathname === l.href || pathname.startsWith(l.href + "/");
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`whitespace-nowrap rounded-lg px-2.5 py-2 font-medium transition sm:px-3 ${
                  active
                    ? "bg-sky-50 text-sky-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

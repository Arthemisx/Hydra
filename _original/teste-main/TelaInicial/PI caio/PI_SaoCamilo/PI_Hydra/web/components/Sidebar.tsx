"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";

interface SidebarProps {
  open: boolean;
}

export default function Sidebar({ open }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const isActive = (path: string) => pathname === path ? "active" : "";

  return (
    <aside className={`sidebar ${open ? "open" : ""}`}>
      <ul className="sidebar-nav">
        {user?.role === "athlete" && (
          <>
            <li>
              <Link href="/dashboard" className={isActive("/dashboard")}>
                Registro Diario
              </Link>
            </li>
            <li>
              <Link href="/session/new" className={isActive("/session/new")}>
                Nova Sessao
              </Link>
            </li>
          </>
        )}
        {user?.role === "team" && (
          <>
            <li>
              <Link href="/dashboard" className={isActive("/dashboard")}>
                Painel
              </Link>
            </li>
          </>
        )}
        <div className="sidebar-divider" />
        <li>
          <Link href="/profile" className={isActive("/profile")}>
            Perfil
          </Link>
        </li>
        <li>
          <Link href="/dashboard" className={isActive("/relatorio")}>
            Relatorio
          </Link>
        </li>
        <div className="sidebar-divider" />
        <li>
          <button onClick={() => { logout(); window.location.href = "/login"; }}>
            Sair
          </button>
        </li>
      </ul>
    </aside>
  );
}

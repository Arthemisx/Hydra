"use client";

import { useAuth } from "@/lib/auth";

interface HeaderProps {
  onToggleSidebar?: () => void;
}

export default function Header({ onToggleSidebar }: HeaderProps) {
  const { user } = useAuth();

  return (
    <header className="header">
      <div className="header-logo">
        {onToggleSidebar && (
          <button className="hamburger" onClick={onToggleSidebar}>
            &#9776;
          </button>
        )}
        <h1>Hydra</h1>
      </div>
      {user && (
        <div className="header-user">
          <span>{user.name}</span>
          <span className={`badge badge-${user.role === "team" ? "caution" : "normal"}`}>
            {user.role === "team" ? "Equipe" : "Atleta"}
          </span>
        </div>
      )}
    </header>
  );
}

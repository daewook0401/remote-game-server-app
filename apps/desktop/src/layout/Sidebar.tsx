import { BookOpen, Container, Server, TerminalSquare, Wifi } from "lucide-react";
import type { AppRoute } from "../types/navigation";

const navItems = [
  { label: "서버 관리", icon: Container, route: "servers" },
  { label: "콘솔", icon: TerminalSquare, route: "console" },
  { label: "외부 공개", icon: Wifi, route: "publish" },
  { label: "안내 가이드", icon: BookOpen, route: "guides" }
] satisfies Array<{ label: string; icon: typeof Container; route: AppRoute }>;

interface SidebarProps {
  activeRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
}

export function Sidebar({ activeRoute, onNavigate }: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <Server aria-hidden="true" />
        <span>Remote Game Server</span>
      </div>
      <nav className="nav" aria-label="주요 메뉴">
        {navItems.map(({ label, icon: Icon, route }) => (
          <button
            className={activeRoute === route ? "navItem active" : "navItem"}
            key={label}
            onClick={() => onNavigate(route)}
            type="button"
          >
            <Icon aria-hidden="true" />
            {label}
          </button>
        ))}
      </nav>
    </aside>
  );
}

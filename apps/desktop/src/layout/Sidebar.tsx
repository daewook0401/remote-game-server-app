import { BookOpen, Gamepad2 } from "lucide-react";
import type { AppRoute } from "../types/navigation";

const navItems = [
  { label: "내 서버", icon: Gamepad2, route: "servers" },
  { label: "도움말", icon: BookOpen, route: "guides" }
] satisfies Array<{ label: string; icon: typeof Gamepad2; route: AppRoute }>;

interface SidebarProps {
  activeRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
}

export function Sidebar({ activeRoute, onNavigate }: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brandTitle">OpenServerHub</span>
        <span className="brandSub">게임 서버 관리</span>
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

import type { PropsWithChildren } from "react";
import { Sidebar } from "./Sidebar";
import type { AppRoute } from "../types/navigation";

interface AppShellProps extends PropsWithChildren {
  activeRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
}

export function AppShell({ activeRoute, children, onNavigate }: AppShellProps) {
  return (
    <main className="shell">
      <Sidebar activeRoute={activeRoute} onNavigate={onNavigate} />
      <section className="workspace">{children}</section>
    </main>
  );
}

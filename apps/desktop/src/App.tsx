import { useState } from "react";
import { AppShell } from "./layout/AppShell";
import { GuidesPage } from "./pages/GuidesPage";
import { ServerManagementPage } from "./pages/ServerManagementPage";
import type { AppRoute } from "./types/navigation";
import "./styles.css";

export default function App() {
  const [route, setRoute] = useState<AppRoute>("servers");

  return (
    <AppShell activeRoute={route} onNavigate={setRoute}>
      {route === "servers" ? <ServerManagementPage /> : null}
      {route === "guides" ? <GuidesPage /> : null}
    </AppShell>
  );
}

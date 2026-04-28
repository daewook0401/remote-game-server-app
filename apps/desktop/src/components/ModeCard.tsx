import type { ConnectionMode } from "../types/publish";

interface ModeCardProps {
  mode: ConnectionMode;
}

export function ModeCard({ mode }: ModeCardProps) {
  return (
    <article className="modeCard">
      <div className="modeHeader">
        <h2>{mode.title}</h2>
        <span>{mode.status}</span>
      </div>
      <p>{mode.description}</p>
    </article>
  );
}


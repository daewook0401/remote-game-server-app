import { CheckCircle2 } from "lucide-react";

interface StatusPanelProps {
  items: string[];
}

export function StatusPanel({ items }: StatusPanelProps) {
  return (
    <article className="panel">
      <div className="panelHeader">
        <h2>현재 상태</h2>
        <CheckCircle2 aria-hidden="true" className="statusIcon" />
      </div>
      <ul className="statusList">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </article>
  );
}


import type { ServerCreateReadiness } from "../types/server";

interface ServerCreateReadinessPanelProps {
  readiness: ServerCreateReadiness;
}

export function ServerCreateReadinessPanel({ readiness }: ServerCreateReadinessPanelProps) {
  return (
    <article className={readiness.canCreate ? "panel readinessPanel ready" : "panel readinessPanel"}>
      <div className="panelHeader">
        <h2>생성 전 확인</h2>
        <span className={readiness.canCreate ? "stateBadge connected" : "stateBadge setupRequired"}>
          {readiness.canCreate ? "준비됨" : "확인 필요"}
        </span>
      </div>
      <ul className="readinessList">
        {readiness.items.map((item) => (
          <li key={item.label}>
            <span className={item.ok ? "readinessDot ok" : "readinessDot"} />
            {item.label}
          </li>
        ))}
      </ul>
      <p className="helperText">{readiness.message}</p>
    </article>
  );
}

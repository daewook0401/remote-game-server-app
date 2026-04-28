import type { GameTemplate } from "../types/server";

interface TemplateCardProps {
  template: GameTemplate;
}

export function TemplateCard({ template }: TemplateCardProps) {
  return (
    <article className="panel templateCard">
      <div className="panelHeader">
        <h2>{template.name}</h2>
        <span className="stateBadge connected">{template.protocol.toUpperCase()}</span>
      </div>
      <dl className="detailList">
        <div>
          <dt>Docker image</dt>
          <dd>{template.image}</dd>
        </div>
        <div>
          <dt>기본 포트</dt>
          <dd>{template.defaultPort}</dd>
        </div>
      </dl>
      <button className="primaryButton fullWidthButton" type="button">
        서버 생성
      </button>
    </article>
  );
}


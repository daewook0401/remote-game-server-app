interface TopbarProps {
  title: string;
  description: string;
  actionLabel: string;
  secondaryActionLabel?: string;
  onAction: () => void;
  onSecondaryAction?: () => void;
}

export function Topbar({
  title,
  description,
  actionLabel,
  secondaryActionLabel,
  onAction,
  onSecondaryAction
}: TopbarProps) {
  return (
    <header className="topbar">
      <div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      <div className="actionGroup">
        {secondaryActionLabel && onSecondaryAction ? (
          <button className="secondaryButton" onClick={onSecondaryAction} type="button">
            {secondaryActionLabel}
          </button>
        ) : null}
        <button className="primaryButton" onClick={onAction} type="button">
          {actionLabel}
        </button>
      </div>
    </header>
  );
}

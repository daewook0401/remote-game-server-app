import type React from "react";

interface AppModalProps {
  children: React.ReactNode;
  onClose: () => void;
  title: string;
}

export function AppModal({ children, onClose, title }: AppModalProps) {
  return (
    <div className="modalOverlay" role="presentation">
      <section aria-modal="true" className="appModal" role="dialog">
        <div className="modalHeader">
          <h2>{title}</h2>
          <button aria-label="닫기" className="iconButton" onClick={onClose} type="button">
            X
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}

export interface ToastMessage {
  id: number;
  kind: "info" | "success" | "warning" | "error";
  text: string;
}

interface ToastViewportProps {
  messages: ToastMessage[];
  onDismiss: (id: number) => void;
}

export function ToastViewport({ messages, onDismiss }: ToastViewportProps) {
  return (
    <div className="toastViewport" aria-live="polite">
      {messages.map((message) => (
        <div className={`toastMessage ${message.kind}`} key={message.id}>
          <span>{message.text}</span>
          <button
            aria-label="알림 닫기"
            className="toastCloseButton"
            onClick={() => onDismiss(message.id)}
            type="button"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

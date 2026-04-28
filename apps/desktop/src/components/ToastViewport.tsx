export interface ToastMessage {
  id: number;
  kind: "info" | "success" | "warning" | "error";
  text: string;
}

interface ToastViewportProps {
  messages: ToastMessage[];
}

export function ToastViewport({ messages }: ToastViewportProps) {
  return (
    <div className="toastViewport" aria-live="polite">
      {messages.map((message) => (
        <div className={`toastMessage ${message.kind}`} key={message.id}>
          {message.text}
        </div>
      ))}
    </div>
  );
}

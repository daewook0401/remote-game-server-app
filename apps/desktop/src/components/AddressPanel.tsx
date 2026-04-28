import { Copy } from "lucide-react";

interface AddressPanelProps {
  address: string;
}

export function AddressPanel({ address }: AddressPanelProps) {
  return (
    <article className="panel">
      <div className="panelHeader">
        <h2>접속 주소</h2>
        <button className="iconButton" type="button" aria-label="접속 주소 복사">
          <Copy aria-hidden="true" />
        </button>
      </div>
      <div className="addressBox">{address}</div>
    </article>
  );
}


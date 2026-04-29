import { AppModal } from "./AppModal";

interface AgentUpdateModalProps {
  password: string;
  onChangePassword: (password: string) => void;
  onClose: () => void;
  onConfirm: () => void;
}

export function AgentUpdateModal({ password, onChangePassword, onClose, onConfirm }: AgentUpdateModalProps) {
  return (
    <AppModal onClose={onClose} title="Agent 업데이트">
      <p className="helperText">
        저장된 SSH 서버에 접속해 기존 Agent를 중지하고 새 Agent로 교체합니다. 게임 서버 정보 파일은 유지됩니다.
      </p>
      <label className="fieldGroup">
        <span>SSH password</span>
        <input
          autoFocus
          className="textInput"
          onChange={(event) => onChangePassword(event.target.value)}
          type="password"
          value={password}
        />
      </label>
      <div className="modalActions">
        <button className="secondaryButton" onClick={onClose} type="button">
          취소
        </button>
        <button className="primaryButton" onClick={onConfirm} type="button">
          업데이트
        </button>
      </div>
    </AppModal>
  );
}

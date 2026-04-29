import type { ManagedServer, ServerCreateForm } from "../types/server";
import { AppModal } from "./AppModal";

interface CreateServerConfirmModalProps {
  activeServer?: ManagedServer;
  form: ServerCreateForm;
  sudoPassword: string;
  volumePath: string;
  onChangeSudoPassword: (password: string) => void;
  onClose: () => void;
  onConfirm: () => void;
}

export function CreateServerConfirmModal({
  activeServer,
  form,
  sudoPassword,
  volumePath,
  onChangeSudoPassword,
  onClose,
  onConfirm
}: CreateServerConfirmModalProps) {
  return (
    <AppModal onClose={onClose} title="게임 서버 생성">
      <p className="helperText">
        Docker 컨테이너를 만들고 외부 공개 포트 {form.externalPort}/tcp를 엽니다. 원격 서버에서는 sudo 권한이 필요하며
        입력한 SSH 비밀번호는 이번 작업에만 사용하고 저장하지 않습니다.
      </p>
      <dl className="detailList">
        <div>
          <dt>게임</dt>
          <dd>{form.gameTemplateId === "minecraft-java" ? "Minecraft Java" : form.gameTemplateId}</dd>
        </div>
        <div>
          <dt>포트</dt>
          <dd>{form.externalPort} {"->"} {form.internalPort}</dd>
        </div>
        <div>
          <dt>볼륨</dt>
          <dd>{volumePath}</dd>
        </div>
      </dl>
      {activeServer?.targetType !== "local" ? (
        <label className="fieldGroup">
          <span>SSH password</span>
          <input
            autoFocus
            className="textInput"
            onChange={(event) => onChangeSudoPassword(event.target.value)}
            type="password"
            value={sudoPassword}
          />
        </label>
      ) : null}
      <div className="modalActions">
        <button className="secondaryButton" onClick={onClose} type="button">
          취소
        </button>
        <button className="primaryButton" onClick={onConfirm} type="button">
          생성
        </button>
      </div>
    </AppModal>
  );
}

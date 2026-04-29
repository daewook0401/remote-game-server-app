import type { ManagedServer } from "../types/server";
import { AppModal } from "./AppModal";

export type ServerDeleteTarget = {
  server: ManagedServer;
  deleteRemoteAgent: boolean;
  closeAgentFirewallPort: boolean;
  sshPassword: string;
  haproxyPassword: string;
  confirmation: string;
  lastError?: string;
};

interface ServerDeleteModalProps {
  target: ServerDeleteTarget;
  onChange: (target: ServerDeleteTarget) => void;
  onClose: () => void;
  onConfirm: () => void;
}

export function ServerDeleteModal({ target, onChange, onClose, onConfirm }: ServerDeleteModalProps) {
  return (
    <AppModal onClose={onClose} title="서버 삭제">
      <p className="helperText">
        서버 등록 정보를 삭제하기 전에 원격 서버에 설치된 Agent와 관리 포트를 함께 정리할 수 있습니다.
      </p>
      <dl className="detailList">
        <div>
          <dt>서버</dt>
          <dd>{target.server.name}</dd>
        </div>
        <div>
          <dt>접속 대상</dt>
          <dd>{target.server.host}</dd>
        </div>
      </dl>
      <label className="checkRow">
        <input
          checked={!target.deleteRemoteAgent}
          onChange={() =>
            onChange({
              ...target,
              deleteRemoteAgent: false,
              closeAgentFirewallPort: false,
              lastError: undefined
            })
          }
          type="radio"
        />
        앱 등록 정보만 삭제
      </label>
      <label className="checkRow">
        <input
          checked={target.deleteRemoteAgent}
          onChange={() =>
            onChange({
              ...target,
              deleteRemoteAgent: true,
              closeAgentFirewallPort: true,
              lastError: undefined
            })
          }
          type="radio"
        />
        원격 Agent와 데이터까지 삭제
      </label>
      {target.deleteRemoteAgent ? (
        <div className="dangerChoice">
          <strong>원격 Agent 서비스와 /opt/remote-game-agent 데이터가 삭제됩니다.</strong>
          <label className="checkRow">
            <input
              checked={target.closeAgentFirewallPort}
              onChange={(event) =>
                onChange({
                  ...target,
                  closeAgentFirewallPort: event.target.checked,
                  lastError: undefined
                })
              }
              type="checkbox"
            />
            서버 내부 방화벽의 18080/tcp 허용 규칙도 삭제
          </label>
          {target.server.sshAuthMethod === "password" ? (
            <label className="fieldGroup">
              <span>내부망 서버 SSH password</span>
              <input
                autoFocus
                className="textInput"
                onChange={(event) =>
                  onChange({
                    ...target,
                    sshPassword: event.target.value,
                    lastError: undefined
                  })
                }
                type="password"
                value={target.sshPassword}
              />
            </label>
          ) : null}
          {target.server.connectionMode === "jumpSsh" && target.server.haproxyAuthMethod === "password" ? (
            <label className="fieldGroup">
              <span>경유 서버 HAProxy SSH password</span>
              <input
                className="textInput"
                onChange={(event) =>
                  onChange({
                    ...target,
                    haproxyPassword: event.target.value,
                    lastError: undefined
                  })
                }
                type="password"
                value={target.haproxyPassword}
              />
            </label>
          ) : null}
          <span>클라우드 보안 그룹이나 공유기 포트포워딩의 18080 규칙은 별도로 확인해야 할 수 있습니다.</span>
        </div>
      ) : null}
      <div className="dangerChoice">
        <strong>계속하려면 서버 이름 `{target.server.name}`을 그대로 입력하세요.</strong>
        <input
          className="textInput"
          onChange={(event) =>
            onChange({
              ...target,
              confirmation: event.target.value,
              lastError: undefined
            })
          }
          value={target.confirmation}
        />
      </div>
      {target.lastError ? <div className="noticeBar error">{target.lastError}</div> : null}
      <div className="modalActions">
        <button className="secondaryButton" onClick={onClose} type="button">
          취소
        </button>
        <button className="secondaryButton warningButton" onClick={onConfirm} type="button">
          삭제
        </button>
      </div>
    </AppModal>
  );
}

import type { ContainerSummary, ManagedServer } from "../types/server";
import { AppModal } from "./AppModal";

export type ContainerDeleteTarget = {
  container: ContainerSummary;
  server?: ManagedServer;
  step: "scope" | "firewall";
  deleteData: boolean;
  confirmation: string;
  firewallMode: "keep" | "deleteAllow" | "deny";
  firewallPassword: string;
  haproxyPassword: string;
};

interface ContainerDeleteModalProps {
  target: ContainerDeleteTarget;
  onChange: (target: ContainerDeleteTarget) => void;
  onClose: () => void;
  onBack: () => void;
  onNext: () => void;
  onConfirm: () => void;
}

export function ContainerDeleteModal({ target, onChange, onClose, onBack, onNext, onConfirm }: ContainerDeleteModalProps) {
  return (
    <AppModal
      onClose={onClose}
      title={target.step === "scope" ? "게임 서버 삭제" : "포트 정리"}
    >
      {target.step === "scope" ? (
        <>
          <p className="helperText">
            먼저 삭제 범위를 선택하세요. 컨테이너만 삭제하면 맵 데이터와 설정 파일은 서버 볼륨에 남습니다.
          </p>
          <label className="checkRow">
            <input
              checked={!target.deleteData}
              onChange={() => onChange({ ...target, deleteData: false, confirmation: "" })}
              type="radio"
            />
            컨테이너만 삭제하고 맵 데이터는 유지
          </label>
          <label className="checkRow">
            <input
              checked={target.deleteData}
              onChange={() => onChange({ ...target, deleteData: true })}
              type="radio"
            />
            전체 데이터 삭제
          </label>
          {target.deleteData ? (
            <div className="dangerChoice">
              <strong>맵 데이터, 설정, 로그가 모두 사라집니다.</strong>
              <span>계속하려면 서버 이름 `{target.container.name}`을 그대로 입력하세요.</span>
              <input
                className="textInput"
                onChange={(event) => onChange({ ...target, confirmation: event.target.value })}
                value={target.confirmation}
              />
            </div>
          ) : null}
          <div className="modalActions">
            <button className="secondaryButton" onClick={onClose} type="button">
              취소
            </button>
            <button className="primaryButton" onClick={onNext} type="button">
              다음
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="helperText">
            마지막으로 게임 포트 방화벽 규칙을 어떻게 처리할지 선택하세요. 외부망 HAProxy 경유 서버는 게임 포트 라우트도 함께 정리합니다.
          </p>
          <div className="dangerChoice">
            <strong>방화벽 포트 정리</strong>
            <label className="checkRow">
              <input
                checked={target.firewallMode === "keep"}
                onChange={() => onChange({ ...target, firewallMode: "keep", firewallPassword: "" })}
                type="radio"
              />
              방화벽은 그대로 둠
            </label>
            <label className="checkRow">
              <input
                checked={target.firewallMode === "deleteAllow"}
                onChange={() => onChange({ ...target, firewallMode: "deleteAllow" })}
                type="radio"
              />
              열어둔 허용 규칙 삭제
            </label>
            <label className="checkRow">
              <input
                checked={target.firewallMode === "deny"}
                onChange={() => onChange({ ...target, firewallMode: "deny" })}
                type="radio"
              />
              차단 규칙 추가
            </label>
            {target.firewallMode !== "keep" ? (
              <label className="fieldGroup">
                <span>내부망 서버 SSH password</span>
                <input
                  autoFocus
                  className="textInput"
                  onChange={(event) => onChange({ ...target, firewallPassword: event.target.value })}
                  type="password"
                  value={target.firewallPassword}
                />
              </label>
            ) : null}
            {target.server?.connectionMode === "jumpSsh" && target.server.haproxyAuthMethod === "password" ? (
              <label className="fieldGroup">
                <span>경유 서버 HAProxy SSH/sudo password</span>
                <input
                  className="textInput"
                  onChange={(event) => onChange({ ...target, haproxyPassword: event.target.value })}
                  type="password"
                  value={target.haproxyPassword}
                />
              </label>
            ) : null}
          </div>
          <div className="modalActions">
            <button className="secondaryButton" onClick={onBack} type="button">
              이전
            </button>
            <button className="secondaryButton warningButton" onClick={onConfirm} type="button">
              삭제
            </button>
          </div>
        </>
      )}
    </AppModal>
  );
}

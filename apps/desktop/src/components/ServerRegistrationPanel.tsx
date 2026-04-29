import type { ServerConnectionMode, ServerOsType, ServerRegistrationForm, ServerTargetType } from "../types/server";

interface ServerRegistrationPanelProps {
  form: ServerRegistrationForm;
  isFirewallConfirming: boolean;
  pendingAction?: "ssh" | "agent" | "firewall" | "register";
  onChange: (form: ServerRegistrationForm) => void;
  onOpenFirewallPort: () => void;
  onUpdateAgent: () => void;
  onPrepareAgent: () => void;
  onSubmit: () => void;
  onTestSSH: () => void;
}

const targetOptions: Array<{ label: string; value: ServerTargetType }> = [
  { label: "지금 PC", value: "local" },
  { label: "SSH 서버", value: "remote" },
  { label: "클라우드 서버", value: "cloud" }
];

const osOptions: Array<{ label: string; value: ServerOsType }> = [
  { label: "Linux / Ubuntu", value: "linux-ubuntu" },
  { label: "Windows", value: "windows" },
  { label: "macOS", value: "macos" },
  { label: "Linux / Fedora", value: "linux-fedora" },
  { label: "Linux / Arch", value: "linux-arch" },
  { label: "Linux / 기타", value: "linux" }
];

const connectionModeOptions: Array<{ label: string; value: ServerConnectionMode }> = [
  { label: "직접 SSH 연결", value: "directSsh" },
  { label: "외부망 HAProxy 경유", value: "jumpSsh" },
  { label: "직접 공개 예외", value: "directPublic" }
];

export function ServerRegistrationPanel({
  form,
  isFirewallConfirming,
  pendingAction,
  onChange,
  onOpenFirewallPort,
  onUpdateAgent,
  onPrepareAgent,
  onSubmit,
  onTestSSH
}: ServerRegistrationPanelProps) {
  function update<T extends keyof ServerRegistrationForm>(key: T, value: ServerRegistrationForm[T]) {
    onChange({ ...form, [key]: value });
  }

  const needsSSH = form.targetType !== "local";
  const usesHaproxyRelay = needsSSH && form.connectionMode === "jumpSsh";
  const derivedAgentUrl = needsSSH;
  const isPending = Boolean(pendingAction);

  return (
    <article className="panel widePanel">
      <div className="panelHeader">
        <h2>서버 등록</h2>
      </div>

      <div className="formGrid">
        <label className="fieldGroup">
          <span>이름</span>
          <input
            className="textInput"
            onChange={(event) => update("name", event.target.value)}
            value={form.name}
          />
        </label>

        <label className="fieldGroup">
          <span>서버 유형</span>
          <select
            className="textInput"
            onChange={(event) => update("targetType", event.target.value as ServerTargetType)}
            value={form.targetType}
          >
            {targetOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="fieldGroup">
          <span>운영체제</span>
          <select
            className="textInput"
            onChange={(event) => update("osType", event.target.value as ServerOsType)}
            value={form.osType}
          >
            {osOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        {needsSSH ? (
          <label className="fieldGroup">
            <span>접속 경로</span>
            <select
              className="textInput"
              onChange={(event) => update("connectionMode", event.target.value as ServerConnectionMode)}
              value={form.connectionMode}
            >
              {connectionModeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <label className="fieldGroup">
          <span>Agent URL</span>
          <input
            className={derivedAgentUrl ? "textInput readonlyInput" : "textInput"}
            onChange={(event) => update("agentBaseUrl", event.target.value)}
            placeholder="http://127.0.0.1:18080"
            readOnly={derivedAgentUrl}
            value={form.agentBaseUrl}
          />
        </label>

        <label className="fieldGroup">
          <span>Agent 인증</span>
          <input
            className={needsSSH ? "textInput readonlyInput" : "textInput"}
            onChange={(event) => update("agentToken", event.target.value)}
            placeholder={needsSSH ? "Agent 설치 시 자동 생성" : "AGENT_TOKEN"}
            readOnly={needsSSH}
            type={needsSSH ? "text" : "password"}
            value={needsSSH ? (form.agentToken ? "설정됨" : "") : form.agentToken}
          />
        </label>
        <label className="fieldGroup">
          <span>Agent 다운로드 URL</span>
          <input
            className="textInput"
            onChange={(event) => update("agentDownloadUrl", event.target.value)}
            placeholder="https://github.com/.../agent-linux-amd64"
            value={form.agentDownloadUrl}
          />
        </label>
      </div>

      {needsSSH ? (
        <div className="formGrid sshGrid">
          {usesHaproxyRelay ? (
            <>
              <label className="fieldGroup">
                <span>HAProxy SSH host</span>
                <input
                  className="textInput"
                  onChange={(event) => update("haproxyHost", event.target.value)}
                  placeholder="외부망 노트북 또는 점프 노드"
                  value={form.haproxyHost}
                />
              </label>
              <label className="fieldGroup">
                <span>HAProxy SSH port</span>
                <input
                  className="textInput"
                  onChange={(event) => update("haproxyPort", Number(event.target.value))}
                  type="number"
                  value={form.haproxyPort}
                />
              </label>
              <label className="fieldGroup">
                <span>HAProxy SSH user</span>
                <input
                  className="textInput"
                  onChange={(event) => update("haproxyUser", event.target.value)}
                  placeholder="relay-user"
                  value={form.haproxyUser}
                />
              </label>
              <label className="fieldGroup">
                <span>HAProxy 인증</span>
                <select
                  className="textInput"
                  onChange={(event) => update("haproxyAuthMethod", event.target.value as ServerRegistrationForm["haproxyAuthMethod"])}
                  value={form.haproxyAuthMethod}
                >
                  <option value="password">패스워드</option>
                  <option value="key">키 파일</option>
                </select>
              </label>
              {form.haproxyAuthMethod === "password" ? (
                <label className="fieldGroup">
                  <span>HAProxy SSH password</span>
                  <input
                    className="textInput"
                    onChange={(event) => update("haproxyPassword", event.target.value)}
                    type="password"
                    value={form.haproxyPassword}
                  />
                </label>
              ) : (
                <label className="fieldGroup">
                  <span>HAProxy SSH key path</span>
                  <input
                    className="textInput"
                    onChange={(event) => update("haproxyKeyPath", event.target.value)}
                    placeholder="C:\\Users\\me\\.ssh\\id_rsa"
                    value={form.haproxyKeyPath}
                  />
                </label>
              )}
              <label className="fieldGroup">
                <span>허용 IP/CIDR</span>
                <input
                  className="textInput"
                  onChange={(event) => update("haproxyAllowedCidrs", event.target.value)}
                  placeholder="비우면 전체 허용, 제한 시 내 공인 IP/32"
                  value={form.haproxyAllowedCidrs}
                />
              </label>
              <label className="fieldGroup">
                <span>Agent proxy port</span>
                <input
                  className="textInput"
                  onChange={(event) => update("haproxyAgentProxyPort", Number(event.target.value))}
                  type="number"
                  value={form.haproxyAgentProxyPort}
                />
              </label>
            </>
          ) : null}
          <label className="fieldGroup">
            <span>SSH 인증</span>
            <select
              className="textInput"
              onChange={(event) => update("sshAuthMethod", event.target.value as ServerRegistrationForm["sshAuthMethod"])}
              value={form.sshAuthMethod}
            >
              <option value="password">패스워드</option>
              <option value="key">키 파일</option>
            </select>
          </label>
          <label className="fieldGroup">
            <span>SSH host</span>
            <input
              className="textInput"
              onChange={(event) => update("sshHost", event.target.value)}
              placeholder="203.0.113.10"
              value={form.sshHost}
            />
          </label>
          <label className="fieldGroup">
            <span>SSH port</span>
            <input
              className="textInput"
              onChange={(event) => update("sshPort", Number(event.target.value))}
              type="number"
              value={form.sshPort}
            />
          </label>
          <label className="fieldGroup">
            <span>SSH user</span>
            <input
              className="textInput"
              onChange={(event) => update("sshUser", event.target.value)}
              placeholder="ec2-user"
              value={form.sshUser}
            />
          </label>
          {form.sshAuthMethod === "password" ? (
            <label className="fieldGroup">
              <span>SSH password</span>
              <input
                className="textInput"
                onChange={(event) => update("sshPassword", event.target.value)}
                placeholder="접속 테스트에만 사용"
                type="password"
                value={form.sshPassword}
              />
            </label>
          ) : (
            <label className="fieldGroup">
              <span>SSH key path</span>
              <input
                className="textInput"
                onChange={(event) => update("sshKeyPath", event.target.value)}
                placeholder="C:\\Users\\me\\.ssh\\id_rsa"
                value={form.sshKeyPath}
              />
            </label>
          )}
        </div>
      ) : null}

      <div className="formActions">
        {needsSSH ? (
          <>
            <button className="secondaryButton fullWidthButton" disabled={isPending} onClick={() => onTestSSH()} type="button">
              SSH 확인
            </button>
            <button className="primaryButton fullWidthButton" disabled={isPending} onClick={() => onPrepareAgent()} type="button">
              Agent 설치
            </button>
            <button className="secondaryButton fullWidthButton" disabled={isPending} onClick={() => onUpdateAgent()} type="button">
              Agent 업데이트
            </button>
            <button
              className={isFirewallConfirming ? "secondaryButton fullWidthButton warningButton" : "secondaryButton fullWidthButton"}
              disabled={isPending}
              onClick={() => onOpenFirewallPort()}
              type="button"
            >
              {isFirewallConfirming ? "sudo 허용 후 Agent 포트 설정" : "Agent 포트 설정"}
            </button>
          </>
        ) : null}
        <button className="secondaryButton fullWidthButton" disabled={isPending} onClick={() => onSubmit()} type="button">
          서버 등록
        </button>
      </div>
    </article>
  );
}

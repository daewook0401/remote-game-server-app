import type { ServerCreateForm, ServerTargetType } from "../types/server";

interface ServerCreatePanelProps {
  form: ServerCreateForm;
  onChange: (form: ServerCreateForm) => void;
  onSubmit: () => void;
}

const targetOptions: Array<{ label: string; value: ServerTargetType }> = [
  { label: "지금 PC", value: "local" },
  { label: "SSH 서버", value: "remote" },
  { label: "클라우드 서버", value: "cloud" }
];

export function ServerCreatePanel({ form, onChange, onSubmit }: ServerCreatePanelProps) {
  function update<T extends keyof ServerCreateForm>(key: T, value: ServerCreateForm[T]) {
    onChange({ ...form, [key]: value });
  }

  const needsSSH = form.targetType !== "local";

  return (
    <article className="panel widePanel">
      <div className="panelHeader">
        <h2>서버 생성 설정</h2>
      </div>

      <div className="formGrid">
        <label className="fieldGroup">
          <span>실행 위치</span>
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
          <span>게임</span>
          <select
            className="textInput"
            onChange={(event) => update("gameTemplateId", event.target.value)}
            value={form.gameTemplateId}
          >
            <option value="minecraft-java">Minecraft Java</option>
          </select>
        </label>

        <label className="fieldGroup">
          <span>서버 이름</span>
          <input
            className="textInput"
            onChange={(event) => update("serverName", event.target.value)}
            value={form.serverName}
          />
        </label>

        <label className="fieldGroup">
          <span>메모리</span>
          <input
            className="textInput"
            onChange={(event) => update("memory", event.target.value)}
            value={form.memory}
          />
        </label>

        <label className="fieldGroup">
          <span>내부 포트</span>
          <input
            className="textInput"
            onChange={(event) => update("internalPort", Number(event.target.value))}
            type="number"
            value={form.internalPort}
          />
        </label>

        <label className="fieldGroup">
          <span>외부 포트</span>
          <input
            className="textInput"
            onChange={(event) => update("externalPort", Number(event.target.value))}
            type="number"
            value={form.externalPort}
          />
        </label>
      </div>

      {needsSSH ? (
        <div className="formGrid sshGrid">
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
        </div>
      ) : null}

      <label className="checkRow">
        <input
          checked={form.eulaAccepted}
          onChange={(event) => update("eulaAccepted", event.target.checked)}
          type="checkbox"
        />
        Minecraft EULA에 동의하고 서버 생성을 진행합니다.
      </label>

      <button className="primaryButton fullWidthButton" onClick={onSubmit} type="button">
        서버 생성
      </button>
    </article>
  );
}


import type { ServerRegistrationForm, ServerTargetType } from "../types/server";

interface ServerRegistrationPanelProps {
  form: ServerRegistrationForm;
  onChange: (form: ServerRegistrationForm) => void;
  onSubmit: () => void;
}

const targetOptions: Array<{ label: string; value: ServerTargetType }> = [
  { label: "지금 PC", value: "local" },
  { label: "SSH 서버", value: "remote" },
  { label: "클라우드 서버", value: "cloud" }
];

export function ServerRegistrationPanel({
  form,
  onChange,
  onSubmit
}: ServerRegistrationPanelProps) {
  function update<T extends keyof ServerRegistrationForm>(key: T, value: ServerRegistrationForm[T]) {
    onChange({ ...form, [key]: value });
  }

  const needsSSH = form.targetType !== "local";

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
          <span>Agent URL</span>
          <input
            className="textInput"
            onChange={(event) => update("agentBaseUrl", event.target.value)}
            placeholder="http://127.0.0.1:18080"
            value={form.agentBaseUrl}
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

      <button className="secondaryButton fullWidthButton" onClick={onSubmit} type="button">
        서버 등록
      </button>
    </article>
  );
}

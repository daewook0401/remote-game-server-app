import type { ServerCreateForm } from "../types/server";

interface ServerCreatePanelProps {
  disabled?: boolean;
  form: ServerCreateForm;
  onChange: (form: ServerCreateForm) => void;
  onSubmit: () => void;
}

export function ServerCreatePanel({ disabled, form, onChange, onSubmit }: ServerCreatePanelProps) {
  function update<T extends keyof ServerCreateForm>(key: T, value: ServerCreateForm[T]) {
    onChange({ ...form, [key]: value });
  }

  function handleGameChange(gameTemplateId: string) {
    onChange({
      ...form,
      gameTemplateId,
      internalPort: gameTemplateId === "minecraft-java" ? 25565 : form.internalPort
    });
  }

  return (
    <article className="panel widePanel">
      <div className="panelHeader">
        <h2>서버 생성 설정</h2>
      </div>

      <div className="formGrid">
        <label className="fieldGroup">
          <span>게임</span>
          <select
            className="textInput"
            onChange={(event) => handleGameChange(event.target.value)}
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
            className="textInput readonlyInput"
            readOnly
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

      <label className="checkRow">
        <input
          checked={form.eulaAccepted}
          onChange={(event) => update("eulaAccepted", event.target.checked)}
          type="checkbox"
        />
        Minecraft EULA에 동의하고 서버 생성을 진행합니다.
      </label>

      <button className="primaryButton fullWidthButton" disabled={disabled} onClick={onSubmit} type="button">
        서버 생성
      </button>
    </article>
  );
}

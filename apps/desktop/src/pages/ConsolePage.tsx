import { useState } from "react";
import { Topbar } from "../components/Topbar";
import { getConsoleSnapshot } from "../services/agentClient";

const DEFAULT_CONTAINER_ID = "mc-minecraft-survival";

export function ConsolePage() {
  const [containerId, setContainerId] = useState(DEFAULT_CONTAINER_ID);
  const [lines, setLines] = useState<string[]>(["Agent 콘솔 snapshot 대기"]);
  const [message, setMessage] = useState("컨테이너 ID를 확인한 뒤 콘솔을 새로고침하세요.");
  const [noticeKind, setNoticeKind] = useState<"info" | "success" | "error">("info");

  async function handleRefreshConsole() {
    try {
      const snapshot = await getConsoleSnapshot({ containerId });
      setLines(snapshot.lines.length > 0 ? snapshot.lines : ["콘솔 출력이 없습니다."]);
      setNoticeKind("success");
      setMessage(`${snapshot.containerId} 콘솔 snapshot 수신`);
    } catch (error) {
      setNoticeKind("error");
      setMessage(error instanceof Error ? error.message : "콘솔 snapshot 요청 실패");
    }
  }

  return (
    <>
      <Topbar
        actionLabel="콘솔 새로고침"
        description="Minecraft Docker 컨테이너 로그와 콘솔 입출력을 확인합니다."
        onAction={handleRefreshConsole}
        title="Docker 콘솔"
      />

      <div className={`noticeBar ${noticeKind}`}>{message}</div>

      <article className="panel consolePanel">
        <label className="fieldLabel" htmlFor="container-id">
          컨테이너 ID
        </label>
        <input
          className="textInput"
          id="container-id"
          onChange={(event) => setContainerId(event.target.value)}
          value={containerId}
        />

        <div className="terminalOutput" aria-label="Docker console output">
          {lines.map((line, index) => (
            <div key={`${line}-${index}`}>{line}</div>
          ))}
        </div>
        <div className="terminalInput">
          <span>&gt;</span>
          <input aria-label="console command" disabled placeholder="명령 전송은 다음 단계에서 연결" />
        </div>
      </article>
    </>
  );
}

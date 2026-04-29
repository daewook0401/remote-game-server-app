import { useEffect, useState } from "react";
import { getConsoleSnapshot, sendConsoleCommand } from "../services/agentClient";
import type { ContainerSummary } from "../types/server";

interface ContainerConsolePanelProps {
  agentBaseUrl: string;
  agentToken?: string;
  container: ContainerSummary;
  serverName: string;
}

export function ContainerConsolePanel({
  agentBaseUrl,
  agentToken,
  container,
  serverName
}: ContainerConsolePanelProps) {
  const [lines, setLines] = useState<string[]>(["콘솔 로그를 불러오는 중입니다."]);
  const [command, setCommand] = useState("");
  const [message, setMessage] = useState("");
  const [noticeKind, setNoticeKind] = useState<"info" | "success" | "warning" | "error">("info");
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    void refreshConsole();
  }, [container.id, agentBaseUrl, agentToken]);

  async function refreshConsole() {
    try {
      setIsBusy(true);
      const snapshot = await getConsoleSnapshot({ containerId: container.id }, agentBaseUrl, agentToken);
      setLines(snapshot.lines.length > 0 ? snapshot.lines : ["콘솔 출력이 없습니다."]);
      setNoticeKind("success");
      setMessage(`${serverName} / ${container.name} 콘솔을 새로고침했습니다.`);
    } catch (error) {
      setNoticeKind("error");
      setMessage(error instanceof Error ? error.message : "콘솔 로그를 불러오지 못했습니다.");
      setLines(["콘솔 로그를 불러오지 못했습니다."]);
    } finally {
      setIsBusy(false);
    }
  }

  async function handleSendCommand() {
    const trimmedCommand = command.trim();
    if (!trimmedCommand) {
      setNoticeKind("error");
      setMessage("보낼 명령을 입력하세요.");
      return;
    }

    try {
      setIsBusy(true);
      const result = await sendConsoleCommand(
        { containerId: container.id, command: trimmedCommand },
        agentBaseUrl,
        agentToken
      );
      setCommand("");
      setLines((current) => [
        ...current,
        `> ${result.command}`,
        ...(result.output.length > 0 ? result.output : ["명령을 전송했습니다."])
      ]);
      setNoticeKind("success");
      setMessage("콘솔 명령을 전송했습니다.");
      await refreshConsole();
    } catch (error) {
      setNoticeKind("error");
      setMessage(error instanceof Error ? error.message : "콘솔 명령 전송에 실패했습니다.");
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <article className="consolePanel">
      <div className="formGrid consoleMetaGrid">
        <label className="fieldGroup">
          <span>서버</span>
          <input className="textInput readonlyInput" readOnly value={serverName} />
        </label>
        <label className="fieldGroup">
          <span>게임 서버</span>
          <input className="textInput readonlyInput" readOnly value={`${container.name} (${container.status})`} />
        </label>
        <label className="fieldGroup">
          <span>Agent URL</span>
          <input className="textInput readonlyInput" readOnly value={agentBaseUrl} />
        </label>
      </div>

      {message ? <div className={`noticeBar ${noticeKind}`}>{message}</div> : null}

      <div className="terminalOutput" aria-label="Docker console output">
        {lines.map((line, index) => (
          <div key={`${line}-${index}`}>{line}</div>
        ))}
      </div>
      <div className="terminalInput">
        <span>&gt;</span>
        <input
          aria-label="console command"
          disabled={isBusy}
          onChange={(event) => setCommand(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              void handleSendCommand();
            }
          }}
          placeholder="예: say hello"
          value={command}
        />
        <button
          className="smallButton"
          disabled={isBusy || !command.trim()}
          onClick={handleSendCommand}
          type="button"
        >
          전송
        </button>
        <button className="smallButton" disabled={isBusy} onClick={refreshConsole} type="button">
          새로고침
        </button>
      </div>
    </article>
  );
}

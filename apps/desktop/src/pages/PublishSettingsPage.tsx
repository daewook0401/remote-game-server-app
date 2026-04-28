import { useMemo, useState } from "react";
import { AddressPanel } from "../components/AddressPanel";
import { ModeCard } from "../components/ModeCard";
import { StatusPanel } from "../components/StatusPanel";
import { Topbar } from "../components/Topbar";
import { connectionModes } from "../data/publishSettings";
import {
  createInitialSession,
  failPublishSession,
  getPublishAddress,
  getPublishStatusItems,
  publishSessionWithPort,
  resetPublishSession,
  startPublishSession,
  stopPublishSession
} from "../services/publishWorkflow";
import { allocateRelayPort, releaseRelayPort } from "../services/relayClient";

export function PublishSettingsPage() {
  const [session, setSession] = useState(createInitialSession);
  const [message, setMessage] = useState("Relay API 대기");
  const address = getPublishAddress(session);
  const statusItems = useMemo(() => getPublishStatusItems(session), [session]);
  const isPublished = session.status === "published";
  const isBusy = session.status === "allocating" || session.status === "stopping";

  async function handleStartPublish() {
    setSession((current) => startPublishSession(current));
    setMessage("Relay 포트 할당 요청중");

    try {
      const allocation = await allocateRelayPort();
      setSession((current) => publishSessionWithPort(current, allocation.port));
      setMessage(`Relay 포트 ${allocation.port} 할당 완료`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Relay 포트 할당 실패";
      setSession((current) => failPublishSession(current, errorMessage));
      setMessage(errorMessage);
    }
  }

  async function handleStopPublish() {
    const remotePort = session.remotePort;
    setSession((current) => stopPublishSession(current));

    if (remotePort === undefined) {
      setSession((current) => resetPublishSession(current));
      setMessage("회수할 Relay 포트가 없습니다.");
      return;
    }

    setMessage(`Relay 포트 ${remotePort} 회수 요청중`);

    try {
      await releaseRelayPort(remotePort);
      setSession((current) => resetPublishSession(current));
      setMessage(`Relay 포트 ${remotePort} 회수 완료`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Relay 포트 회수 실패";
      setSession((current) => failPublishSession(current, errorMessage));
      setMessage(errorMessage);
    }
  }

  return (
    <>
      <Topbar
        actionLabel={isBusy ? "처리중" : "공개 시작"}
        description="Minecraft Java TCP 터널 MVP 기준의 초기 프로그램 화면입니다."
        onAction={isBusy ? () => undefined : handleStartPublish}
        onSecondaryAction={isPublished ? handleStopPublish : undefined}
        secondaryActionLabel={isPublished ? "공개 중지" : undefined}
        title="게임 서버 공개 설정"
      />

      <div className={session.status === "failed" ? "noticeBar error" : "noticeBar info"}>{message}</div>

      <section className="modeGrid" aria-label="공개 방식">
        {connectionModes.map((mode) => (
          <ModeCard key={mode.title} mode={mode} />
        ))}
      </section>

      <section className="panelGrid">
        <AddressPanel address={address} />
        <StatusPanel items={statusItems} />
      </section>
    </>
  );
}

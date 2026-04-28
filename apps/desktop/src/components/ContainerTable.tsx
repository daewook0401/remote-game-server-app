import type { ContainerActionRequest } from "../types/api";
import type { ContainerSummary } from "../types/server";

interface ContainerTableProps {
  containers: ContainerSummary[];
  pendingAction?: ContainerActionRequest;
  onAddContainer?: () => void;
  onRefreshContainers?: () => void;
  onAction: (containerId: string, action: ContainerActionRequest["action"]) => void;
  onRequestAction: (containerId: string, action: ContainerActionRequest["action"]) => void;
}

export function ContainerTable({
  containers,
  onAddContainer,
  onRefreshContainers,
  onAction,
  onRequestAction,
  pendingAction
}: ContainerTableProps) {
  function isPending(containerId: string, action: ContainerActionRequest["action"]) {
    return pendingAction?.containerId === containerId && pendingAction.action === action;
  }

  return (
    <article className="panel widePanel">
      <div className="panelHeader">
        <h2>Docker 컨테이너</h2>
        <div className="headerActions">
          {onRefreshContainers ? (
            <button className="secondaryButton compactButton" onClick={onRefreshContainers} type="button">
              새로고침
            </button>
          ) : null}
          {onAddContainer ? (
            <button className="primaryButton compactButton" onClick={onAddContainer} type="button">
              게임 서버 추가
            </button>
          ) : null}
        </div>
      </div>
      <table className="dataTable">
        <thead>
          <tr>
            <th>이름</th>
            <th>이미지</th>
            <th>상태</th>
            <th>포트</th>
            <th>데이터 위치</th>
            <th>작업</th>
          </tr>
        </thead>
        <tbody>
          {containers.length === 0 ? (
            <tr>
              <td colSpan={6}>생성된 게임 서버가 없습니다.</td>
            </tr>
          ) : (
            containers.map((container) => (
              <tr key={container.id}>
                <td>{container.name}</td>
                <td>{container.image || "-"}</td>
                <td>{container.status}</td>
                <td>{container.port || "-"}</td>
                <td>{container.volumePath || "-"}</td>
                <td>
                  <div className="tableActions">
                    <button
                      className={isPending(container.id, "start") ? "smallButton confirm" : "smallButton"}
                      onClick={() =>
                        isPending(container.id, "start")
                          ? onAction(container.id, "start")
                          : onRequestAction(container.id, "start")
                      }
                      type="button"
                    >
                      {isPending(container.id, "start") ? "시작 확인" : "시작"}
                    </button>
                    <button
                      className={isPending(container.id, "stop") ? "smallButton confirm" : "smallButton"}
                      onClick={() =>
                        isPending(container.id, "stop")
                          ? onAction(container.id, "stop")
                          : onRequestAction(container.id, "stop")
                      }
                      type="button"
                    >
                      {isPending(container.id, "stop") ? "중지 확인" : "중지"}
                    </button>
                    <button
                      className="smallButton danger"
                      onClick={() => onRequestAction(container.id, "delete")}
                      type="button"
                    >
                      삭제
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </article>
  );
}

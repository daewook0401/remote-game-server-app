import type { ContainerActionRequest } from "../types/api";
import type { ContainerSummary } from "../types/server";

interface ContainerTableProps {
  containers: ContainerSummary[];
  pendingAction?: ContainerActionRequest;
  onAction: (containerId: string, action: ContainerActionRequest["action"]) => void;
  onRequestAction: (containerId: string, action: ContainerActionRequest["action"]) => void;
}

export function ContainerTable({
  containers,
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
      </div>
      <table className="dataTable">
        <thead>
          <tr>
            <th>이름</th>
            <th>이미지</th>
            <th>상태</th>
            <th>포트</th>
            <th>인스턴스</th>
            <th>작업</th>
          </tr>
        </thead>
        <tbody>
          {containers.length === 0 ? (
            <tr>
              <td colSpan={6}>생성된 컨테이너가 없습니다.</td>
            </tr>
          ) : (
            containers.map((container) => (
              <tr key={container.id}>
                <td>{container.name}</td>
                <td>{container.image || "-"}</td>
                <td>{container.status}</td>
                <td>{container.port || "-"}</td>
                <td>{container.instanceId || "-"}</td>
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
                      className={isPending(container.id, "delete") ? "smallButton danger confirm" : "smallButton danger"}
                      onClick={() =>
                        isPending(container.id, "delete")
                          ? onAction(container.id, "delete")
                          : onRequestAction(container.id, "delete")
                      }
                      type="button"
                    >
                      {isPending(container.id, "delete") ? "삭제 확인" : "삭제"}
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

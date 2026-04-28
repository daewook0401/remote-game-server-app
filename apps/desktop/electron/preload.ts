import { contextBridge } from "electron";

contextBridge.exposeInMainWorld("remoteGameServer", {
  appName: "Remote Game Server"
});


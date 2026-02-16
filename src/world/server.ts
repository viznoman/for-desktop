import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("stoatPixel", {
  setServer: (url: string) =>
    ipcRenderer.invoke("server:set", url) as Promise<string>,

  connect: () =>
    ipcRenderer.invoke("server:connect") as Promise<void>,

  connectDefault: () =>
    ipcRenderer.invoke("server:connect-default") as Promise<void>,

  usePublic: () =>
    ipcRenderer.invoke("server:use-public") as Promise<void>,
});
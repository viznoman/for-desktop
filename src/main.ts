import { updateElectronApp } from "update-electron-app";

import { registerIpcHandlers } from "./native/window";

import { BrowserWindow, app, shell, ipcMain } from "electron";
import started from "electron-squirrel-startup";

import { autoLaunch } from "./native/autoLaunch";
import { config } from "./native/config";
import { initDiscordRpc } from "./native/discordRpc";
import { initTray } from "./native/tray";
import { BUILD_URL, createMainWindow, mainWindow } from "./native/window";
import Store from "electron-store";

// For custom server storage and handling
type Settings = { serverUrl?: string };
const store = new Store<Settings>();

ipcMain.handle("server:get", () => store.get("serverUrl") ?? null);
// Saves the set server url
ipcMain.handle("server:set", (_event, url: string) => {
  const u = new URL(url);
  store.set("serverUrl", u.origin);
  return u.origin;
});
// Fetches the server origin
ipcMain.handle("server:getEffective", () => {
  const saved = store.get("serverUrl");
  return saved ?? null;
});

// Squirrel-specific logic
// create/remove shortcuts on Windows when installing / uninstalling
// we just need to close out of the app immediately
if (started) {
  app.quit();
}

// disable hw-accel if so requested
if (!config.hardwareAcceleration) {
  app.disableHardwareAcceleration();
}

// ensure only one copy of the application can run
const acquiredLock = app.requestSingleInstanceLock();

if (acquiredLock) {
	registerIpcHandlers();
  // start auto update logic
if (app.isPackaged && process.platform === "win32") {
  updateElectronApp({
    repo: "viznoman/for-desktop",
    updateInterval: "1 day",
    notifyUser: true,
  });
}

  // create and configure the app when electron is ready
  app.on("ready", () => {
    // enable auto start on Windows and MacOS
    if (config.firstLaunch) {
      if (process.platform === "win32" || process.platform === "darwin") {
        autoLaunch.enable();
      }
    }

    // create window and application contexts
    createMainWindow();
    initTray();
    initDiscordRpc();

    // Windows specific fix for notifications
    if (process.platform === "win32") {
      app.setAppUserModelId("chat.stoat.notifications");
    }
  });

  // focus the window if we try to launch again
  app.on("second-instance", () => {
    mainWindow.show();
    mainWindow.restore();
    mainWindow.focus();
  });

  // macOS specific behaviour to keep app active in dock:
  // (irrespective of the minimise-to-tray option)

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
      app.quit();
    }
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  // ensure URLs launch in external context
  app.on("web-contents-created", (_, contents) => {
    // prevent navigation out of build URL origin
    contents.on("will-navigate", (event, navigationUrl) => {
      if (new URL(navigationUrl).origin !== new URL(getStartUrl() ?? "https://beta.revolt.chat").origin) {
        event.preventDefault();
      }
    });

    // handle links externally
    contents.setWindowOpenHandler(({ url }) => {
      if (
        url.startsWith("http:") ||
        url.startsWith("https:") ||
        url.startsWith("mailto:")
      ) {
        setImmediate(() => {
          shell.openExternal(url);
        });
      }

      return { action: "deny" };
    });
  });
} else {
  app.quit();
}

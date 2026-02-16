import Store from "electron-store";
import { app } from "electron";

// Create the store AFTER imports
const store = new Store<{ serverUrl?: string }>();

export function getStartUrl(): string | null {
  if (app.commandLine.hasSwitch("force-server")) {
    return new URL(app.commandLine.getSwitchValue("force-server")).toString();
  }
  const saved = store.get("serverUrl");
  return saved ? new URL(saved).toString() : null;
}

export function getSetupDataUrl(): string {
  const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Stoat</title>
  <style>
    html,body{height:100%;margin:0;font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial}
    body{
      display:grid;place-items:center;
      background: radial-gradient(80% 80% at 50% 20%, rgba(255,255,255,.06), rgba(0,0,0,0) 60%), #0b0d12;
      color:#fff;
    }
    .card{
      width:420px; max-width: calc(100vw - 48px);
      border-radius:28px; padding:28px;
      background: rgba(25,27,35,.85);
      border:1px solid rgba(255,255,255,.06);
      box-shadow:0 25px 80px rgba(0,0,0,.6);
      backdrop-filter: blur(12px);
	  text-align:center;
    }
    .h1{font-size:22px;font-weight:700;line-height:1.2;margin-top:14px}
    .p{margin-top:10px;color:rgba(255,255,255,.65);line-height:1.4}
    .input{
      margin-top:25px;width:100%;
      padding:12px 14px;border-radius:999px;
      border:1px solid rgba(255,255,255,.10);
      background:rgba(0,0,0,.25);
      color:#fff;outline:none;
	  box-sizing: border-box;
	  height: 48px;
    }
    .err{margin-top:10px;color:#ffb3b3;font-size:13px;min-height:18px}
    .btn{
      margin-top:5px;width:100%;
      padding:12px 14px;border-radius:999px;border:none;
      font-weight:700;cursor:pointer;
    }
    .primary{background:#b9c6ff;color:#0b0d12}
    .secondary{
      margin-top:10px;
      border:1px solid rgba(255,255,255,.10);
      background:rgba(255,255,255,.06);color:#fff;
    }
    .smalllink{
      margin-top:12px;text-align:center;
      color:rgba(255,255,255,.55);font-size:12px;
    }
    .smalllink a{color:rgba(255,255,255,.75);text-decoration:none}
    .smalllink a:hover{text-decoration:underline}
  </style>
</head>
<body>
  <div class="card">

    <div class="h1">Where are you going?</div>
    <div class="p">Enter your community’s Stoat server to continue.</div>

    <input id="server" class="input" placeholder="https://stoat.yourserver.com" />
    <div id="err" class="err"></div>

    <button class="btn primary" id="continue">Continue</button>
    <button class="btn secondary" id="useDefault">Use Stoat Official</button>

    <div class="smalllink">
      Don’t have a server? Use the official one.
    </div>
  </div>

<script>
  const err = document.getElementById('err');
  const input = document.getElementById('server');

  document.getElementById('continue').addEventListener('click', async () => {
    err.textContent = '';
    try {
      const url = (input.value || '').trim();
      await window.stoatPixel.setServer(url);
      await window.stoatPixel.connect(); // IPC -> main process loads URL
    } catch (e) {
      err.textContent = 'Please enter a valid URL (example: https://stoat.example.com).';
    }
  });

  document.getElementById('useDefault').addEventListener('click', async () => {
    err.textContent = '';
    await window.stoatPixel.usePublic(); // IPC -> saves + loads official
  });
</script>
</body>
</html>`;
  return "data:text/html;charset=utf-8," + encodeURIComponent(html);
}

export function setSavedServer(url: string) {
  store.set("serverUrl", new URL(url).origin);
}

export function clearSavedServer() {
  store.delete("serverUrl");
}
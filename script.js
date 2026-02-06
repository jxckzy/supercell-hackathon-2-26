const API_BASE = "http://127.0.0.1:8000";

const npc01 = {
  name: "Morgan",
  role: "security guard",
  personality: "calm, evasive",
  memory: []
};

const npc02 = {
  name: "Lola",
  role: "hotel guest no.1",
  personality: "A confident, slightly cocky regular",
  memory: []
};

function getNpcPayload(npc) {
  return {
    name: npc.name,
    role: npc.role,
    personality: npc.personality
  };
}

function renderOutputFor(memory, npc) {
  document.getElementById("output").textContent = memory
    .map(m => (m.from === "player" ? "Sheriff: " : npc.name + ": ") + m.text)
    .join("\n\n");
}

async function sendToNpc(npc) {
  const inputEl = document.getElementById("input");
  const text = (inputEl.value || "").trim();
  if (!text) return;

  npc.memory.push({ from: "player", text });
  inputEl.value = "";
  renderOutputFor(npc.memory, npc);

  const sendBtn = document.getElementById("sendToMorgan");
  const otherBtn = document.getElementById("sendToLola");
  sendBtn.disabled = true;
  otherBtn.disabled = true;

  try {
    const res = await fetch(`${API_BASE}/talk`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        npc: getNpcPayload(npc),
        history: npc.memory.slice(0, -1),
        player_message: text
      })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || res.statusText);
    }
    const data = await res.json();
    const reply = data.reply || "";
    npc.memory.push({ from: "npc", text: reply });
  } catch (e) {
    npc.memory.push({
      from: "npc",
      text: "[Error: " + (e.message || "Could not reach AI") + "]"
    });
  }

  renderOutputFor(npc.memory, npc);
  sendBtn.disabled = false;
  otherBtn.disabled = false;
}

document.getElementById("clear").onclick = () => {
  npc01.memory = [];
  npc02.memory = [];
  document.getElementById("output").textContent = "";
};

document.getElementById("sendToMorgan").onclick = () => sendToNpc(npc01);
document.getElementById("sendToLola").onclick = () => sendToNpc(npc02);

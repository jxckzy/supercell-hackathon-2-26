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


document.getElementById("clear").onclick = () => {
  npc01.memory = [];
  npc02.memory = [];
  document.getElementById("output").textContent = "";
};

document.getElementById("sendToLola").onclick = () => {
  const text = document.getElementById("input").value;

  // NPC "запоминает" вопрос
  npc02.memory.push({
    from: "player",
    text: text
  });

  // NPC "отвечает"
  const reply = `(${npc02.name} remembers ${npc02.memory.length} messages)`;

  npc02.memory.push({
    from: "npc",
    text: reply
  });

  document.getElementById("output").textContent =
  JSON.stringify(npc02.memory, null, 2);
};


document.getElementById("sendToMorgan").onclick = () => {
  const text = document.getElementById("input").value;

  // NPC "запоминает" вопрос
  npc01.memory.push({
    from: "player",
    text: text
  });

  // NPC "отвечает"
  const reply = `(${npc01.name} remembers ${npc01.memory.length} messages)`;

  npc01.memory.push({
    from: "npc",
    text: reply
  });

  document.getElementById("output").textContent =
  JSON.stringify(npc01.memory, null, 2);
};

document.getElementById("clear").onclick = () => {
  npc01.memory = [];
  npc02.memory = [];
  document.getElementById("output").textContent = "";
};


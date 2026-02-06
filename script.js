const npc = {
  name: "Morgan",
  role: "security guard",
  personality: "calm, evasive",
  memory: []
};


document.getElementById("send").onclick = () => {
  const text = document.getElementById("input").value;

  // NPC "запоминает" вопрос
  npc.memory.push({
    from: "player",
    text: text
  });

  // NPC "отвечает"
  const reply = `(${npc.name} remembers ${npc.memory.length} messages)`;

  npc.memory.push({
    from: "npc",
    text: reply
  });

  document.getElementById("output").textContent = reply;
};

**Supercell's Hackathon Feb 2026!**
---

# Sheriff 🕵️‍♂️

### AI Murder Investigation Game

![Python](https://img.shields.io/badge/Python-FastAPI-blue)
![JavaScript](https://img.shields.io/badge/Frontend-Phaser.js-orange)
![AI](https://img.shields.io/badge/AI-Gemini-green)
![Status](https://img.shields.io/badge/Project-Hackathon-red)

Sheriff is a detective investigation game where the player must solve a murder by interrogating NPCs powered by AI dialog generation.

One of the characters is secretly the killer.
The others are innocent.

Your job is to **find the truth**.

---

## 🎮 Gameplay

The player acts as a **Sheriff investigating a murder scene**.

You must:

* walk around the map
* talk to NPCs
* ask questions
* collect clues
* write notes
* accuse the killer

NPC responses are generated dynamically using AI.

Every playthrough can be different.

---

## 🧠 Core Mechanics

### NPC interrogation

Each character:

* has a personality
* has a role
* can reference other NPCs
* gives clues (or misleading statements)

Only **one NPC is randomly selected as the killer**.

---

### Notebook system

The notebook allows the player to:

* save clues
* track suspicious dialog
* review investigation notes

Open notebook with:

```
N
```

---

### Ending system

The game ends when the player accuses someone.

**Correct accusation → YOU WIN**
**Wrong accusation → YOU LOSE**

---

## 🧩 Tech Stack

Frontend:

* Phaser 3
* JavaScript
* HTML/CSS

Backend:

* Python
* FastAPI

AI:

* Gemini API (NPC dialog generation)

---

## 🗂 Project Structure

```
SheriffGame/
├── backend/
│   └── main.py
│
│── game.html
│── game.js
│── game.css
│── images/
│
└── README.md
```
Other files are no longer used, only the early stage development.

---

## 🚀 Running the Project

### 1. Start backend

```
uvicorn main:app --reload
```

Backend runs on:

```
http://127.0.0.1:8000
```

---

### 2. Start frontend

Inside frontend folder:

```
python -m http.server 8080
```

Open in browser:

```
http://localhost:8080/game.html
```

---

## 🧪 Example Gameplay Flow

```
Talk to Morgan → suspicious alibi
Talk to Lola → mentions Morgan
Talk to Sebastian → confirms timeline
Save notes → analyze clues
Accuse Morgan → WIN
```

---

## 🎯 Project Goal

This project demonstrates how to combine:

* AI-generated dialog
* simple game mechanics
* browser-based game engine
* backend API integration
* player deduction gameplay

The focus is on **interactive storytelling powered by AI**.

---

## 🔮 Future Improvements

* proximity interaction with NPCs
* suspicion scoring system
* multiple killers
* time-based investigation
* audio and animations
* AI memory improvements
* save/load system
* larger maps
* better UI

---

## 👥 Authors

Hackathon project:
- Illia Voitsekhovskyi
- Ruslan Matetski

Students of Metropolia UAS

---

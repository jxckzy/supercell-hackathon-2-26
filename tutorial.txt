================================================================================
  SHERIFF GAME - Supercell Hackathon Feb 2026
================================================================================

DESCRIPTION
-----------
A detective game where you play as the Sheriff. One of the guests is the killer.
Talk to NPCs (Morgan, Lola, John, Chris, Sebastian, Anna) to gather clues. They
give real clues that mention other people by name. Use your notebook, piece
together the evidence, then accuse the killer. Find them to win; wrong guess
and the killer gets away.


HOW TO RUN
----------
1. Start the backend (required for NPC dialogue):
   cd server
   pip install -r requirements.txt
   (Set up .env with GEMINI_API_KEY or other AI provider - see server/SETUP.md)
   uvicorn main:app --reload

2. Open the game in a browser:
   Open game.html in a browser, or serve the project folder (e.g. with a local
   HTTP server) and open game.html. The game talks to the API at
   http://127.0.0.1:8000 by default.


CONTROLS
--------
WASD          - Move
E             - Speak with nearby NPC (when "E to speak with [name]" is shown)
N             - Open / close notebook
Click NPC     - Also opens dialogue (alternative to E)
In dialogue:  - Ask questions, save replies to notebook, accuse when ready


GAMEPLAY
--------
- Walk up to an NPC. Text under their head will say "E to speak with [name]".
  Press E to talk.
- Ask: "Where were you last night?", "Did you see anything suspicious?",
  "Do you know the other guests?" NPCs (except the killer) give real clues
  that name other people.
- Save important lines to the notebook (N to open). Use "Clear last note" to
  remove the most recent note.
- When you think you know the killer, open their dialogue and click
  "Accuse this person of being the killer". Correct = win, wrong = lose.
- "Play again" clears the notebook and starts a new round with a new killer.


FILES
-----
game.html, game.js, game.css  - Frontend game (Phaser 3)
server/main.py               - Backend API (FastAPI, AI chat for NPCs)
images/                      - Sprites and backgrounds


================================================================================

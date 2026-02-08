/**
 * Sheriff game: 3 NPCs (one killer, two villains), 3 choice questions, AI replies, notebook.
 * Dialog opens as in-game popup when clicking an NPC. N = notebook.
 */
(function () {
    'use strict';

    var API_BASE = 'http://127.0.0.1:8000';
    var CHOICES = [
        'Where were you last night?',
        'Did you see anything suspicious?',
        'Do you know the other guests?'
    ];
    var NOTEBOOK_KEY = 'sheriff_notebook';

    var notebook = [];
    try {
        var stored = localStorage.getItem(NOTEBOOK_KEY);
        if (stored) notebook = JSON.parse(stored);
    } catch (e) {
    }

    var npcHistories = {};
    var currentDialogNpc = null;
    var lastReply = '';

    var dialogOverlay = null;
    var dialogLog = null;
    var dialogReply = null;
    var dialogNpcName = null;
    var choiceBtns = null;
    var notebookOverlay = null;
    var notebookList = null;

    function saveNotebookToStorage() {
        try {
            localStorage.setItem(NOTEBOOK_KEY, JSON.stringify(notebook));
        } catch (e) {
        }
    }

    function openDialog(npcInfo) {
        currentDialogNpc = npcInfo;
        lastReply = '';
        if (!dialogOverlay) return;
        dialogNpcName.textContent = npcInfo.name;
        dialogLog.textContent = '';
        var isCorpse = npcInfo.npcType === 'corpse';
        if (isCorpse) {
            dialogReply.textContent = 'The victim. No answers here.';
            setChoiceButtonsEnabled(true);
            if (document.getElementById('accuse-btn')) document.getElementById('accuse-btn').hidden = true;
            if (document.querySelector('.dialog-choices-wrap')) document.querySelector('.dialog-choices-wrap').hidden = true;
            if (document.getElementById('save-to-notebook')) document.getElementById('save-to-notebook').hidden = true;
        } else {
            dialogReply.textContent = 'Ask something using the choices below.';
            setChoiceButtonsEnabled(false);
            if (document.getElementById('accuse-btn')) document.getElementById('accuse-btn').hidden = false;
            if (document.querySelector('.dialog-choices-wrap')) document.querySelector('.dialog-choices-wrap').hidden = false;
            if (document.getElementById('save-to-notebook')) document.getElementById('save-to-notebook').hidden = false;
        }
        var history = npcHistories[npcInfo.name] || [];
        npcHistories[npcInfo.name] = history;
        dialogOverlay.hidden = false;
    }

    function closeDialog() {
        if (dialogOverlay) dialogOverlay.hidden = true;
        currentDialogNpc = null;
    }

    function otherNpcNames() {
        if (!currentDialogNpc) return [];
        var all = [];
        for (var i = 0; i < INTERROGATABLE_COUNT; i++) all.push(npcData[i].name);
        return all.filter(function (n) {
            return n !== currentDialogNpc.name;
        });
    }

    function appendToLog(playerText, npcText) {
        var history = npcHistories[currentDialogNpc.name];
        if (playerText) history.push({from: 'player', text: playerText});
        if (npcText) history.push({from: 'npc', text: npcText});
        var lines = [];
        for (var i = 0; i < history.length; i++) {
            var prefix = history[i].from === 'player' ? 'Sheriff: ' : currentDialogNpc.name + ': ';
            lines.push(prefix + history[i].text);
        }
        dialogLog.textContent = lines.join('\n\n');
    }

    function setChoiceButtonsEnabled(enabled) {
        for (var i = 0; i < choiceBtns.length; i++) choiceBtns[i].disabled = !!enabled;
    }

    function sendChoice(choiceIndex) {
        if (!currentDialogNpc || currentDialogNpc.npcType === 'corpse' || choiceIndex < 0 || choiceIndex >= CHOICES.length) return;
        var playerMessage = CHOICES[choiceIndex];
        setChoiceButtonsEnabled(true);
        dialogReply.textContent = '...';

        var history = (npcHistories[currentDialogNpc.name] || []).slice();
        var body = {
            npc: {
                name: currentDialogNpc.name,
                role: currentDialogNpc.role,
                personality: currentDialogNpc.personality || 'evasive'
            },
            history: history.map(function (m) {
                return {from: m.from, text: m.text};
            }),
            player_message: playerMessage,
            npc_type: currentDialogNpc.npcType || 'villain',
            other_npc_names: otherNpcNames()
        };

        fetch(API_BASE + '/talk', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(body)
        })
            .then(function (res) {
                if (!res.ok) return res.json().then(function (j) {
                    throw new Error(j.detail || res.statusText);
                });
                return res.json();
            })
            .then(function (data) {
                var reply = (data.reply || '').trim();
                lastReply = reply;
                npcHistories[currentDialogNpc.name] = npcHistories[currentDialogNpc.name] || [];
                appendToLog(playerMessage, reply);
                dialogReply.textContent = reply || '(No reply)';
                setChoiceButtonsEnabled(false);
            })
            .catch(function (err) {
                lastReply = '';
                dialogReply.textContent = 'Error: ' + (err.message || 'Request failed');
                setChoiceButtonsEnabled(false);
            });
    }

    function saveToNotebook() {
        if (!lastReply.trim()) return;
        notebook.push({
            npcName: currentDialogNpc ? currentDialogNpc.name : '—',
            text: lastReply,
            when: new Date().toISOString()
        });
        saveNotebookToStorage();
    }

    function openNotebook() {
        if (!notebookOverlay) return;
        renderNotebookList();
        notebookOverlay.hidden = false;
    }

    function closeNotebook() {
        if (notebookOverlay) notebookOverlay.hidden = true;
    }

    function clearLastNote() {
        if (notebook.length === 0) return;
        notebook.pop();
        saveNotebookToStorage();
        renderNotebookList();
    }

    function clearNotebookOnReset() {
        notebook = [];
        saveNotebookToStorage();
        if (notebookList) renderNotebookList();
    }

    function endGame(won) {
        closeDialog();
        closeNotebook();
        var overlay = document.getElementById('game-end-overlay');
        var titleEl = document.getElementById('game-end-title');
        if (overlay && titleEl) {
            titleEl.textContent = won ? 'You found the killer! Victory!' : 'Wrong accusation. The killer got away.';
            overlay.hidden = false;
        }
    }

    function playAgain() {
        clearNotebookOnReset();
        var overlay = document.getElementById('game-end-overlay');
        if (overlay) overlay.hidden = true;
        window.location.reload();
    }

    function accuseCurrent() {
        if (!currentDialogNpc || currentDialogNpc.npcType === 'corpse') return;
        var isKiller = window.__killerName && currentDialogNpc.name === window.__killerName;
        closeDialog();
        endGame(isKiller);
    }

    function renderNotebookList() {
        if (!notebookList) return;
        notebookList.innerHTML = '';
        notebook.forEach(function (entry, i) {
            var li = document.createElement('li');
            li.innerHTML = '<span class="note-npc">' + escapeHtml(entry.npcName) + '</span> ' + escapeHtml(entry.text);
            notebookList.appendChild(li);
        });
    }

    function escapeHtml(s) {
        var div = document.createElement('div');
        div.textContent = s;
        return div.innerHTML;
    }

    function bindDialogAndNotebook() {
        dialogOverlay = document.getElementById('dialog-overlay');
        dialogLog = document.getElementById('dialog-log');
        dialogReply = document.getElementById('dialog-reply');
        dialogNpcName = document.getElementById('dialog-npc-name');
        choiceBtns = document.querySelectorAll('.choice-btn');
        notebookOverlay = document.getElementById('notebook-overlay');
        notebookList = document.getElementById('notebook-list');

        document.getElementById('dialog-close').addEventListener('click', closeDialog);
        document.getElementById('dialog-close-btn').addEventListener('click', closeDialog);
        document.getElementById('save-to-notebook').addEventListener('click', saveToNotebook);
        var accuseBtn = document.getElementById('accuse-btn');
        if (accuseBtn) accuseBtn.addEventListener('click', accuseCurrent);
        document.getElementById('notebook-close').addEventListener('click', closeNotebook);
        document.getElementById('notebook-close-btn').addEventListener('click', closeNotebook);
        var clearLastBtn = document.getElementById('clear-last-note');
        if (clearLastBtn) clearLastBtn.addEventListener('click', clearLastNote);
        document.getElementById('open-notebook-fab').addEventListener('click', openNotebook);
        var playAgainBtn = document.getElementById('play-again-btn');
        if (playAgainBtn) playAgainBtn.addEventListener('click', playAgain);

        choiceBtns.forEach(function (btn, i) {
            btn.addEventListener('click', function () {
                sendChoice(i);
            });
        });

        document.addEventListener('keydown', function (e) {
            if (e.key === 'n' || e.key === 'N') {
                if (notebookOverlay && !notebookOverlay.hidden) closeNotebook();
                else openNotebook();
                e.preventDefault();
            }
        });
    }

    window.openDialog = openDialog;
    window.openNotebook = openNotebook;

    // --- Phaser ---
    var config = {
        type: Phaser.AUTO,
        parent: 'game-container',
        width: 800,
        height: 500,
        backgroundColor: '#2d3a4f',
        physics: {
            default: 'arcade',
            arcade: {gravity: {y: 0}}
        },
        scene: {preload: preload, create: create, update: update}
    };

    var player;
    var npcs = [];
    var npcData = [
        {name: 'Morgan', role: 'security guard', x: 200, y: 250, sprite: 'MorganS'},
        {name: 'Lola', role: 'stripper', x: 550, y: 250, sprite: 'LolaS'},
        {name: 'John', role: 'visitor no.1', x: 550, y: 150, sprite: 'JohnS'},
        {name: 'Chris', role: 'visitor no.2', x: 200, y: 150, sprite: 'ChrisS'},
        {name: 'Sebastian', role: 'bartender', x: 200, y: 350, sprite: 'SebastianS'},
        {name: 'Anna', role: 'visitor no.3', x: 550, y: 350, sprite: 'AnnaS'},
        {name: '???', role: 'courpse', x: 400, y: 250, sprite: 'courpseS'}
    ];

    var killerIndex = 0;
    var INTERROGATABLE_COUNT = 6; // Morgan, Lola, John, Chris, Sebastian, Anna (exclude corpse)
    var SPEAK_RANGE = 85; // distance to show "E to speak" and allow E to open dialog

    function preload() {
        this.load.image('bg', 'images/walls.png');
        this.load.image('floor', 'images/floor.png');
        this.load.image('hero_n', 'images/hero/north.png');
        this.load.image('hero_ne', 'images/hero/north-east.png');
        this.load.image('hero_e', 'images/hero/east.png');
        this.load.image('hero_se', 'images/hero/south-east.png');
        this.load.image('hero_s', 'images/hero/south.png');
        this.load.image('hero_sw', 'images/hero/south-west.png');
        this.load.image('hero_w', 'images/hero/west.png');
        this.load.image('hero_nw', 'images/hero/north-west.png');
        this.load.image('MorganS', 'images/Morgan/south.png');
        this.load.image('AnnaS', 'images/Anna/south.png');
        this.load.image('courpseS', 'images/courpse/east.png');
        this.load.image('JohnS', 'images/John/south.png');
        this.load.image('LizaS', 'images/Liza/south.png');
        this.load.image('LolaS', 'images/Lola/south.png');
        this.load.image('SebastianS', 'images/Sebastian/south.png');
        this.load.image('ChrisS', 'images/Chris/south.png');
    }

    function create() {
        killerIndex = Math.floor(Math.random() * INTERROGATABLE_COUNT);
        window.__killerName = npcData[killerIndex].name;

        var zone = {x: 15, y: 10, width: 770, height: 450};
        this.physics.world.setBounds(zone.x, zone.y, zone.width, zone.height);
        this.add.image(400, 250, 'bg').setOrigin(0.5, 0.5).setDepth(-2);
        this.add.image(400, 250, 'floor').setOrigin(0.5, 0.5).setDepth(-1);

        player = this.add.sprite(56, 56, 'hero_s');
        this.physics.add.existing(player, false);
        player.body.setCollideWorldBounds(true);

        var self = this;
        npcData.forEach(function (data, i) {
            var npcType = i === 6 ? 'corpse' : (i === killerIndex ? 'killer' : 'villain');

            // Visible character sprite
            var spriteImg = self.add.image(data.x, data.y, data.sprite);
            spriteImg.setDepth(0);

            var npc = self.add.zone(data.x, data.y, 60, 60);
            self.physics.add.existing(npc);
            npc.setDepth(1);

            npc.setDataEnabled();
            npc.setData('name', data.name);
            npc.setData('role', data.role);
            npc.setData('personality', data.personality);
            npc.setData('npcType', npcType);

            npc.setInteractive();

            npc.on('pointerdown', function () {
                if (this.getData('npcType') === 'corpse') {
                    window.openDialog({ name: this.getData('name'), role: this.getData('role'), personality: '—', npcType: 'corpse' });
                    return;
                }
                window.openDialog({
                    name: this.getData('name'),
                    role: this.getData('role'),
                    personality: this.getData('personality'),
                    npcType: this.getData('npcType')
                });
            });

            var nameText = self.add.text(data.x, data.y + 40, data.name, {
                fontSize: '16px',
                color: '#ffffff'
            }).setOrigin(0.5).setDepth(2);
            nameText.setStroke('#000', 3);

            var promptText = self.add.text(data.x, data.y + 56, 'E to speak with ' + data.name, {
                fontSize: '15px',
                color: '#e0f4ff'
            }).setOrigin(0.5).setDepth(3).setVisible(false);
            promptText.setStroke('#0a1628', 4);
            npc.setData('speakPrompt', promptText);

            npcs.push(npc);
        });

        this.nearbyNpc = null;
        var eKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
        eKey.on('down', function () {
            if (self.nearbyNpc) {
                var n = self.nearbyNpc;
                if (n.getData('npcType') === 'corpse') {
                    window.openDialog({ name: n.getData('name'), role: n.getData('role'), personality: '—', npcType: 'corpse' });
                } else {
                    window.openDialog({
                        name: n.getData('name'),
                        role: n.getData('role'),
                        personality: n.getData('personality'),
                        npcType: n.getData('npcType')
                    });
                }
            }
        });

        var w = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
        var a = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        var s = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
        var d = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        this.moveKeys = {up: w, down: s, left: a, right: d};
    }

    function update() {
        var px = player.x;
        var py = player.y;
        var closest = null;
        var closestDist = SPEAK_RANGE + 1;
        for (var i = 0; i < npcs.length; i++) {
            var npc = npcs[i];
            var dist = Phaser.Math.Distance.Between(px, py, npc.x, npc.y);
            if (dist <= SPEAK_RANGE && dist < closestDist) {
                closestDist = dist;
                closest = npc;
            }
        }
        this.nearbyNpc = closest;
        for (var j = 0; j < npcs.length; j++) {
            var p = npcs[j].getData('speakPrompt');
            if (p) p.setVisible(npcs[j] === this.nearbyNpc);
        }

        var speed = 180;
        var body = player.body;
        body.setVelocity(0);
        var keys = this.moveKeys;
        var dx = 0, dy = 0, moving = false;
        if (keys.up.isDown) {
            dy = -1;
            moving = true;
        }
        if (keys.down.isDown) {
            dy = 1;
            moving = true;
        }
        if (keys.left.isDown) {
            dx = -1;
            moving = true;
        }
        if (keys.right.isDown) {
            dx = 1;
            moving = true;
        }
        body.setVelocityX(dx * speed);
        body.setVelocityY(dy * speed);
        if (!moving) player.setTexture('hero_s');
        else {
            if (dx === 0 && dy === -1) player.setTexture('hero_n');
            else if (dx === 1 && dy === -1) player.setTexture('hero_ne');
            else if (dx === 1 && dy === 0) player.setTexture('hero_e');
            else if (dx === 1 && dy === 1) player.setTexture('hero_se');
            else if (dx === 0 && dy === 1) player.setTexture('hero_s');
            else if (dx === -1 && dy === 1) player.setTexture('hero_sw');
            else if (dx === -1 && dy === 0) player.setTexture('hero_w');
            else if (dx === -1 && dy === -1) player.setTexture('hero_nw');
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bindDialogAndNotebook);
    } else {
        bindDialogAndNotebook();
    }

    new Phaser.Game(config);
})();

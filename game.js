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
        dialogReply.textContent = 'Ask something using the choices below.';
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
        var all = ['Morgan', 'Lola', 'Vince'];
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
        if (!currentDialogNpc || choiceIndex < 0 || choiceIndex >= CHOICES.length) return;
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
        document.getElementById('notebook-close').addEventListener('click', closeNotebook);
        document.getElementById('notebook-close-btn').addEventListener('click', closeNotebook);
        document.getElementById('open-notebook-fab').addEventListener('click', openNotebook);

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
        killerIndex = Math.floor(Math.random() * 3);

        var zone = {x: 15, y: 10, width: 770, height: 450};
        this.physics.world.setBounds(zone.x, zone.y, zone.width, zone.height);
        this.add.image(400, 250, 'bg').setOrigin(0.5, 0.5).setDepth(-2);
        this.add.image(400, 250, 'floor').setOrigin(0.5, 0.5).setDepth(-1);

        player = this.add.sprite(56, 56, 'hero_s');
        this.physics.add.existing(player, false);
        player.body.setCollideWorldBounds(true);

        var self = this;
        npcData.forEach(function (data, i) {
            var npcType = i === killerIndex ? 'killer' : 'villain';

            var circle = self.add.circle(data.x, data.y, 28, data.color);

            var npc = self.add.zone(data.x, data.y, 60, 60);
            self.physics.add.existing(npc);

            npc.setDataEnabled();
            npc.setData('name', data.name);
            npc.setData('role', data.role);
            npc.setData('personality', data.personality);
            npc.setData('npcType', npcType);


            npc.setInteractive();

            npc.on('pointerdown', function () {
                console.log("clicked", this.getData('name'));

                window.openDialog({
                    name: this.getData('name'),
                    role: this.getData('role'),
                    personality: this.getData('personality'),
                    npcType: this.getData('npcType')
                });
            });


            self.add.text(data.x, data.y + 40, data.name, {
                fontSize: '14px',
                color: '#fff'
            }).setOrigin(0.5);

            npcs.push(npc);
        });


        var w = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
        var a = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        var s = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
        var d = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        this.moveKeys = {up: w, down: s, left: a, right: d};
    }

    function update() {
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

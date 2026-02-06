/**
 * Phaser game – Sheriff + 2 NPCs (Morgan, Lola).
 * Separate from index.html / script.js – no shared code.
 * WASD = move, click NPC = talk (placeholder).
 */

(function () {
  'use strict';

  var config = {
    type: Phaser.AUTO,
    parent: 'game-container',
    width: 800,
    height: 500,
    backgroundColor: '#2d3a4f',
    physics: {
      default: 'arcade',
      arcade: { gravity: { y: 0 } }
    },
    scene: { preload: preload, create: create, update: update }
  };

  var player;
  var cursors;
  var npcs = [];
  var npcData = [
    { name: 'Morgan', role: 'security guard', x: 200, y: 250, color: 0x4a90a4 },
    { name: 'Lola', role: 'hotel guest no.1', x: 550, y: 250, color: 0xa45a8a }
  ];

  function preload() {
    // No assets – we draw shapes in create
  }

  function create() {
    // Player (Sheriff) – blue rectangle
    player = this.add.rectangle(400, 250, 32, 48, 0x3a7ca5);
    this.physics.add.existing(player, false);
    player.body.setCollideWorldBounds(true);

    // NPCs – circles with labels
    npcData.forEach(function (data) {
      var g = this.add.graphics();
      g.fillStyle(data.color, 1);
      g.fillCircle(0, 0, 28);
      var npc = this.add.container(data.x, data.y);
      npc.add(g);
      var label = this.add.text(0, 42, data.name, {
        fontSize: '14px',
        color: '#fff'
      }).setOrigin(0.5, 0);
      npc.add(label);
      npc.setDataEnabled();
      npc.setData({ name: data.name, role: data.role });
      npc.setInteractive(new Phaser.Geom.Circle(0, 0, 32), Phaser.Geom.Circle.Contains);
      npc.on('pointerdown', function () {
        console.log('Talk to', this.getData('name'));
        this.scene.scene.events.emit('npc_clicked', this.getData('name'));
      });
      npcs.push(npc);
    }, this);

    // Keyboard
    cursors = this.input.keyboard.createCursorKeys();
    var w = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    var a = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    var s = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    var d = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);

    // Store for update
    this.moveKeys = { up: w, down: s, left: a, right: d };

    // Optional: show "Talk to X" when NPC clicked (placeholder – no dialog yet)
    this.events.on('npc_clicked', function (name) {
      console.log('Would open dialog for: ' + name);
      // Later: open dialog panel and call API
    });
  }

  function update() {
    var speed = 180;
    var body = player.body;
    body.setVelocity(0);

    var keys = this.moveKeys;
    if (keys.up.isDown) body.setVelocityY(-speed);
    if (keys.down.isDown) body.setVelocityY(speed);
    if (keys.left.isDown) body.setVelocityX(-speed);
    if (keys.right.isDown) body.setVelocityX(speed);
  }

  new Phaser.Game(config);
})();

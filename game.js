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
    { name: 'Morgan', role: 'security guard', x: 200, y: 250, sprite: 'MorganS' },
    { name: 'Lola', role: 'stripper', x: 550, y: 250, sprite: 'LolaS' },
    { name: 'John', role: 'visitor no.1', x: 550, y: 150, sprite: 'JohnS' },
    { name: 'Chris', role: 'visitor no.2', x: 200, y: 150, sprite: 'ChrisS' },
    { name: 'Sebastian', role: 'bartender', x: 200, y: 350, sprite: 'SebastianS' },
    { name: 'Anna', role: 'visitor no.3', x: 550, y: 350, sprite: 'AnnaS' },
    { name: '???', role: 'courpse', x: 400, y: 250, sprite: 'courpseS' }
  ];

  function preload() {
    // No assets – we draw shapes in create
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
    //world
    var zone = { x: 15, y: 10, width: 770, height: 450 };
    this.physics.world.setBounds(zone.x, zone.y, zone.width, zone.height);
    this.add.image(400, 250, 'bg').setOrigin(0.5, 0.5).setDepth(-2);
    this.add.image(400, 250, 'floor').setOrigin(0.5, 0.5).setDepth(-1);

    // Player (Sheriff) – blue rectangle
    player = this.add.sprite(56, 56, 'hero_s'); // по умолчанию смотрит на юг
    this.physics.add.existing(player, false);
    player.body.setCollideWorldBounds(true);

    // NPCs – circles with labels
    npcData.forEach(function (data) {
      var npc = this.add.container(data.x, data.y);

      // Спрайт NPC
      var npcSprite = this.add.sprite(0, 0, data.sprite)
      npc.add(npcSprite);

      // Имя NPC
      var label = this.add.text(
        0,
        npcSprite.displayHeight-170,
        data.name,
        { fontSize: '14px', color: '#fff' }
      ).setOrigin(0.5, 0);

      npc.add(label);

      // Данные NPC
      npc.setDataEnabled();
      npc.setData({
        name: data.name,
        role: data.role
      });

      // Кликабельность по размеру спрайта
      npc.setSize(npcSprite.displayWidth, npcSprite.displayHeight);
      npc.setInteractive();

      npc.on('pointerdown', function () {
        console.log('Talk to', this.getData('name'));
        this.scene.events.emit('npc_clicked', this.getData('name'));
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
    let dx = 0;
    let dy = 0;
    let moving = false;

    // Определяем направление по нажатым клавишам
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

    // Применяем скорость
    body.setVelocityX(dx * speed);
    body.setVelocityY(dy * speed);

    // Смена спрайта в зависимости от направления
    if (!moving) {
        player.setTexture('hero_s'); // стоит → смотрит на юг
    } else {
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

  new Phaser.Game(config);
})();

import * as Phaser from 'phaser';
import { DASH_TIME, DEPTH, LEVEL_MAP, SPEED_DASH, SPEED_WALK, TILE_SIZE, WORLD_H, WORLD_W } from "../config";

interface PlayerKeys {
  up: Phaser.Input.Keyboard.Key;
  down: Phaser.Input.Keyboard.Key;
  left: Phaser.Input.Keyboard.Key;
  right: Phaser.Input.Keyboard.Key;
  pick: Phaser.Input.Keyboard.Key;
  work: Phaser.Input.Keyboard.Key;
  throw: Phaser.Input.Keyboard.Key;
  dash: Phaser.Input.Keyboard.Key;
}

const COMBINATIONS: Record<string, Record<string, string>> = {
  'item_plate': { // container
    'item_tomato_cut': 'item_plate_tomato_cut', // ingredient: result
  }
};

export class GameScene extends Phaser.Scene {
  players: Phaser.Physics.Arcade.Sprite[];
  stations: Phaser.Physics.Arcade.StaticGroup;
  items: Phaser.Physics.Arcade.Group;
  score: number;
  // Store custom player properties separately
  playerData: Map<Phaser.Physics.Arcade.Sprite, {
    id: number;
    keys: PlayerKeys;
    heldItem: Phaser.Physics.Arcade.Sprite | null;
    facing: Phaser.Math.Vector2;
    dash: { active: boolean; timer: number; cooldown: number };
    dashEmitter: Phaser.GameObjects.Particles.ParticleEmitter;
  }>;
  // Store custom station properties
  stationData: Map<Phaser.GameObjects.GameObject, {
    type: string;
    item: Phaser.Physics.Arcade.Sprite | null;
    progress: number;
    barBg?: Phaser.GameObjects.Rectangle;
    bar?: Phaser.GameObjects.Rectangle;
    soupSprite?: Phaser.GameObjects.Sprite;
  }>;
  // Store custom item properties
  itemData: Map<Phaser.Physics.Arcade.Sprite, {
    isFlying: boolean;
    heldBy: Phaser.Physics.Arcade.Sprite | null;
    thrower?: Phaser.Physics.Arcade.Sprite;
    homeStation?: Phaser.GameObjects.GameObject;
  }>;
  constructor() {
    super('GameScene');
    this.playerData = new Map();
    this.stationData = new Map();
    this.itemData = new Map();
  }

  create() {
    this.physics.world.setBounds(0, 0, TILE_SIZE * WORLD_W, TILE_SIZE * WORLD_H);

    // 静态组（桌子/墙）和动态组（物品）
    this.stations = this.physics.add.staticGroup();
    this.items = this.physics.add.group();

    this.createMap();
    this.createPlayers();
    this.createCollisions();

    this.score = 0;
    this.add.text(20, 20, '得分: 0', { fontSize: '32px', fontStyle: 'bold' }).setDepth(DEPTH.UI).setName('scoreText');
  }

  createMap() {
    // 1. 地板
    for (let y = 0; y < WORLD_H; y++) {
      for (let x = 0; x < WORLD_W; x++) {
        if (LEVEL_MAP[y][x] !== 'X') {
          this.add.image(x * TILE_SIZE + 24, y * TILE_SIZE + 24, 'floor').setDepth(DEPTH.FLOOR);
        }
      }
    }

    // 2. 实体对象
    for (let y = 0; y < LEVEL_MAP.length; y++) {
      for (let x = 0; x < LEVEL_MAP[y].length; x++) {
        const char = LEVEL_MAP[y][x];
        if (char === 'F' || char === ' ') continue;

        const px = x * TILE_SIZE + 24;
        const py = y * TILE_SIZE + 24;

        let key = 'station_counter';
        let type = 'counter';
        let initItem = null;

        switch (char) {
          case 'X': key = 'station_wall'; type = 'wall'; break;
          case '.': key = 'station_counter'; type = 'counter'; break;
          case 'd': key = 'station_counter'; type = 'dirty_spawn'; break;
          case 'a': key = 'station_counter'; type = 'counter'; initItem = 'item_plate'; break;
          case 'B': key = 'station_crate'; type = 'crate'; break;
          case 'C': key = 'station_cut'; type = 'cut'; break;
          case 'S': key = 'station_pot'; type = 'pot'; break;
          case 'K': key = 'station_sink'; type = 'sink'; break;
          case 'D': key = 'station_delivery'; type = 'delivery'; break;
          case 'T': key = 'station_trash'; type = 'trash'; break;
        }

        const s = this.stations.create(px, py, key);
        s.setDepth(DEPTH.STATION);

        if (type === 'wall') continue;

        // Store station data
        const stationObj = s as Phaser.GameObjects.GameObject;
        this.stationData.set(stationObj, {
          type: type,
          item: null,
          progress: 0
        });

        // 初始化盘子
        if (initItem) {
          const item = this.spawnItemWorld(initItem, px, py, stationObj);
          const stationData = this.stationData.get(stationObj);
          if (stationData) {
            stationData.item = item;
          }
        }

        // 进度条
        if (['cut', 'sink', 'pot'].includes(type)) {
          const barBg = this.add.rectangle(px, py - 30, 40, 6, 0x000000).setDepth(DEPTH.UI).setVisible(false);
          const bar = this.add.rectangle(px - 20, py - 30, 0, 4, 0x00ff00).setDepth(DEPTH.UI + 1).setOrigin(0, 0.5).setVisible(false);

          const existingData = this.stationData.get(stationObj);
          if (existingData) {
            existingData.barBg = barBg;
            existingData.bar = bar;
          }
        }
        // 锅内汤特效
        if (type === 'pot') {
          const soupSprite = this.add.sprite(px, py, 'item_soup_pot').setDepth(DEPTH.STATION + 1).setVisible(false);
          const existingData = this.stationData.get(stationObj);
          if (existingData) {
            existingData.soupSprite = soupSprite;
          }
        }
      }
    }
  }

  createPlayers() {
    this.players = [];
    // P1: Blue, Left Shift
    this.addPlayer(0, 200, 300, 0x4da6ff, {
      up: 'W', down: 'S', left: 'A', right: 'D', pick: 'E', work: 'R', throw: 'SPACE', dash: 'SHIFT'
    });
    // P2: Red, use different key for sprinting
    this.addPlayer(1, 300, 300, 0xff4444, {
      up: 'UP', down: 'DOWN', left: 'LEFT', right: 'RIGHT', pick: 'O', work: 'P', throw: 'L', dash: 'ENTER'
    });
  }

  addPlayer(id: number, x: number, y: number, color: number, keyMap: { [key: string]: string }) {
    const p = this.physics.add.sprite(x, y, 'player');
    p.setTint(color);
    p.setDepth(DEPTH.PLAYER);
    if (p.body) {
      p.body.setCircle(14, 2, 2);
      p.body.setCollideWorldBounds(true);
    }

    // Store player data separately
    if (!this.input.keyboard) return;

    const dashEmitter = this.add.particles(3, 3, 'particle_smoke');
    dashEmitter.setConfig({
      speed: 100,
      scale: { start: 0.5, end: 0 },
              blendMode: 'ADD',
              lifespan: 300    });
    dashEmitter.startFollow(p);

    this.playerData.set(p, {
      id: id,
      keys: this.input.keyboard.addKeys(keyMap) as PlayerKeys,
      heldItem: null,
      facing: new Phaser.Math.Vector2(1, 0),
      dash: { active: false, timer: 0, cooldown: 0 },
      dashEmitter: dashEmitter
    });

    this.players.push(p);
  }


  createCollisions() {

    this.players.forEach(player1 => {
      // 玩家撞桌子
      this.physics.add.collider(player1, this.stations);
      // 玩家互撞 (改进的碰撞处理)
      this.players.forEach(player2 => {
        if (player1 !== player2) {  // Don't collide player with themselves
          this.physics.add.collider(player1, player2, (p1Obj, p2Obj) => {
            const p1 = p1Obj as Phaser.Physics.Arcade.Sprite;
            const p2 = p2Obj as Phaser.Physics.Arcade.Sprite;

            // Get player data
            const p1Data = this.playerData.get(p1);
            const p2Data = this.playerData.get(p2);

            if (!p1Data || !p2Data) return; // Safety check

            // 在Overcooked中, 玩家可以互相通过, 但会有轻微的 slowdown
            // Only slow down if both players are moving toward each other
            const p1ToP2 = new Phaser.Math.Vector2(p2.x - p1.x, p2.y - p1.y).normalize();
            const p1MovingTowardP2 = p1.body && p1.body.velocity ? p1.body.velocity.dot(p1ToP2) > 0 : false;
            const p2MovingTowardP1 = p2.body && p2.body.velocity ? p2.body.velocity.dot(p1ToP2.scale(-1)) > 0 : false;

            if (p1.body && p2.body) {
              if (p1MovingTowardP2 && p2MovingTowardP1) {
                // Both moving toward each other - slow them down
                if (p1.body instanceof Phaser.Physics.Arcade.Body) {
                  p1.body.setVelocity(p1.body.velocity.x * 0.5, p1.body.velocity.y * 0.5);
                }
                if (p2.body instanceof Phaser.Physics.Arcade.Body) {
                  p2.body.setVelocity(p2.body.velocity.x * 0.5, p2.body.velocity.y * 0.5);
                }
              } else if (p1Data.dash.active && p2Data.dash.active) {
                // Both dashing - reduce velocity but don't stop completely
                if (p1.body instanceof Phaser.Physics.Arcade.Body) {
                  p1.body.setVelocity(p1.body.velocity.x * 0.3, p1.body.velocity.y * 0.3);
                }
                if (p2.body instanceof Phaser.Physics.Arcade.Body) {
                  p2.body.setVelocity(p2.body.velocity.x * 0.3, p2.body.velocity.y * 0.3);
                }
              } else if (p1Data.dash.active) {
                // Only P1 dashing - P1 continues, P2 gets nudged slightly
                const bump = p1ToP2.scale(100);
                if (p2.body instanceof Phaser.Physics.Arcade.Body) {
                  p2.body.setVelocity(p2.body.velocity.x + bump.x, p2.body.velocity.y + bump.y);
                }
              } else if (p2Data.dash.active) {
                // Only P2 dashing - P2 continues, P1 gets nudged slightly
                const bump = p1ToP2.scale(-100);
                if (p1.body instanceof Phaser.Physics.Arcade.Body) {
                  p1.body.setVelocity(p1.body.velocity.x + bump.x, p1.body.velocity.y + bump.y);
                }
              }
            }
          });
        }
      });
    });



    // 投掷物撞桌子 -> 吸附或交互
    this.physics.add.overlap(this.items, this.stations, (itemObj, stationObj) => {
      const item = itemObj as Phaser.Physics.Arcade.Sprite;
      const station = stationObj as Phaser.Physics.Arcade.Sprite;

      // Get item data
      const itemData = this.itemData.get(item);
      if (!itemData) return; // Safety check

      if (itemData.isFlying) {
        const stationData = this.stationData.get(station);
        if (!stationData) return; // Safety check

        const sType = stationData.type;
        const hasItem = stationData.item;

        // Special case for delivery
        if (sType === 'delivery' && item.texture.key === 'item_soup') {
          this.deliverItemToStation(item, station);
          return; // Delivery handled
        }

        // If destination can accept the item
        if (!hasItem) {
          // These stations accept any item
          if (['counter', 'cut', 'sink', 'trash'].includes(sType)) { // Removed 'delivery'
            this.placeItemOnStation(item, station);
          }
          // These stations accept only specific items
          else if (sType === 'pot' && item.texture.key === 'item_tomato_cut') {
            this.placeItemOnStation(item, station);
          }
        }
        // If item doesn't belong here, bounce off slightly
        else {
          // Bounce off with reduced velocity
          if (item.body && item.body instanceof Phaser.Physics.Arcade.Body && item.body.setVelocity) {
            item.body.setVelocity(item.body.velocity.x * -0.3, item.body.velocity.y * -0.3);
            // Slightly push it away from the station
            const dx = item.x - station.x;
            const dy = item.y - station.y;
            item.body.setVelocity(item.body.velocity.x + dx * 0.2, item.body.velocity.y + dy * 0.2);
          }
        }
      }
    });

    // 投掷物撞墙/边界
    this.items.children.iterate((iObj: Phaser.GameObjects.GameObject) => {
      const item = iObj as Phaser.Physics.Arcade.Sprite;
      if (item.setCollideWorldBounds) {
        item.setCollideWorldBounds(true);
      }
      // Set appropriate body size based on item type
      if (item.texture.key === 'item_plate' || item.texture.key === 'item_soup' || item.texture.key === 'item_plate_dirty') {
        if (item.body && item.body instanceof Phaser.Physics.Arcade.Body) {
          item.body.setCircle(20, -4, -4); // Larger circle for bigger plates
        }
      } else {
        if (item.body && item.body instanceof Phaser.Physics.Arcade.Body) {
          item.body.setCircle(14, 2, 2); // Default size for other items
        }
      }
      return true; // Required by iterate to continue
    });
  }

  update(_time: number, delta: number) {
    this.players.forEach(p => this.updatePlayer(p, delta));
    this.updateStations(delta);
  }

  updatePlayer(p: Phaser.Physics.Arcade.Sprite, delta: number) {
    // Get player data
    const pData = this.playerData.get(p);
    if (!pData) return; // Safety check

    // 1. 冲刺冷却
    if (pData.dash.cooldown > 0) pData.dash.cooldown -= delta;

    // 2. 冲刺状态
    if (pData.dash.active) {
      pData.dash.timer -= delta;
      if (pData.dash.timer <= 0) {
        pData.dash.active = false;
        pData.dashEmitter.stop();
      }
      // 冲刺时保持当前速度向量
      if (p.body) {
        p.body.velocity.normalize().scale(SPEED_DASH);
      }
      // 物品跟随
      if (pData.heldItem) {
        pData.heldItem.x = p.x;
        pData.heldItem.y = p.y;
      }
      return;
    }

    // 3. 输入检测
    let dx = 0, dy = 0;
    if (pData.keys.up.isDown) dy = -1;
    else if (pData.keys.down.isDown) dy = 1;
    if (pData.keys.left.isDown) dx = -1;
    else if (pData.keys.right.isDown) dx = 1;

    // 移动
    if (p.body instanceof Phaser.Physics.Arcade.Body) {
      p.body.setVelocity(dx * SPEED_WALK, dy * SPEED_WALK);
    }

    // 旋转 (三角形指向)
    if (dx || dy) {
      pData.facing.set(dx, dy).normalize();
      p.rotation = pData.facing.angle();
    }

    // 触发冲刺
    if (Phaser.Input.Keyboard.JustDown(pData.keys.dash) && pData.dash.cooldown <= 0) {
      let dash_dx = dx;
      let dash_dy = dy;

      // If not moving, use facing direction
      if (dash_dx === 0 && dash_dy === 0) {
        dash_dx = pData.facing.x;
        dash_dy = pData.facing.y;
      }

      // Normalize and apply dash speed
      const dashVec = new Phaser.Math.Vector2(dash_dx, dash_dy).normalize();
      if (dashVec.length() > 0) {
        pData.dash.active = true;
        pData.dash.timer = DASH_TIME;
        pData.dash.cooldown = 300;
        pData.dashEmitter.start();
        if (p.body instanceof Phaser.Physics.Arcade.Body) {
          dashVec.scale(SPEED_DASH);
          p.body.setVelocity(dashVec.x, dashVec.y);
        }
      }
    }

    // 交互
    const target = this.getInteractTarget(p);

    if (Phaser.Input.Keyboard.JustDown(pData.keys.pick)) {
      if (pData.heldItem) {
        // Holding item: try to place it on a station, or on the floor
        if (target.station) {
          this.interactStation(p, target.station);
        } else {
          this.placeItemOnFloor(p); // New function
        }
      } else {
        // Empty handed: try to pick up from station or floor
        if (target.station) {
          this.interactStation(p, target.station); // interactStation handles pickup from station
        } else if (target.item) {
          this.pickupItem(p, target.item);
        }
      }
    }

    if (Phaser.Input.Keyboard.JustDown(pData.keys.throw) && pData.heldItem) {
      this.throwItem(p);
    }

    if (pData.keys.work.isDown && target.station) {
      this.workStation(p, target.station, delta);
    }

    // 物品跟随
    if (pData.heldItem) {
      pData.heldItem.x = p.x;
      pData.heldItem.y = p.y;
      pData.heldItem.setDepth(DEPTH.PLAYER + 1); // 拿在人上面
    }
  }

  placeItemOnFloor(p: Phaser.Physics.Arcade.Sprite) {
    const pData = this.playerData.get(p);
    if (!pData || !pData.heldItem) return;

    const item = pData.heldItem;
    const itemData = this.itemData.get(item);
    if (!itemData) return;

    // Position it in front of the player
    item.x = p.x + pData.facing.x * 32;
    item.y = p.y + pData.facing.y * 32;

    pData.heldItem = null;
    itemData.heldBy = null;
    if (item.body) {
      item.body.enable = true;
    }

    // Make sure it doesn't fly away
    if (item.body instanceof Phaser.Physics.Arcade.Body) {
      item.body.setVelocity(0, 0);
    }
  }

  getInteractTarget(p: Phaser.Physics.Arcade.Sprite): { station: Phaser.Physics.Arcade.Sprite | null, item: Phaser.Physics.Arcade.Sprite | null } {
    // Get player data
    const pData = this.playerData.get(p);
    if (!pData) return { station: null, item: null }; // Safety check

    const lookX = p.x + pData.facing.x * 32;
    const lookY = p.y + pData.facing.y * 32;

    // 优先桌子
    let station: Phaser.Physics.Arcade.Sprite | null = null;
    const stations = this.stations.getChildren();
    for (const s of stations) {
      const stationSprite = s as Phaser.Physics.Arcade.Sprite;
      if (stationSprite.getBounds().contains(lookX, lookY)) {
        station = stationSprite;
        break;
      }
    }

    // 其次地上的
    let item: Phaser.Physics.Arcade.Sprite | null = null;
    if (!station && !pData.heldItem) {
      const items = this.items.getChildren();
      for (const i of items) {
        const itemSprite = i as Phaser.Physics.Arcade.Sprite;
        // Get item data to check if it's held or flying
        const itemData = this.itemData.get(itemSprite);
        if (itemData && !itemData.heldBy && !itemData.isFlying && Phaser.Math.Distance.Between(p.x, p.y, itemSprite.x, itemSprite.y) < 40) {
          item = itemSprite;
          break;
        }
      }
    }
    return { station, item };
  }

  interactStation(p: Phaser.Physics.Arcade.Sprite, s: Phaser.Physics.Arcade.Sprite) {
    // Get player and station data
    const pData = this.playerData.get(p);
    const sData = this.stationData.get(s);

    if (!pData || !sData) return; // Safety check

    const type = sData.type;
    const sItem = sData.item;
    const pItem = pData.heldItem;

    // === 1. 手里是空的 ===
    if (!pItem) {
      if (sItem) {
        // If it's a pot with ready soup, can't pick up without a plate.
        if (type === 'pot' && sData.progress >= 100) {
          return; // Do nothing if empty-handed
        }

        // 拿起桌上的
        this.pickupItem(p, sItem);
        sData.item = null;
        // 如果是锅，重置进度
        if (type === 'pot') {
          sData.progress = 0;
          if (sData.soupSprite) sData.soupSprite.setVisible(false);
        }
        // For cutting board, make sure it's properly reset after taking the item
        if (type === 'cut') {
          if (sData.barBg) sData.barBg.setVisible(false);
          if (sData.bar) sData.bar.setVisible(false);
        }
      } else {
        // 生成新物品
        if (type === 'crate') this.spawnItem(p, 'item_tomato');
      }
    }
    // === 2. 手里有东西 ===
    else {
      // 桌子是空的 -> 放下
      if (!sItem) {
        // 特殊检查
        if (type === 'trash') {
          this.add.particles(3, 3, 'particle_smoke').emitParticleAt(s.x, s.y, 10);

          const itemData = this.itemData.get(pItem);
          // Check if it's a plate and has a home station
          if (itemData && itemData.homeStation && (pItem.texture.key === 'item_plate' || pItem.texture.key === 'item_plate_dirty' || pItem.texture.key === 'item_soup' || pItem.texture.key === 'item_plate_tomato_cut')) {
            const homeStation = itemData.homeStation;
            const homeStationSprite = homeStation as Phaser.Physics.Arcade.Sprite;

            this.time.delayedCall(5000, () => {
              const homeStationData = this.stationData.get(homeStation);
              if (homeStationData && !homeStationData.item) {
                const newItem = this.spawnItemWorld('item_plate', homeStationSprite.x, homeStationSprite.y, homeStation);
                homeStationData.item = newItem;
              }
            });
          }

          this.itemData.delete(pItem);
          pItem.destroy();
          pData.heldItem = null;
          return;
        }
        if (type === 'delivery') {
          if (pItem.texture.key === 'item_soup') this.deliver(p);
          return;
        }
        if (type === 'pot' && pItem.texture.key !== 'item_tomato_cut') return; // 锅只收切好的

        // 普通放下
        this.placeItemOnStation(pItem, s);
        pData.heldItem = null;
        const itemData = this.itemData.get(pItem);
        if (itemData) {
          itemData.heldBy = null;
        }
      }
      // 桌子有东西 -> 尝试合并
      else {
        const pKey = pItem.texture.key;
        const sKey = sItem.texture.key;

        // 盘子 + 锅里的汤 -> 盛汤
        if (pKey === 'item_plate' && type === 'pot' && sData.progress >= 100) {
          this.itemData.delete(pItem);
          pItem.destroy();
          this.spawnItem(p, 'item_soup'); // 玩家变成拿汤
          if (sItem) {
            this.itemData.delete(sItem);
            sItem.destroy();
          }
          sData.item = null; // 锅空了
          sData.progress = 0;
          if (sData.soupSprite) sData.soupSprite.setVisible(false);
        }
        // Player holds ingredient, station has container
        else if (COMBINATIONS[sKey] && COMBINATIONS[sKey][pKey]) {
          const result = COMBINATIONS[sKey][pKey];
          this.itemData.delete(pItem);
          pItem.destroy();
          pData.heldItem = null;
          sItem.setTexture(result);
        }
        // Player holds container, station has ingredient
        else if (COMBINATIONS[pKey] && COMBINATIONS[pKey][sKey]) {
          const result = COMBINATIONS[pKey][sKey];
          this.itemData.delete(sItem);
          sItem.destroy();
          sData.item = null;
          pItem.setTexture(result);
        }
      }
    }
  }

  workStation(p: Phaser.Physics.Arcade.Sprite, s: Phaser.Physics.Arcade.Sprite, delta: number) {
    // Get player and station data
    const pData = this.playerData.get(p);
    const sData = this.stationData.get(s);

    if (!pData || !sData) return; // Safety check

    const type = sData.type;
    const item = sData.item;
    if (!item) return;

    let prog = sData.progress;
    let valid = false;
    let workSpeed = 0.15; // Default work speed

    // 切菜
    if (type === 'cut' && item.texture.key === 'item_tomato') {
      valid = true;
      workSpeed = 0.15;
    }
    // 洗碗
    else if (type === 'sink' && item.texture.key === 'item_plate_dirty') {
      valid = true;
      workSpeed = 0.12; // Slightly slower than cutting for balance
    }

    if (valid) {
      prog += delta * workSpeed;
      if (sData.barBg) sData.barBg.setVisible(true);
      if (sData.bar) sData.bar.setVisible(true);
      if (sData.bar) sData.bar.width = (prog / 100) * 40;

      // Visual effect (bubbles for sink, chopping for cutting board)
      if (type === 'sink') {
        // Water ripples effect by moving the plate slightly
        item.x = s.x + Math.sin(this.game.getTime() * 0.01) * 1.5;
      } else {
        // Chopping effect by moving the tomato
        item.x = s.x + (Math.random() - 0.5) * 2;
      }

      if (prog >= 100) {
        prog = 0;
        if (sData.barBg) sData.barBg.setVisible(false);
        if (sData.bar) sData.bar.setVisible(false);

        if (type === 'cut') {
          item.setTexture('item_tomato_cut');
          // Reset position after cutting
          item.x = s.x;
          item.y = s.y;

          // Visual effect for cut tomato
          const cutText = this.add.text(s.x, s.y - 30, 'Chopped!', { fontSize: '14px', color: '#ff9900' })
            .setOrigin(0.5).setDepth(DEPTH.UI);
          this.tweens.add({
            targets: cutText,
            y: s.y - 50,
            alpha: 0,
            duration: 800,
            onComplete: () => cutText.destroy()
          });
        }
        else if (type === 'sink') {
          item.setTexture('item_plate');
          // Reset position after washing
          item.x = s.x;
          item.y = s.y;

          // Visual effect for clean plate
          const cleanText = this.add.text(s.x, s.y - 30, 'Clean!', { fontSize: '14px', color: '#00ff00' })
            .setOrigin(0.5).setDepth(DEPTH.UI);
          this.tweens.add({
            targets: cleanText,
            y: s.y - 50,
            alpha: 0,
            duration: 800,
            onComplete: () => cleanText.destroy()
          });
        }
      }
      sData.progress = prog;
    }
  }

  updateStations(delta: number) {
    this.stations.getChildren().forEach((s: Phaser.GameObjects.GameObject) => {
      const stationSprite = s as Phaser.Physics.Arcade.Sprite;
      const sData = this.stationData.get(s);
      if (!sData) return; // Safety check

      const item = sData.item;
      const type = sData.type;

      if (item) {
        // 确保物品吸附在桌子上 (除非正在被震动)
        if (!sData.bar || !sData.bar.visible) {
          item.x = stationSprite.x;
          item.y = stationSprite.y;
        }
        item.setDepth(DEPTH.ITEM); // 物品在桌子层之上
      }

      // 自动煮汤
      if (type === 'pot' && item && item.texture.key === 'item_tomato_cut') {
        let prog = sData.progress + delta * 0.05;
        if (sData.barBg) sData.barBg.setVisible(true);
        if (sData.bar) {
          sData.bar.setVisible(true);
          sData.bar.fillColor = 0xffaa00;
          sData.bar.width = (prog / 100) * 40;
        }

        if (prog >= 100) {
          prog = 100;
          if (item) {
            item.setVisible(false); // 隐藏番茄块
          }
          if (sData.soupSprite) sData.soupSprite.setVisible(true); // 显示汤
        }
        sData.progress = prog;
      }
      // Handle cutting when item is processed
      else if (type === 'cut' && item && item.texture.key === 'item_tomato_cut') {
        // Once cut, make sure progress bar is hidden if no active work
        if (sData.progress <= 0) {
          if (sData.barBg) sData.barBg.setVisible(false);
          if (sData.bar) sData.bar.setVisible(false);
        }
      }
      else if (type === 'pot' && !item) {
        if (sData.barBg) sData.barBg.setVisible(false);
        if (sData.bar) sData.bar.setVisible(false);
      }
    });
  }

  spawnItem(p: Phaser.Physics.Arcade.Sprite, key: string): void {
    const item = this.physics.add.sprite(p.x, p.y, key);
    this.items.add(item);

    // Set initial item data
    this.itemData.set(item, {
      isFlying: false,
      heldBy: null
    });

    this.pickupItem(p, item);
  }

  spawnItemWorld(key: string, x: number, y: number, homeStation?: Phaser.GameObjects.GameObject): Phaser.Physics.Arcade.Sprite {
    const item = this.physics.add.sprite(x, y, key);
    this.items.add(item);

    // Set appropriate body size based on item type
    if (key === 'item_plate' || key === 'item_soup' || key === 'item_plate_dirty' || key === 'item_plate_tomato_cut') {
      if (item.body && item.body instanceof Phaser.Physics.Arcade.Body) {
        item.body.setCircle(20, -4, -4); // Larger circle for bigger plates
      }
    } else {
      if (item.body && item.body instanceof Phaser.Physics.Arcade.Body) {
        item.body.setCircle(14, 2, 2); // Default size for other items
      }
    }

    // Set initial item data
    this.itemData.set(item, {
      isFlying: false,
      heldBy: null,
      homeStation: homeStation
    });

    return item;
  }

  pickupItem(p: Phaser.Physics.Arcade.Sprite, item: Phaser.Physics.Arcade.Sprite) {
    // Get player and item data
    const pData = this.playerData.get(p);
    const itemData = this.itemData.get(item);

    if (!pData || !itemData) return; // Safety check

    if (pData.heldItem) return;

    pData.heldItem = item;
    itemData.heldBy = p;
    itemData.isFlying = false;

    if (item.body) {
      item.body.enable = false; // 拿在手里无物理
    }
    item.setVisible(true);

    // When picked up, items should follow the player regardless of size
    // The size handling is already done when the item is created
  }

  placeItemOnStation(item: Phaser.Physics.Arcade.Sprite, s: Phaser.Physics.Arcade.Sprite) {
    // Get item data
    const itemData = this.itemData.get(item);
    if (!itemData) return; // Safety check

    if (item.body && item.body instanceof Phaser.Physics.Arcade.Body) {
      item.body.enable = false;
      if (item.body.setVelocity) {
        item.body.setVelocity(0, 0);
      }
    }
    itemData.isFlying = false;
    itemData.heldBy = null;

    // Update station data
    const sData = this.stationData.get(s);
    if (sData) {
      sData.item = item;
    }

    item.x = s.x;
    item.y = s.y;

    // Ensure proper depth for all items
    item.setDepth(DEPTH.ITEM);
  }

  throwItem(p: Phaser.Physics.Arcade.Sprite) {
    // Get player data
    const pData = this.playerData.get(p);
    if (!pData) return; // Safety check

    const item = pData.heldItem;
    if (!item) return;

    pData.heldItem = null;

    // Get item data
    const itemData = this.itemData.get(item);
    if (itemData) {
      itemData.heldBy = null;
      itemData.isFlying = true;
      itemData.thrower = p;
    }

    if (item.body && item.body instanceof Phaser.Physics.Arcade.Body) {
      item.body.enable = true;
      // Get player facing from player data
      const playerData = this.playerData.get(p);
      if (playerData && item.body.setVelocity) {
        const vec = playerData.facing.clone().scale(500);
        item.body.setVelocity(vec.x, vec.y);
      }
      if (item.body.setDrag) {
        item.body.setDrag(300); // 空气阻力
      }
    }

    // 1秒后重置飞行状态
    this.time.delayedCall(1000, () => {
      const updatedItemData = this.itemData.get(item);
      if (updatedItemData) {
        updatedItemData.isFlying = false;
      }
    });
  }

  deliver(p: Phaser.Physics.Arcade.Sprite) {
    // Get player data
    const pData = this.playerData.get(p);
    if (!pData || !pData.heldItem) return;

    const item = pData.heldItem;
    if (item.texture.key !== 'item_soup') return;

    pData.heldItem = null; // Unset first
    this.itemData.delete(item);

    // Make it invisible and schedule for destruction
    item.setVisible(false);
    if (item.body) item.body.enable = false;
    this.time.delayedCall(100, () => item.destroy());


    this.score += 60; // Increased score for serving
    const scoreText = this.children.getByName('scoreText');
    if (scoreText && 'setText' in scoreText && typeof (scoreText as any).setText === 'function') {
      (scoreText as Phaser.GameObjects.Text).setText('得分: ' + this.score);
    }

    // Visual feedback for successful delivery
    const deliveryText = this.add.text(p.x, p.y - 30, '+60', { fontSize: '20px', color: '#ffff00' })
      .setOrigin(0.5).setDepth(DEPTH.UI);
    this.tweens.add({
      targets: deliveryText,
      y: p.y - 60,
      alpha: 0,
      duration: 1000,
      onComplete: () => deliveryText.destroy()
    });

    // Generate dirty plate: appears at a designated spot after a delay
    this.time.delayedCall(3000, () => {
      // Find dirty plate spawn stations by checking our station data
      const allStations = this.stations.getChildren();
      const dirtySpawnStations = allStations.filter(s => {
        const sData = this.stationData.get(s);
        return sData && sData.type === 'dirty_spawn';
      });

      if (dirtySpawnStations.length > 0) {
        // Use the first dirty spawn station found
        const dirtySpawnStation = dirtySpawnStations[0] as Phaser.Physics.Arcade.Sprite;

        // Now get the station data to check if it has an item
        const dirtySpawnStationData = this.stationData.get(dirtySpawnStation as Phaser.GameObjects.GameObject);
        if (dirtySpawnStationData && !dirtySpawnStationData.item) {
          const dirty = this.spawnItemWorld('item_plate_dirty', dirtySpawnStation.x, dirtySpawnStation.y);
          dirtySpawnStationData.item = dirty;
        } else {
          // If the dirty spawn station is occupied, spawn on an adjacent empty counter
          this.spawnDirtyPlateNearDelivery(dirtySpawnStation);
        }
      }
    });
  }

  // Helper function to spawn a dirty plate near delivery area if delivery station is occupied
  spawnDirtyPlateNearDelivery(deliveryStation: Phaser.Physics.Arcade.Sprite) {
    // Define directions to try: up, down, left, right
    const directions = [
      { x: 0, y: -TILE_SIZE },  // up
      { x: 0, y: TILE_SIZE },   // down
      { x: -TILE_SIZE, y: 0 },  // left
      { x: TILE_SIZE, y: 0 }    // right
    ];

    for (const dir of directions) {
      const testX = deliveryStation.x + dir.x;
      const testY = deliveryStation.y + dir.y;

      // Check if there's a counter at this location by checking our station data
      const allStations = this.stations.getChildren();
      const potentialCounter = allStations.find(s => {
        const stationSprite = s as Phaser.Physics.Arcade.Sprite;
        const sData = this.stationData.get(s);
        return stationSprite.x === testX && stationSprite.y === testY && sData && sData.type === 'counter';
      });

      if (potentialCounter) {
        const potentialCounterObj = potentialCounter as Phaser.GameObjects.GameObject;
        const potentialCounterData = this.stationData.get(potentialCounterObj);
        if (potentialCounterData && !potentialCounterData.item) {
          const dirty = this.spawnItemWorld('item_plate_dirty', testX, testY);
          potentialCounterData.item = dirty;
          return; // Successfully placed
        }
      }
    }

    // If no adjacent counters are free, just place it at the delivery station anyway
    const allStations = this.stations.getChildren();
    const deliveryStations = allStations.filter(s => {
      const sData = this.stationData.get(s);
      return sData && sData.type === 'delivery';
    });

    if (deliveryStations.length > 0) {
      const fallbackStation = deliveryStations[0] as Phaser.Physics.Arcade.Sprite;
      const fallbackData = this.stationData.get(fallbackStation);
      if (fallbackData) {
        const dirty = this.spawnItemWorld('item_plate_dirty', fallbackStation.x, fallbackStation.y);
        if (!fallbackData.item) {
          fallbackData.item = dirty;
        }
      }
    }
  }

  // Handle item delivery when soup is thrown to delivery station
  deliverItemToStation(item: Phaser.Physics.Arcade.Sprite, station: Phaser.Physics.Arcade.Sprite) {
    if (item.texture.key === 'item_soup') {
      // Complete the delivery
      this.score += 60;
      const scoreText = this.children.getByName('scoreText');
      if (scoreText && 'setText' in scoreText && typeof (scoreText as any).setText === 'function') {
        (scoreText as Phaser.GameObjects.Text).setText('得分: ' + this.score);
      }

      // Visual feedback
      const deliveryText = this.add.text(station.x, station.y - 30, '+60', { fontSize: '20px', color: '#ffff00' })
        .setOrigin(0.5).setDepth(DEPTH.UI);
      this.tweens.add({
        targets: deliveryText,
        y: station.y - 60,
        alpha: 0,
        duration: 1000,
        onComplete: () => deliveryText.destroy()
      });

      // Remove the soup item
      item.destroy();

      // Remove item data
      this.itemData.delete(item);

      // Schedule dirty plate generation
      this.time.delayedCall(3000, () => {
        const stationData = this.stationData.get(station);
        if (stationData && !stationData.item) {
          const dirty = this.spawnItemWorld('item_plate_dirty', station.x, station.y);
          stationData.item = dirty;
        } else {
          // If already occupied, place near delivery as before
          this.spawnDirtyPlateNearDelivery(station);
        }
      });
    }
  }
}

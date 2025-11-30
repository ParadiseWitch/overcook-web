import { Player } from '../player/Player';

const players: Player[] = []; // 玩家列表

const createPlayer = (player: Player) => {
  players.push(player);
  // // P1 玩家
  // const p1Spawn = this.stationMgr.playerSpawnPoints['P1'] || { x: 200, y: 300 };
  // const p1 = new Player(this, 0, p1Spawn.x, p1Spawn.y, 0x4da6ff, {
  //   up: 'W', down: 'S', left: 'A', right: 'D', pick: 'E', work: 'R', throw: 'SPACE', dash: 'SHIFT'
  // });
  // // P2 玩家
  // const p2Spawn = this.stationMgr.playerSpawnPoints['P2'] || { x: 300, y: 300 };
  // const p2 = new Player(this, 1, p2Spawn.x, p2Spawn.y, 0xff4444, {
  //   up: 'UP', down: 'DOWN', left: 'LEFT', right: 'RIGHT', pick: 'O', work: 'P', throw: 'L', dash: 'ENTER'
  // });
}


const updatePlayers = (delta: number) => {
  players.forEach(p => p.update(delta));
}

export default {
  players,
  createPlayer,
  updatePlayers,
}
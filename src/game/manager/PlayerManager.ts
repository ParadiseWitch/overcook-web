import { Player } from '../player/Player';

export const ALL_PLAYERS: Player[] = []; // 玩家列表

export const createPlayer = (player: Player) => {
  ALL_PLAYERS.push(player);
}


export const updatePlayers = (delta: number) => {
  ALL_PLAYERS.forEach(p => p.update(delta));
}
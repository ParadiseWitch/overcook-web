import * as Phaser from 'phaser';

// 导入所有工作站类型
import { Plate } from '../item/container/plate';
import { Pot } from '../item/container/pot';
import { Tomato } from '../item/ingredient/tomato';
import { CounterStation } from '../stations/counter-station';
import { CutStation } from '../stations/cut-station';
import { DeliveryStation } from '../stations/delivery-station';
import { DirtyPlateStation } from '../stations/dirty-plate-station';
import { IngredientStation } from '../stations/ingredient-station';
import { PotStation } from '../stations/pot-station';
import { SinkStation } from '../stations/sink-station';
import { Station } from '../stations/station';
import { TrashStation } from '../stations/trash-station';
import { ALL_ITEMS } from './item-manager';


export const ALL_STATIONS: Station[] = []


export const createStation = (scene: Phaser.Scene, char: string, px: number, py: number) => {
  let station: Station | null = null;
  // let initItemKey: string | null = null;

  // 根据地图字符创建不同类型的工作站
  switch (char) {
    // case 'X':
    //   // 虚无，悬崖
    //   stationGroup?.create(px, py, 'station_nothing').setDepth(DEPTH.STATION);
    //   continue;
    case '.':
      // textureKey = 'station_counter';
      station = new CounterStation(scene, px, py);
      break;
    case 'a':
      // textureKey = 'station_counter';
      station = new CounterStation(scene, px, py);
      const plate = new Plate(scene, px, py, 'empty');
      station.placeItem(plate);
      ALL_ITEMS.push(plate);
      break;
    case 'B':
      // textureKey = 'station_counter';
      station = new IngredientStation(scene, px, py, Tomato);
      break;
    case 'C': station = new CutStation(scene, px, py); break;
    case 'S':
      station = new PotStation(scene, px, py);
      const pot = new Pot(scene, px, py, 'empty');
      station.placeItem(pot);
      ALL_ITEMS.push(pot);
      break;
    case 'K': station = new SinkStation(scene, px, py); break;
    case 'D': station = new DeliveryStation(scene, px, py); break;
    case 'd': // 脏盘子生成点
      station = new DirtyPlateStation(scene, px, py);
      break;
    case 'T': station = new TrashStation(scene, px, py); break;
    default:
      // new Station(scene, px, py, 'station_nothing');
      break;
  }

  if (station) {
    ALL_STATIONS.push(station); // 将工作站添加到列表中
    // if (initItemKey) {
    //   // 原始逻辑中，会设置物品的 homeStation 为工作站的精灵。
    //   const item = genItemInWorld(scene, initItemKey, px, py, station.getSprite());
    //   station.placeItem(item); // 将物品放置在工作站上
    // }
  }
}


export const updateStations = (delta: number) => {
  ALL_STATIONS.forEach(s => s.update(delta));
}

/**
 * 从 ALL_STATIONS 数组中移除工作站
 * @param station 要移除的工作站
 */
export function removeStation(station: Station) {
  const index = ALL_STATIONS.indexOf(station);
  if (index > -1) {
    ALL_STATIONS.splice(index, 1);
  }
}


// 根据坐标获取工作站
export const getStationAt: (x: number, y: number) => Station | undefined = (x, y) => {
  return ALL_STATIONS.find(s => s.x === x && s.y === y);
}


// 根据类型获取工作站列表
export const getStationsByType: (type: string) => Station[] = (type: string) => {
  return ALL_STATIONS.filter(s => s.type === type);
}


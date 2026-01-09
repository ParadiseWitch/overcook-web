import * as Phaser from 'phaser';
import { Station } from '../stations/station';
import { DEPTH, TILE_SIZE } from '../config';
import { getStationAt } from '../manager/station-manager';

// 火焰状态管理
type FireState = {
  scene: Phaser.Scene | null;
  spreadInterval: number;
  firingStations: Map<Station, number>;
  extinguishProgress: Map<Station, number>;
  extinguishTime: number;
  fireEmitters: Map<Station, Phaser.GameObjects.Particles.ParticleEmitter>;
};

// 创建火焰状态
const createFireState = (): FireState => ({
  scene: null,
  spreadInterval: 3000,
  firingStations: new Map(),
  extinguishProgress: new Map(),
  extinguishTime: 2000,
  fireEmitters: new Map(),
});

// 全局状态（使用闭包封装）
let fireState: FireState | null = null;

// 获取或创建火焰状态
const getFireState = (): FireState => {
  if (!fireState) {
    fireState = createFireState();
  }
  return fireState;
};

// 创建火焰发射器
const createFireEmitter = (state: FireState, station: Station): void => {
  if (state.fireEmitters.has(station)) {
    state.fireEmitters.get(station)?.destroy();
  }

  if (!state.scene) {
    console.warn('FireHelper not initialized with scene');
    return;
  }

  const emitter = state.scene.add.particles(station.x, station.y, 'flame', {
    speed: { min: 30, max: 80 },
    angle: { min: 230, max: 310 },
    gravityY: -100,
    scale: { start: 1.2, end: 0.1 },
    alpha: { start: 1, end: 0 },
    lifespan: { min: 500, max: 800 },
    frequency: 20,
    quantity: 2,
    tint: [0xff0000, 0xff6600, 0xffaa00, 0xffff00],
    rotate: { min: 0, max: 180 },
    blendMode: 'ADD'
  });
  emitter.setDepth(DEPTH.FX);

  state.fireEmitters.set(station, emitter);
};

// 销毁火焰发射器
const destroyFireEmitter = (state: FireState, station: Station): void => {
  const emitter = state.fireEmitters.get(station);
  if (emitter) {
    emitter.destroy();
    state.fireEmitters.delete(station);
  }
};

// 开始火焰
const startFireFunc = (state: FireState, station: Station): void => {
  if (!station.canFire) return;
  if (state.firingStations.has(station)) return;

  station.workStatus = 'fire';
  state.firingStations.set(station, 0);
  createFireEmitter(state, station);
};

// 停止火焰
const stopFireFunc = (state: FireState, station: Station): void => {
  if (!state.firingStations.has(station)) return;

  station.workStatus = 'idle';
  state.firingStations.delete(station);
  destroyFireEmitter(state, station);
};

// 火焰蔓延
const spreadFire = (state: FireState, station: Station): void => {
  const directions = [
    { dx: TILE_SIZE, dy: 0 },
    { dx: -TILE_SIZE, dy: 0 },
    { dx: 0, dy: TILE_SIZE },
    { dx: 0, dy: -TILE_SIZE }
  ];

  directions.forEach(({ dx, dy }) => {
    const targetX = station.x + dx;
    const targetY = station.y + dy;
    const targetStation = getStationAt(targetX, targetY);

    if (targetStation && targetStation.canFire && !state.firingStations.has(targetStation)) {
      startFireFunc(state, targetStation);
    }
  });
};

// 更新火焰系统
const updateFireHelperFunc = (state: FireState, delta: number): void => {
  const toSpread: Station[] = [];

  state.firingStations.forEach((timeElapsed, station) => {
    const newTime = timeElapsed + delta;
    state.firingStations.set(station, newTime);

    if (newTime >= state.spreadInterval) {
      toSpread.push(station);
      state.firingStations.set(station, 0);
    }
  });

  toSpread.forEach(station => {
    spreadFire(state, station);
  });
};

// 检查是否着火
const isOnFireFunc = (state: FireState, station: Station): boolean => {
  return state.firingStations.has(station);
};

// 尝试灭火
const tryExtinguishFunc = (
  state: FireState,
  station: Station,
  sprayX: number,
  sprayY: number,
  sprayRange: number,
  sprayAngle: number,
  facing: Phaser.Math.Vector2,
  delta: number
): boolean => {
  if (!isOnFireFunc(state, station)) return false;

  const dx = station.x - sprayX;
  const dy = station.y - sprayY;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance > sprayRange) return false;

  const angleToStation = Math.atan2(dy, dx);
  const facingAngle = facing.angle();
  let angleDiff = Math.abs(angleToStation - facingAngle);
  if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;

  if (angleDiff > sprayAngle / 2) return false;

  const currentProgress = state.extinguishProgress.get(station) || 0;
  const newProgress = currentProgress + delta;
  state.extinguishProgress.set(station, newProgress);

  if (newProgress >= state.extinguishTime) {
    stopFireFunc(state, station);
    state.extinguishProgress.delete(station);
    return true;
  }

  return false;
};

// 清除所有火焰
const clearAllFiresFunc = (state: FireState): void => {
  state.firingStations.forEach((_, station) => {
    station.workStatus = 'idle';
    destroyFireEmitter(state, station);
  });
  state.firingStations.clear();
};

// 清除所有数据
const clearAllDataFunc = (state: FireState): void => {
  state.firingStations.clear();
  state.extinguishProgress.clear();
  state.fireEmitters.forEach(emitter => emitter.destroy());
  state.fireEmitters.clear();
};

// 导出的公共函数
export const initFireHelper = (gameScene: Phaser.Scene) => {
  const state = getFireState();
  state.scene = gameScene;
  clearAllDataFunc(state);
};

export const startFire = (station: Station) => {
  startFireFunc(getFireState(), station);
};

export const stopFire = (station: Station) => {
  stopFireFunc(getFireState(), station);
};

export const updateFireHelper = (delta: number) => {
  updateFireHelperFunc(getFireState(), delta);
};

export const isOnFire = (station: Station): boolean => {
  return isOnFireFunc(getFireState(), station);
};

export const tryExtinguish = (
  station: Station,
  sprayX: number,
  sprayY: number,
  sprayRange: number,
  sprayAngle: number,
  facing: Phaser.Math.Vector2,
  delta: number
): boolean => {
  return tryExtinguishFunc(getFireState(), station, sprayX, sprayY, sprayRange, sprayAngle, facing, delta);
};

export const clearAllFires = () => {
  clearAllFiresFunc(getFireState());
};

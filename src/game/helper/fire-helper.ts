import * as Phaser from 'phaser';
import { Station } from '../stations/station';
import { DEPTH, TILE_SIZE } from '../config';
import { getStationAt } from '../manager/station-manager';

let scene: Phaser.Scene;
const spreadInterval: number = 3000;
const firingStations: Map<Station, number> = new Map();
const extinguishProgress: Map<Station, number> = new Map();
const extinguishTime: number = 2000;
const fireEmitters: Map<Station, Phaser.GameObjects.Particles.ParticleEmitter> = new Map();

export const initFireHelper = (gameScene: Phaser.Scene) => {
  scene = gameScene;
  firingStations.clear();
  extinguishProgress.clear();
  fireEmitters.clear();
};

const createFireEmitter = (station: Station) => {
  if (fireEmitters.has(station)) {
    fireEmitters.get(station)?.destroy();
  }

  const emitter = scene.add.particles(station.x, station.y, 'flame', {
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

  fireEmitters.set(station, emitter);
};

const destroyFireEmitter = (station: Station) => {
  const emitter = fireEmitters.get(station);
  if (emitter) {
    emitter.destroy();
    fireEmitters.delete(station);
  }
};

export const startFire = (station: Station) => {
  if (!station.canFire) return;
  if (firingStations.has(station)) return;

  station.workStatus = 'fire';
  firingStations.set(station, 0);
  createFireEmitter(station);
};

export const stopFire = (station: Station) => {
  if (!firingStations.has(station)) return;

  station.workStatus = 'idle';
  firingStations.delete(station);
  destroyFireEmitter(station);
};

const spreadFire = (station: Station) => {
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

    if (targetStation && targetStation.canFire && !firingStations.has(targetStation)) {
      startFire(targetStation);
    }
  });
};

export const updateFireHelper = (delta: number) => {
  const toSpread: Station[] = [];

  firingStations.forEach((timeElapsed, station) => {
    const newTime = timeElapsed + delta;
    firingStations.set(station, newTime);

    if (newTime >= spreadInterval) {
      toSpread.push(station);
      firingStations.set(station, 0);
    }
  });

  toSpread.forEach(station => {
    spreadFire(station);
  });
};

export const isOnFire = (station: Station): boolean => {
  return firingStations.has(station);
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
  if (!isOnFire(station)) return false;

  const dx = station.x - sprayX;
  const dy = station.y - sprayY;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance > sprayRange) return false;

  const angleToStation = Math.atan2(dy, dx);
  const facingAngle = facing.angle();
  let angleDiff = Math.abs(angleToStation - facingAngle);
  if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;

  if (angleDiff > sprayAngle / 2) return false;

  const currentProgress = extinguishProgress.get(station) || 0;
  const newProgress = currentProgress + delta;
  extinguishProgress.set(station, newProgress);

  if (newProgress >= extinguishTime) {
    stopFire(station);
    extinguishProgress.delete(station);
    return true;
  }

  return false;
};

export const clearAllFires = () => {
  firingStations.forEach((_, station) => {
    station.workStatus = 'idle';
    destroyFireEmitter(station);
  });
  firingStations.clear();
};
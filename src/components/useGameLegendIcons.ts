import type Phaser from "phaser";

export interface LegendIconState {
  legendIcons: Record<string, string>;
  playerIcons: {
    player1: string;
    player2: string;
  };
}

export interface LegendIconEntry {
  id: string;
  label: string;
  textureKey: string;
}

export const LEGEND_ICON_ENTRIES: LegendIconEntry[] = [
  { id: "icon-counter", label: "Counter", textureKey: "station_counter" },
  { id: "icon-crate", label: "Crate", textureKey: "station_crate" },
  { id: "icon-cut", label: "Cut", textureKey: "station_cut" },
  { id: "icon-pot-station", label: "Pot", textureKey: "station_pot" },
  { id: "icon-sink", label: "Sink", textureKey: "station_sink" },
  { id: "icon-delivery", label: "Delivery", textureKey: "station_delivery" },
  { id: "icon-trash", label: "Trash", textureKey: "station_trash" },
  { id: "icon-dirty-spawn", label: "Dirty Spawn", textureKey: "station_dirty_plate" },
  { id: "icon-tomato", label: "Tomato", textureKey: "item_tomato" },
  { id: "icon-tomato-cut", label: "Tomato Cut", textureKey: "item_tomato_cut" },
  { id: "icon-pot", label: "Pot Item", textureKey: "item_pot" },
  { id: "icon-plate", label: "Plate", textureKey: "item_plate" },
  { id: "icon-plate-dirty", label: "Dirty Plate", textureKey: "item_plate_dirty" },
  { id: "icon-soup", label: "Soup", textureKey: "item_soup" },
  { id: "icon-soup-pot", label: "Soup Pot", textureKey: "item_soup_pot" },
  { id: "icon-lettuce", label: "Lettuce", textureKey: "item_lettuce" },
  { id: "icon-lettuce-cut", label: "Lettuce Cut", textureKey: "item_lettuce_cut" },
  { id: "icon-fish", label: "Fish", textureKey: "item_fish" },
  { id: "icon-fish-cut", label: "Fish Cut", textureKey: "item_fish_cut" },
  { id: "icon-rice", label: "Rice", textureKey: "item_rice" },
  { id: "icon-rice-cooked", label: "Rice Cooked", textureKey: "item_rice_cooked" },
  { id: "icon-onion", label: "Onion", textureKey: "item_onion" },
  { id: "icon-onion-cut", label: "Onion Cut", textureKey: "item_onion_cut" },
  { id: "icon-potato", label: "Potato", textureKey: "item_potato" },
  { id: "icon-potato-cut", label: "Potato Cut", textureKey: "item_potato_cut" },
  { id: "icon-carrot", label: "Carrot", textureKey: "item_carrot" },
  { id: "icon-carrot-cut", label: "Carrot Cut", textureKey: "item_carrot_cut" },
  { id: "icon-egg", label: "Egg", textureKey: "item_egg" },
  { id: "icon-flour", label: "Flour", textureKey: "item_flour" },
  { id: "icon-seaweed", label: "Seaweed", textureKey: "item_seaweed" },
];

function sourceToDataUrl(source: CanvasImageSource, width = 24, height = 24) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return "";
  }
  ctx.clearRect(0, 0, width, height);
  ctx.drawImage(source, 0, 0, width, height);
  return canvas.toDataURL();
}

function createTintedPlayerIcon(color: number) {
  const canvas = document.createElement("canvas");
  canvas.width = 24;
  canvas.height = 24;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return "";
  }

  ctx.beginPath();
  ctx.moveTo(10, 0);
  ctx.lineTo(0, 24);
  ctx.lineTo(20, 24);
  ctx.closePath();
  ctx.fillStyle = `#${color.toString(16).padStart(6, "0")}`;
  ctx.fill();

  return canvas.toDataURL();
}

export function useGameLegendIcons() {
  function buildFromScene(scene: Phaser.Scene): LegendIconState {
    const legendIcons: Record<string, string> = {};
    for (const entry of LEGEND_ICON_ENTRIES) {
      if (!scene.textures.exists(entry.textureKey)) {
        continue;
      }
      const source = scene.textures.get(entry.textureKey).getSourceImage() as CanvasImageSource;
      legendIcons[entry.id] = sourceToDataUrl(source);
    }

    return {
      legendIcons,
      playerIcons: {
        player1: createTintedPlayerIcon(0x4da6ff),
        player2: createTintedPlayerIcon(0xff4444),
      },
    };
  }

  return {
    buildFromScene,
    legendEntries: LEGEND_ICON_ENTRIES,
  };
}

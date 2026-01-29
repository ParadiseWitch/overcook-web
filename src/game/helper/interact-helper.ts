import { Item } from "../item";
import { Container } from "../item/container/container";
import { Ingredient } from "../item/ingredient/ingredient";
import { Player } from "../player";
import { IngredientStation } from "../stations/ingredient-station";
import { Station } from "../stations/station";

export const interact = (player: Player, target: Station | Item | null) => {
  if (target == null && !player.heldItem) {
    //没有可以交互对象且空手，直接返回
    return;
  }
  // 放下物品到地面
  if (target == null && player.heldItem) {
    player.putDownToFloor();
    return;
  }
  if (target instanceof Station) {
    interactWithStation(player, target);
    return;
  }
  if (target instanceof Item) {
    interactWithItem(player, target);
    return;
  }
};

const interactWithStation = (player: Player, station: Station) => {
  console.log(`[interact-helper] Player interacting with station:`, station.constructor.name);
  console.log(`[interact-helper] Station.item:`, station.item);
  console.log(`[interact-helper] Player.heldItem:`, player.heldItem);
  
  // 检查玩家手持物品是否已被销毁
  if (player.heldItem && !player.heldItem.scene) {
    console.log(`[interact-helper] WARNING: Player holding destroyed item, clearing heldItem`);
    player.heldItem = null;
  }
  
  if (
    station instanceof IngredientStation &&
    !station.item &&
    !player.heldItem
  ) {
    console.log(`[interact-helper] Condition met: Generating ingredient from station`);
    // 在player手上生成食材。
    station.genIngredientForPlayer(player);
    return;
  }

  if (!station.item && player.heldItem) {
    const placeSucc = station.placeItem(player.heldItem);
    if (placeSucc) {
      player.heldItem.heldBy = null;
      player.heldItem = null;
    }
    return;
  }

  if (station.item) {
    interactWithItem(player, station.item);
    return;
  }
};

const interactWithItem = (player: Player, item: Item) => {
  if (item instanceof Container) {
    interactWithContainer(player, item);
    return;
  }
  if (item instanceof Ingredient) {
    interactWithIngredient(player, item);
    return;
  }
  // 通用物品拾取（灭火器等）
  if (!player.heldItem) {
    player.pick(item);
    return;
  }
};

const interactWithContainer = (player: Player, container: Container) => {
  const heldItem = player.heldItem;
  if (!heldItem) {
    player.pick(container);
    return;
  }
  if (heldItem instanceof Ingredient) {
    interactWithContainerWhenHeldIngredient(container, heldItem);
    return;
  }
  if (heldItem instanceof Container) {
    interactWithContainerWhenHeldContainer(container, heldItem);
    return;
  }
};

const interactWithIngredient = (player: Player, ingredient: Ingredient) => {
  const heldItem = player.heldItem;
  if (!heldItem) {
    player.pick(ingredient);
    return;
  }
  if (heldItem instanceof Container) {
    interactWithIngredientWhenHeldContainer(ingredient, heldItem);
    return;
  }
};

function interactWithContainerWhenHeldIngredient(
  container: Container,
  heldIngredient: Ingredient,
) {
  container.addIngredient(heldIngredient);
}

function interactWithContainerWhenHeldContainer(
  container: Container,
  heldContainer: Container,
) {
  if (heldContainer.isEmpty() && !container.isEmpty()) {
    container.transferTo(heldContainer);
    return;
  }
  if (!heldContainer.isEmpty() && container.isEmpty()) {
    heldContainer.transferTo(container);
    return;
  }
}

function interactWithIngredientWhenHeldContainer(
  ingredient: Ingredient,
  heldContainer: Container,
) {
  heldContainer.addIngredient(ingredient);
}

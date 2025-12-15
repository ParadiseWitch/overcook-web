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
}


export const interactWithStation = (player: Player, station: Station) => {
  if (station instanceof IngredientStation && !station.item && !player.heldItem) {
    // 在player手上生成食材。
    station.genIngredientForPlayer(player);
    return;
  }
  if (!station.item && player.heldItem) {
    station.placeItem(player.heldItem);
    player.heldItem.heldBy = null;
    player.heldItem = null;
    return;
  }
  if (station.item) {
    interactWithItem(player, station.item);
    return;
  }
};

export const interactWithItem = (player: Player, item: Item) => {
  if (item instanceof Container) {
    interactWithContainer(player, item);
    return;
  }
  if (item instanceof Ingredient) {
    interactWithIngredient(player, item);
    return;
  }
};

export const interactWithContainer = (player: Player, container: Container) => {
  const heldItem = player.heldItem;
  if (!heldItem) {
    player.pickup(container);
    return;
  }
  if (heldItem instanceof Ingredient) {
    interactWithContainerWhenHeldIngredient(player, container, heldItem);
    return;
  }
  if (heldItem instanceof Container) {
    interactWithContainerWhenHeldContainer(player, container, heldItem);
    return;
  }
};

export const interactWithIngredient = (player: Player, ingredient: Ingredient) => {
  const heldItem = player.heldItem;
  if (!heldItem) {
    player.pickup(ingredient);
    return;
  }
  if (heldItem instanceof Container) {
    interactWithIngredientWhenHeldContainer(player, ingredient, heldItem);
    return;
  }
};


function interactWithContainerWhenHeldIngredient(player: Player, container: Container, heldIngredient: Ingredient) {
  container.addIngredient(heldIngredient);
}

function interactWithContainerWhenHeldContainer(player: Player, container: Container, heldContainer: Container) {
  if (heldContainer.isEmpty() && !container.isEmpty()) {
    container.transferTo(heldContainer);
    return;
  }
  if (!heldContainer.isEmpty() && container.isEmpty()) {
    heldContainer.transferTo(container);
    return;
  }
}

function interactWithIngredientWhenHeldContainer(player: Player, ingredient: Ingredient, heldContainer: Container) {
  heldContainer.addIngredient(ingredient);
}


import { Item } from '../item';


export const ALL_ITEMS: Item[] = [];

export function updateItems(delta: number) {
  ALL_ITEMS.forEach(item => {
    item.update(delta);
  });
}

/**
 * 从 ALL_ITEMS 数组中移除物品
 * @param item 要移除的物品
 */
export function removeItem(item: Item) {
  const index = ALL_ITEMS.indexOf(item);
  if (index > -1) {
    ALL_ITEMS.splice(index, 1);
  }
}

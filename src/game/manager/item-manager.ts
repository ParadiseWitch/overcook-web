import { Item } from '../item';


export const ALL_ITEMS: Item[] = [];

export function updateItems(delta: number) {
  ALL_ITEMS.forEach(item => {
    item.update(delta);
  });
}

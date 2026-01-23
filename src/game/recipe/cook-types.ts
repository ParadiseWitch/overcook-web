import { CookState } from '../item/ingredient/ingredient';

/**
 * 烹饪类型配置
 * 定义每种烹饪方式的属性，包括对应工作站、基础时间、是否会过度烹饪等
 */
export interface CookTypeConfig {
  type: CookState;
  displayName: string;    // 显示名称
  symbol: string;         // 菜单符号表示（参考菜单.md）
  isSingle: boolean;      // 是否为单食材烹饪
  station: string;        // 对应工作站类型
  baseTime: number;       // 基础烹饪时间（毫秒）
  canOvercook: boolean;   // 是否会过度烹饪
}

// NOTE: This registry only includes CookState (active cooking methods), not SpecialState
// (overcook, burnt). SpecialState represents failure outcomes, not cooking operations,
// so they don't have associated stations or base times.
// 烹饪类型注册表：所有烹饪方式的配置
export const COOK_TYPES: Record<CookState, CookTypeConfig> = {
  'cut': {
    type: 'cut',
    displayName: '切',
    symbol: '/',
    isSingle: true,
    station: 'CutStation',
    baseTime: 3000,
    canOvercook: false
  },
  'boil': {
    type: 'boil',
    displayName: '煮',
    symbol: '*',
    isSingle: true,
    station: 'BoilStation',
    baseTime: 5000,
    canOvercook: true
  },
  'deep-fry': {
    type: 'deep-fry',
    displayName: '炸',
    symbol: '/_',
    isSingle: true,
    station: 'FryStation',
    baseTime: 4000,
    canOvercook: true
  },
  'stir-fry': {
    type: 'stir-fry',
    displayName: '炒/煮汤',
    symbol: '《》',
    isSingle: false,
    station: 'PotStation',
    baseTime: 6000,
    canOvercook: true
  },
  'pan-fry': {
    type: 'pan-fry',
    displayName: '煎',
    symbol: '',
    isSingle: false,
    station: 'PanStation',
    baseTime: 5000,
    canOvercook: true
  },
  'mix': {
    type: 'mix',
    displayName: '搅拌',
    symbol: '｛｝',
    isSingle: false,
    station: 'MixerStation',
    baseTime: 4000,
    canOvercook: false
  },
  'bake': {
    type: 'bake',
    displayName: '烘焙',
    symbol: '',
    isSingle: false,
    station: 'OvenStation',
    baseTime: 8000,
    canOvercook: true
  },
  'barbecue': {
    type: 'barbecue',
    displayName: '烧烤',
    symbol: '',
    isSingle: false,
    station: 'GrillStation',
    baseTime: 5000,
    canOvercook: true
  },
  'steam': {
    type: 'steam',
    displayName: '蒸',
    symbol: '',
    isSingle: false,
    station: 'SteamerStation',
    baseTime: 6000,
    canOvercook: true
  }
};

export function getCookTypeConfig(type: CookState): CookTypeConfig {
  return COOK_TYPES[type];
}

export function isSingleCookType(type: CookState): boolean {
  return COOK_TYPES[type].isSingle;
}

export function canOvercook(type: CookState): boolean {
  return COOK_TYPES[type].canOvercook;
}

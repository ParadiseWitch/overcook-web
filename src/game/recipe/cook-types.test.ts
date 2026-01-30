import { describe, it, expect } from "vitest";
import {
  COOK_TYPES,
  getCookTypeConfig,
  isSingleCookType,
  canOvercook,
  CookTypeConfig,
} from "./cook-types";
import { CookState } from "../item/ingredient/ingredient";

describe("cook-types", () => {
  describe("COOK_TYPES registry", () => {
    it("should contain all expected cook types", () => {
      const expectedTypes: CookState[] = [
        "cut",
        "boil",
        "deep-fry",
        "stir-fry",
        "pan-fry",
        "mix",
        "bake",
        "barbecue",
        "steam",
      ];

      expectedTypes.forEach((type) => {
        expect(COOK_TYPES[type]).toBeDefined();
      });
    });

    it("should have valid config for cut type", () => {
      const config = COOK_TYPES["cut"];

      expect(config.type).toBe("cut");
      expect(config.displayName).toBe("切");
      expect(config.symbol).toBe("/");
      expect(config.isSingle).toBe(true);
      expect(config.station).toBe("CutStation");
      expect(config.baseTime).toBe(3000);
      expect(config.canOvercook).toBe(false);
    });

    it("should have valid config for boil type", () => {
      const config = COOK_TYPES["boil"];

      expect(config.type).toBe("boil");
      expect(config.isSingle).toBe(true);
      expect(config.canOvercook).toBe(true);
      expect(config.baseTime).toBe(5000);
    });

    it("should have valid config for stir-fry type", () => {
      const config = COOK_TYPES["stir-fry"];

      expect(config.type).toBe("stir-fry");
      expect(config.isSingle).toBe(false);
      expect(config.station).toBe("PotStation");
      expect(config.canOvercook).toBe(true);
    });

    it("should have valid config for mix type", () => {
      const config = COOK_TYPES["mix"];

      expect(config.type).toBe("mix");
      expect(config.isSingle).toBe(false);
      expect(config.canOvercook).toBe(false);
    });

    it("should have positive baseTime for all types", () => {
      Object.values(COOK_TYPES).forEach((config: CookTypeConfig) => {
        expect(config.baseTime).toBeGreaterThan(0);
      });
    });
  });

  describe("getCookTypeConfig", () => {
    it("should return correct config for cut", () => {
      const config = getCookTypeConfig("cut");

      expect(config).toBe(COOK_TYPES["cut"]);
      expect(config.type).toBe("cut");
    });

    it("should return correct config for boil", () => {
      const config = getCookTypeConfig("boil");

      expect(config).toBe(COOK_TYPES["boil"]);
      expect(config.type).toBe("boil");
    });

    it("should return correct config for deep-fry", () => {
      const config = getCookTypeConfig("deep-fry");

      expect(config.type).toBe("deep-fry");
      expect(config.station).toBe("FryStation");
    });

    it("should return correct config for pan-fry", () => {
      const config = getCookTypeConfig("pan-fry");

      expect(config.type).toBe("pan-fry");
      expect(config.station).toBe("PanStation");
    });

    it("should return correct config for bake", () => {
      const config = getCookTypeConfig("bake");

      expect(config.type).toBe("bake");
      expect(config.station).toBe("OvenStation");
      expect(config.baseTime).toBe(8000);
    });

    it("should return correct config for barbecue", () => {
      const config = getCookTypeConfig("barbecue");

      expect(config.type).toBe("barbecue");
      expect(config.station).toBe("GrillStation");
    });

    it("should return correct config for steam", () => {
      const config = getCookTypeConfig("steam");

      expect(config.type).toBe("steam");
      expect(config.station).toBe("SteamerStation");
    });
  });

  describe("isSingleCookType", () => {
    it("should return true for single-ingredient cooking types", () => {
      expect(isSingleCookType("cut")).toBe(true);
      expect(isSingleCookType("boil")).toBe(true);
      expect(isSingleCookType("deep-fry")).toBe(true);
    });

    it("should return false for multi-ingredient cooking types", () => {
      expect(isSingleCookType("stir-fry")).toBe(false);
      expect(isSingleCookType("pan-fry")).toBe(false);
      expect(isSingleCookType("mix")).toBe(false);
      expect(isSingleCookType("bake")).toBe(false);
      expect(isSingleCookType("barbecue")).toBe(false);
      expect(isSingleCookType("steam")).toBe(false);
    });
  });

  describe("canOvercook", () => {
    it("should return false for types that cannot overcook", () => {
      expect(canOvercook("cut")).toBe(false);
      expect(canOvercook("mix")).toBe(false);
    });

    it("should return true for types that can overcook", () => {
      expect(canOvercook("boil")).toBe(true);
      expect(canOvercook("deep-fry")).toBe(true);
      expect(canOvercook("stir-fry")).toBe(true);
      expect(canOvercook("pan-fry")).toBe(true);
      expect(canOvercook("bake")).toBe(true);
      expect(canOvercook("barbecue")).toBe(true);
      expect(canOvercook("steam")).toBe(true);
    });
  });
});

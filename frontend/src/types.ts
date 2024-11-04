export type TBase = {
  id: string;
  name: string;
  index: number;
  wikiLink: string;
};

export type TItem = TBase & {
  jpwikiId: string;
  kind: string;
  category: string;
  coupons: number;
};

export class ItemUtil {
  static getWikiLink = (item: TItem): string => `素材/${item.jpwikiId}`;

  static getTypeName = (item: TItem): string => {
    switch (item.kind) {
      case "material":
        return "パーツ";
      case "equipment":
        return "装備品";
    }
    return "";
  };
}

export type TBuilding = TBase & {
  jpwikiId: string;
  category: string;
  subcategory: string;
  power: number;
  maxInputs: number;
  maxOutputs: number;
};

export class BuildingUtil {
  static getWIKILink = (building: TBuilding): string => {
    const { jpwikiId, category } = building;
    const cat = category != "特殊" ? category : "スペシャル";
    return `建築物/${cat}#${jpwikiId}`;
  };
}

export type TConditionItem = {
  conditionId: string;
  itemId: string;
  item?: string;
  index: number;
  amount: number;
};

export type TCondition = TBase & {
  kind: string;
  linkAnchor: string;
  time: number;
  tier?: number;
  category?: string;
  items: TConditionItem[];
};

export class ConditionUtil {
  static findItem = (
    condition: TCondition,
    itemId: string
  ): TConditionItem | null => {
    for (const item of condition.items) {
      if (item.itemId === itemId) {
        return item;
      }
    }
    return null;
  };
}

export type TRecipeItem = {
  recipeId: string;
  itemId: string;
  item?: TItem;
  index: number;
  amount: number;
  minute: number;
  building?: TBuilding;
};

export type TRecipe = TBase & {
  jpwikiId: string;
  linkAnchor: string;
  alternate: boolean;
  conditionId: string;
  condition?: TCondition;
  productionTime: number;
  productionTime2?: number;
  buildingId: string;
  building: TBuilding;
  building2Id?: string;
  building2?: TBuilding;
  ingredients: TRecipeItem[];
  products: TRecipeItem[];
};

export class RecipeUtil {
  static getWIKILink = (recipe: TRecipe): string => {
    const { jpwikiId, linkAnchor = "N1" } = recipe;
    return `素材/${jpwikiId}#Recipe_${linkAnchor}`;
  };

  static isByproduct = (recipe: TRecipe, itemId: string): boolean =>
    recipe.products[0]?.itemId !== itemId;

  static bgColor = (recipe: TRecipe, itemId: string): string => {
    if (this.isByproduct(recipe, itemId)) {
      return "#eee";
    } else if (recipe.alternate) {
      return "#fff6f6";
    } else {
      return "#f6fff6";
    }
  };

  static findIngredient = (
    recipe: TRecipe,
    itemId: string
  ): TRecipeItem | null => {
    for (const ing of recipe.ingredients) {
      if (ing.itemId === itemId) {
        return ing;
      }
    }
    return null;
  };

  static findProduct = (
    recipe: TRecipe,
    itemId: string
  ): TRecipeItem | null => {
    for (const prod of recipe.products) {
      if (prod.itemId === itemId) {
        return prod;
      }
    }
    return null;
  };
}
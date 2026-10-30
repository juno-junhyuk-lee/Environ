export type ElementName = "human_settlement" | "forest" | "fresh_water_body";

export interface ElementDefinition {
  name: ElementName;
  label: string;
  /** Icon asset key; UI wiring comes in a later ticket. */
  icon: string;
  defaultCondition: number;
}

export const HUMAN_SETTLEMENT: ElementDefinition = {
  name: "human_settlement",
  label: "Human Settlement",
  icon: "human-settlement",
  defaultCondition: 50,
};

export const FOREST: ElementDefinition = {
  name: "forest",
  label: "Forest",
  icon: "forest",
  defaultCondition: 50,
};

export const FRESH_WATER_BODY: ElementDefinition = {
  name: "fresh_water_body",
  label: "Fresh Water Body",
  icon: "fresh-water-body",
  defaultCondition: 50,
};

export const ELEMENTS: Record<ElementName, ElementDefinition> = {
  human_settlement: HUMAN_SETTLEMENT,
  forest: FOREST,
  fresh_water_body: FRESH_WATER_BODY,
};

export const ELEMENT_NAMES = Object.keys(ELEMENTS) as ElementName[];

export function getElementDefinition(name: ElementName): ElementDefinition {
  return ELEMENTS[name];
}

export function getName(element: ElementDefinition): ElementName {
  return element.name;
}

export function getIcon(element: ElementDefinition): string {
  return element.icon;
}

export function getLabel(element: ElementDefinition): string {
  return element.label;
}

export function getDefaultCondition(element: ElementDefinition): number {
  return element.defaultCondition;
}

export function isElementName(value: string): value is ElementName {
  return Object.hasOwn(ELEMENTS, value);
}

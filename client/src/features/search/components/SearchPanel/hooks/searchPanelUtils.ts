import { SearchQuery } from "shared/api/schemas/Search.generated";
import { Route, Stop } from "shared/types/interface.d";

export enum SearchType {
  "recent",
  "search",
  "viewAll",
}

export interface SearchTerm {
  value: string;
}

export interface ViewAllRecent {
  type: "viewAll";
}

type ArrayElement<ArrayType extends readonly unknown[]> =
  ArrayType extends readonly (infer ElementType)[] ? ElementType : never;

export type OptionValue =
  | ArrayElement<SearchQuery["search"]["stops"]>
  | Route
  | SearchTerm
  | ViewAllRecent;

export interface SearchOption {
  type: SearchType;
  optionValue: OptionValue;
}

// Type guards
export const isRoute = (option: OptionValue): option is Route => {
  return "routeLongName" in option;
};

export const isStop = (option: OptionValue): option is Stop => {
  return "stopName" in option;
};

export const isSearchTerm = (option: OptionValue): option is SearchTerm => {
  return "value" in option;
};

export const isViewAllRecent = (
  option: OptionValue
): option is ViewAllRecent => {
  return "type" in option && option.type === "viewAll";
};

// Label helpers
export const getRouteOptionLabel = (route: Route): string => {
  return `${route.routeId} ${route.routeLongName}`;
};

export const getStopOptionLabel = (stop: Stop): string => {
  return `${stop.stopId} ${stop.stopName}`;
};

export const getOptionLabel = (option: SearchOption): string => {
  const { optionValue } = option;
  if (isRoute(optionValue)) {
    return getRouteOptionLabel(optionValue);
  } else if (isStop(optionValue)) {
    return getStopOptionLabel(optionValue);
  } else if (isSearchTerm(optionValue)) {
    return optionValue.value;
  } else if (isViewAllRecent(optionValue)) {
    return "View all recent searches";
  }

  return "";
};

// Equality checker for autocomplete options
export const isOptionEqualToValue = (
  option: SearchOption,
  value: SearchOption
): boolean => {
  const { optionValue } = option;

  if (isRoute(optionValue)) {
    return (
      isRoute(value.optionValue) &&
      optionValue.routeId === value.optionValue.routeId
    );
  } else if (isStop(optionValue)) {
    return (
      isStop(value.optionValue) &&
      optionValue.stopId === value.optionValue.stopId
    );
  } else if (isSearchTerm(optionValue)) {
    return (
      isSearchTerm(value.optionValue) &&
      optionValue.value === value.optionValue.value
    );
  } else if (isViewAllRecent(optionValue)) {
    return isViewAllRecent(value.optionValue);
  }

  return false;
};

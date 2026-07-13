import { Stop as ApiStop } from "shared/api/generated/model";
import { Route, Stop } from "shared/types/interface.d";

export interface SearchTerm {
  value: string;
}

export interface ViewAllRecent {
  type: "viewAll";
}

export type OptionValue = ApiStop | Route | SearchTerm | ViewAllRecent;

// Type guards — also used by UseRecentSearches, favorites, and menu pages
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

/**
 * Autocomplete option with its variant resolved once at construction
 * (via toSearchOption), so consumers read kind/label/key directly instead
 * of re-running type guards everywhere.
 */
export type SearchOption = {
  /** Original value, e.g. for recent-search removal */
  optionValue: OptionValue;
  /** Identity, used for option/value equality */
  key: string;
  label: string;
  /** Rendered with the recent-search clock icon and remove button */
  recent: boolean;
} & (
  | { kind: "route"; route: Route }
  | { kind: "stop"; stop: Stop }
  | { kind: "term"; term: string }
  | { kind: "viewAll" }
);

export const toSearchOption = (
  value: OptionValue,
  recent = false
): SearchOption => {
  if (isRoute(value)) {
    return {
      kind: "route",
      route: value,
      optionValue: value,
      key: `route-${value.routeId}`,
      label: getRouteOptionLabel(value),
      recent,
    };
  }
  if (isStop(value)) {
    return {
      kind: "stop",
      stop: value,
      optionValue: value,
      key: `stop-${value.stopId}`,
      label: getStopOptionLabel(value),
      recent,
    };
  }
  if (isSearchTerm(value)) {
    return {
      kind: "term",
      term: value.value,
      optionValue: value,
      key: `term-${value.value}`,
      label: value.value,
      recent,
    };
  }
  return {
    kind: "viewAll",
    optionValue: value,
    key: "view-all",
    label: "View all recent searches",
    recent,
  };
};

export const getOptionLabel = (option: SearchOption): string => option.label;

export const isOptionEqualToValue = (
  option: SearchOption,
  value: SearchOption
): boolean => option.key === value.key;

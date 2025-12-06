/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as aiSync from "../aiSync.js";
import type * as games from "../games.js";
import type * as objectives from "../objectives.js";
import type * as players from "../players.js";
import type * as sharkAI from "../sharkAI.js";
import type * as sharkMemory from "../sharkMemory.js";
import type * as sharks from "../sharks.js";
import type * as types from "../types.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  aiSync: typeof aiSync;
  games: typeof games;
  objectives: typeof objectives;
  players: typeof players;
  sharkAI: typeof sharkAI;
  sharkMemory: typeof sharkMemory;
  sharks: typeof sharks;
  types: typeof types;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};

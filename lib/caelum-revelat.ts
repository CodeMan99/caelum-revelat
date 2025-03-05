/**
 * Minimal DSL for creating Bruno Filters using Template Literals.
 *
 * In most use cases the output is a _parameters_ object ready for use as a
 * request's query string. The {@link https://www.npmjs.com/package/qs|qs}
 * package is recommended.
 *
 * @example A single expression to a full _parameters_ object.
 * ```typescript
 * const username = "CodeMan99";
 * const parameters = asParameters(E`username eq ${username}`);
 * ```
 *
 * @example Two groups used to create the _parameters_ object.
 * ```typescript
 * const playerClass = "bard";
 * const isPlayerClass = asGroup(E`player_class eq ${playerClass}`);
 * const anyStat = G`
 * 	${E`wisdom   gt ${7}`}
 * 	or
 * 	${E`charisma gt ${14} `}
 * `;
 * const parameters = filterParams(isPlayerClass, anyStat);
 * ```
 *
 * @module
 */

import type { BinaryFilterExpression } from "./binary-filter-expression.ts";
import type { FilterGroup } from "./logical-group-expression.ts";

export type { BooleanNumber } from "./types.ts";

export {
	type BinaryFilterExpression,
	isBinaryFilterExpression,
	isOperator,
	type Operator,
	OPERATORS,
	parse as E,
} from "./binary-filter-expression.ts";

export { type FilterGroup, parse as G } from "./logical-group-expression.ts";

/**
 * Object suitable to build a query string.
 */
export type FilterParameters = {
	/** One or more filter groups. */
	filter_groups: FilterGroup[];
};

/**
 * Create a "params" object suitable for use with {@link https://www.npmjs.com/package/qs|qs}.
 */
export function filterParams(...filter_groups: FilterGroup[]): FilterParameters {
	return { filter_groups };
}

/**
 * Wrap the given {@linkcode BinaryFilterExpression} into a {@linkcode FilterGroup} object.
 */
export function asGroup(binaryFilterExpression: BinaryFilterExpression): FilterGroup {
	return {
		or: 0,
		filters: [
			binaryFilterExpression,
		],
	};
}

/**
 * Wrap the given {@linkcode BinaryFilterExpression} into a {@linkcode FilterParameters} object.
 */
export function asParameters(binaryFilterExpression: BinaryFilterExpression): FilterParameters {
	return filterParams(asGroup(binaryFilterExpression));
}

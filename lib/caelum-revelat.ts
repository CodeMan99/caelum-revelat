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
 * const parameters = filterParams(E`username eq ${username}`);
 * ```
 *
 * @example Two expressions used to create the _parameters_ object.
 * ```typescript
 * const playerClass = "bard";
 * const isPlayerClass = E`player_class eq ${playerClass}`;
 * const anyStat = G`
 * 	${E`wisdom   gt ${7}`}
 * 	or
 * 	${E`charisma gt ${14}`}
 * `;
 * const parameters = filterParams(isPlayerClass, anyStat);
 * ```
 *
 * @module
 */

import { isBinaryFilterExpression, type BinaryFilterExpression } from "./binary-filter-expression.ts";
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
 * Union of a single filter expression or a logical filter group expression.
 */
export type Expression = BinaryFilterExpression | FilterGroup;

/**
 * Create a "params" object suitable for use with {@link https://www.npmjs.com/package/qs|qs}.
 *
 * Will map individual {@linkcode BinaryFilterExpression} objects to a
 * {@linkcode FilterGroup} before creating the parameters object.
 */
export function filterParams(...groups: Array<Expression>): FilterParameters {
	const filter_groups = groups.map<FilterGroup>(value => {
		if (isBinaryFilterExpression(value)) {
			return { or: 0, filters: [value] };
		} else {
			return value;
		}
	});

	return { filter_groups };
}

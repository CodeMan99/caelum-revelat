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

export type FilterParameters = {
	filter_groups: FilterGroup[];
};

export function filterParams(...filter_groups: FilterGroup[]): FilterParameters {
	return { filter_groups };
}

export function asGroup(binaryFilterExpression: BinaryFilterExpression): FilterGroup {
	return {
		or: 0,
		filters: [
			binaryFilterExpression,
		],
	};
}

export function asParameters(binaryFilterExpression: BinaryFilterExpression): FilterParameters {
	return filterParams(asGroup(binaryFilterExpression));
}

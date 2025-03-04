import { type BinaryFilterExpression, isBinaryFilterExpression } from "./binary-filter-expression.ts";
import type { BooleanNumber } from "./types.ts";

export type FilterGroup = {
	or: BooleanNumber;
	filters: BinaryFilterExpression[];
};

export function parse(strings: TemplateStringsArray, ...values: unknown[]): FilterGroup {
	if (values.length === 0) {
		throw new Error("A filter group may not be empty");
	}

	// This validation does not care about order. Strictly, the strings array
	// should be something like `["", " or ", " or ", ""]` where the empty strings
	// denote the beginning and end of the logical expression group
	const logicalExpressions = new Set(strings.map((s) => s.trim()));

	logicalExpressions.delete("");

	// size == 0 -> Probably received one BinaryFilterExpression
	// size == 1 -> Received multiple BinaryFilterExpression objects, all logic
	//              should be either `or` OR `and`
	if (logicalExpressions.size === 0 || logicalExpressions.size === 1) {
		const or = logicalExpressions.has("or") ? 1 : 0;
		const filters = values.filter((v) => isBinaryFilterExpression(v));

		if (values.length > filters.length) {
			throw new Error("All values must be a BinaryFilterExpression");
		}

		return { or, filters };
	} else {
		throw new Error("Cannot parse logical expressions (filter group)");
	}
}

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
 * const parameters = E`username eq ${username}`.asParameters();
 * ```
 *
 * @example Two groups used to create the _parameters_ object.
 * ```typescript
 * const playerClass = "bard";
 * const isPlayerClass = E`player_class eq ${playerClass}`.asGroup();
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

/**
 * The known operators that Bruno supports.
 */
export const OPERATORS = [
	"sw", // starts-with
	"ew", // ends-with
	"ct", // contains
	"eq", // equals
	"gt", // greater-than
	"gte", // greater-than-or-equal
	"lt", // less-than
	"lte", // less-than-or-equal
	"in", // in-array
	"bt", // between
] as const;

/**
 * Parse and "tokenize" an expression.
 */
const EXPRESSION_RE = new RegExp(String.raw`(?<key>\w+?)\s+?(?<not>not_)?(?<operator>${OPERATORS.join("|")})`);

/**
 * Union of operators by syntax name.
 */
export type Operator = typeof OPERATORS[number];

/**
 * Check if a value is of type {@linkcode Operator}.
 */
export function isOperator(value: string): value is Operator {
	return OPERATORS.includes(value as Operator);
}

/**
 * A union of numbers to use in place of boolean values.
 */
export type BooleanNumber = 1 | 0;

/**
 * An input type that is used internally to create {@linkcode BooleanNumber}
 */
export type BooleanLike = BooleanNumber | boolean | string | undefined;

/**
 * Object suitable to build a query string.
 */
export type FilterParameters = {
	filter_groups: FilterGroup[];
};

/**
 * A single filter expression that must appear in the order: `key op value`.
 */
export class BinaryFilterExpression {
	/** The field name used by the backend query. */
	key: string;
	/** The binary operator used by the backend query. */
	operator: Operator;
	/**
	 * The bind variable used by the backend query.
	 *
	 * **IMPORTANT**: `undefined` and `null` may have different meanings
	 * depending on the query string serialization library. Typically, an
	 * `undefined` value will be dropped and `null` will result in an
	 * empty string.
	 */
	value: unknown;
	/** Should the operator be negated (value `1`). */
	not: BooleanNumber;

	/**
	 * A Template Literal to build a {@linkcode BinaryFilterExpression}.
	 */
	static parse(
		[expression, ...strings]: TemplateStringsArray,
		value: unknown,
		...values: unknown[]
	): BinaryFilterExpression {
		if (expression.length > 2 && strings.length === 1 && values.length === 0) {
			const { key, not, operator }: Partial<RegExpExecArray["groups"]> =
				EXPRESSION_RE.exec(expression)?.groups ?? {};

			if (key && isOperator(operator)) {
				return new this({ key, operator, value, not });
			}

			throw new Error(
				`Invalid expression - missing key or operator: ${JSON.stringify({ expression })}`,
			);
		} else {
			throw new Error("Only a single expression is supported");
		}
	}

	/**
	 * Cast an un-typed {@linkcode BinaryFilterExpression} as an instance.
	 *
	 * Does not throw. Returns `null` if the passed value is invalid.
	 */
	static tryFrom(expression: unknown): BinaryFilterExpression | null {
		if (
			typeof expression === "object" &&
			expression &&
			"key" in expression &&
			typeof expression.key === "string" &&
			"operator" in expression &&
			typeof expression.operator === "string" &&
			isOperator(expression.operator) &&
			"value" in expression
		) {
			const { key, operator, value } = expression;
			const not = "not" in expression && !!expression.not;

			return new BinaryFilterExpression({ key, operator, value, not });
		}

		return null;
	}

	/**
	 * Copy constructor.
	 */
	constructor(
		{ key, operator, value, not }:
			& Pick<BinaryFilterExpression, "key" | "operator" | "value">
			& { not: BooleanLike },
	) {
		this.key = key;
		this.operator = operator;
		this.value = value;
		this.not = not ? 1 : 0;
	}

	/**
	 * Wrap this {@linkcode BinaryFilterExpression} into a {@linkcode FilterGroup}.
	 */
	asGroup(): FilterGroup {
		return new FilterGroup(0, this);
	}

	/**
	 * Wrap this {@linkcode BinaryFilterExpression} into a {@linkcode FilterParameters} object.
	 */
	asParameters(): FilterParameters {
		return filterParams(this.asGroup());
	}
}

/**
 * A group of {@linkcode BinaryFilterExpression} objects. Can also be though
 * of as a "logical expression" collection.
 *
 * For example the expression `userIsOwner or userIsAdmin` is a logical
 * expression using the `or` operator.
 */
export class FilterGroup {
	/** Should this group be combined by logical-or (value `1`) or logical-and (value `0`). */
	or: BooleanNumber;
	/** The expressions contained within this logical group. */
	filters: BinaryFilterExpression[];

	/**
	 * A Template Literal to build a FilterGroup. All interpolated values should
	 * already be parsed as a {@linkcode BinaryFilterExpression}.
	 */
	static parse(strings: TemplateStringsArray, ...values: unknown[]): FilterGroup {
		// This validation does not care about order. Strictly, the strings array
		// should be something like `["", " or ", " or ", ""]` where the empty strings
		// denote the beginning and end of the logical expression group
		const logicalExpressions = new Set(strings.map((s) => s.trim()));

		logicalExpressions.delete("");

		// size == 0 -> Probably received one BinaryFilterExpression
		// size == 1 -> Received multiple BinaryFilterExpression objects, all logic
		//              should be either `or` OR `and`
		if (logicalExpressions.size === 0 || logicalExpressions.size === 1) {
			const filters = values.filter((v) => v instanceof BinaryFilterExpression);

			return new this(logicalExpressions.has("or"), ...filters);
		} else {
			throw new Error("Cannot parse logical expressions (filter group)");
		}
	}

	/**
	 * Create this logical expression group.
	 */
	constructor(or: BooleanLike, ...filters: BinaryFilterExpression[]) {
		this.or = or ? 1 : 0;
		this.filters = filters;
	}

	/**
	 * Wrap this {@linkcode FilterGroup} into a {@linkcode FilterParameters} object.
	 */
	asParameters(): FilterParameters {
		return filterParams(this);
	}
}

/**
 * Short alias for {@linkcode BinaryFilterExpression.parse}.
 */
export function E(
	strings: TemplateStringsArray,
	value: unknown,
	...values: unknown[]
): BinaryFilterExpression {
	return BinaryFilterExpression.parse(strings, value, ...values);
}

/**
 * Short alias for {@linkcode FilterGroup.parse}.
 */
export function G(strings: TemplateStringsArray, ...values: unknown[]): FilterGroup {
	return FilterGroup.parse(strings, ...values);
}

/**
 * Create a "params" object suitable for use with {@link https://www.npmjs.com/package/qs|qs}.
 */
export function filterParams(
	...filter_groups: FilterGroup[]
): FilterParameters {
	return { filter_groups };
}

/**
 * Cast an un-typed {@linkcode FilterParameters} object, discarding any
 * non-applicable values along the way.
 *
 * Does not throw. Returns `null` when the passed value is invalid.
 */
export function upgrade(params: unknown): FilterParameters | null {
	if (typeof params === "object" && params && "filter_groups" in params && Array.isArray(params.filter_groups)) {
		const filter_groups: FilterGroup[] = params.filter_groups
			.map((group: unknown) => {
				if (typeof group === "object" && group && "filters" in group && Array.isArray(group.filters)) {
					const or = "or" in group && !!group.or;
					const filters: BinaryFilterExpression[] = group.filters
						.map((expression: unknown) => BinaryFilterExpression.tryFrom(expression))
						.filter((expression: BinaryFilterExpression | null) => expression !== null);

					return new FilterGroup(or, ...filters);
				}

				return null;
			})
			.filter((g: FilterGroup | null) => g !== null);

		return filterParams(...filter_groups);
	}

	return null;
}

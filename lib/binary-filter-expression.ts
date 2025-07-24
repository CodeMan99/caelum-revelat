import type { BooleanNumber } from "./types.ts";

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
const EXPRESSION_RE = new RegExp(String.raw`(?<key>\w+?)\s+?\b(?<not>not_)?(?<operator>${OPERATORS.join("|")})\b`);

/**
 * Union of operators by syntax name.
 */
export type Operator = typeof OPERATORS[number];

/**
 * A single filter expression that must appear in the order: `key op value`.
 */
export type BinaryFilterExpression = {
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
};

/**
 * Check if a value is of type {@linkcode Operator}.
 */
export function isOperator(value: string): value is Operator {
	return OPERATORS.includes(value as Operator);
}

/**
 * Verify the combination of operator & value are compatible.
 */
export function acceptableValue(operator: Operator, value: unknown): boolean {
	const type = typeof value;

	switch (operator) {
		case "sw":
		case "ew":
		case "ct":
			if (type === "string") {
				return true;
			} else {
				throw new Error(`The "${operator}" operator requires a string value`);
			}
		case "eq":
		case "gt":
		case "gte":
		case "lt":
		case "lte":
			if (type === "string" || type === "number" || type === "boolean" || value === null) {
				return true;
			} else {
				throw new Error(`The "${operator}" operator was given a complex value`);
			}
		case "in":
			if (Array.isArray(value) && value.length > 0) {
				return true;
			} else {
				throw new Error(`The "in" operator requires an array value of non-zero length`);
			}
		case "bt":
			if (typeof value === "object" && value !== null && "0" in value && "1" in value) {
				return true;
			} else {
				throw new Error(`The "bt" operator requires an array-like value containing exactly two constants`);
			}
	}
}

/**
 * A Template Literal to build a {@linkcode BinaryFilterExpression}.
 */
export function parse(
	[expression, ...strings]: TemplateStringsArray,
	value: unknown,
	...values: unknown[]
): BinaryFilterExpression {
	if (expression.length > 2 && strings.length === 1 && values.length === 0) {
		const { key, not, operator }: Partial<RegExpExecArray["groups"]> = EXPRESSION_RE.exec(expression)?.groups ??
			{};

		if (key && isOperator(operator) && acceptableValue(operator, value)) {
			return {
				key,
				operator,
				value,
				not: not ? 1 : 0,
			};
		}

		throw new Error(
			`Invalid expression - missing key or operator: ${JSON.stringify({ expression })}`,
		);
	} else {
		throw new Error("Only a single expression is supported");
	}
}

/**
 * Type narrowing check for {@linkcode BinaryFilterExpression} instances.
 *
 * @param value The value to test
 * @param strict Check for existance of the `not` property in strict mode (the default)
 * @returns True when the value satisfies the structure of a {@linkcode BinaryFilterExpression}.
 */
export function isBinaryFilterExpression(value: unknown, strict = true): value is BinaryFilterExpression {
	return typeof value === "object" &&
		value !== null &&
		"key" in value &&
		"operator" in value &&
		"value" in value &&
		typeof value.key === "string" &&
		typeof value.operator === "string" &&
		isOperator(value.operator) &&
		(!strict || (
			"not" in value &&
			(value.not === 1 || value.not === 0)
		));
}

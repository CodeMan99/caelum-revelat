import type { BooleanNumber } from "./types.ts";

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

const EXPRESSION_RE = new RegExp(String.raw`(?<key>\w+?)\s+?(?<not>not_)?(?<operator>${OPERATORS.join("|")})`);

export type Operator = typeof OPERATORS[number];

export type BinaryFilterExpression = {
	key: string;
	operator: Operator;
	value: unknown;
	not: BooleanNumber;
};

export function isOperator(value: string): value is Operator {
	return OPERATORS.includes(value as Operator);
}

export function parse(
	[expression, ...strings]: TemplateStringsArray,
	value: unknown,
	...values: unknown[]
): BinaryFilterExpression {
	if (expression.length > 2 && strings.length === 1 && values.length === 0) {
		const { key, not, operator }: Partial<RegExpExecArray["groups"]> = EXPRESSION_RE.exec(expression)?.groups ??
			{};

		if (key && isOperator(operator)) {
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

export function isBinaryFilterExpression(value: unknown, strict = true): value is BinaryFilterExpression {
	return typeof value === "object" &&
		value !== null &&
		"key" in value &&
		"operator" in value &&
		"value" in value &&
		typeof value["key"] === "string" &&
		typeof value["operator"] === "string" &&
		isOperator(value["operator"]) &&
		(!strict || (
			"not" in value &&
			(value["not"] === 1 || value["not"] === 0)
		));
}

/**
 * The symbol used to mark the Literal container type.
 */
const Literal = Symbol("Literal");

/**
 * Literal container. Will be unwrapped internally.
 */
export type Literal = {
	value: string;
	[Literal]: true;
};

/**
 * Wrap a string value into a `Literal`.
 *
 * @throws {TypeError} when an empty string (or all whitespace) is given.
 */
export function literal(value: string): Literal {
	if (isLiteral(value as unknown)) {
		throw new Error("Nested literal values are not supported");
	}

	if (!value.trim()) {
		throw new TypeError("Cannot create empty literal");
	}

	return Object.create(null, {
		value: {
			configurable: false,
			enumerable: true,
			value,
			writable: false,
		},
		[Literal]: {
			configurable: false,
			enumerable: false,
			value: true,
			writable: false,
		},
	});
}

/**
 * Type guard to test if a value is `Literal`.
 */
export function isLiteral(value: unknown): value is Literal {
	return typeof value === "object" && value !== null && Object.hasOwn(value, Literal);
}

/**
 * Get the string value contained by the given `Literal`.
 */
export function unwrap(literal: Literal): string {
	return literal.value;
}

/**
 * Parse a template literal string as a `Literal`.
 */
export function parse(strings: TemplateStringsArray, ...values: unknown[]): Literal {
	const value = String.raw({ raw: strings }, ...values);

	return literal(value);
}

/**
 * Bake literal values into the strings array.
 *
 * Internal "middleware" for the expression template string literals.
 */
export function bake(strings: TemplateStringsArray, ...values: unknown[]): [string[], unknown[]] {
	const baked: string[] = [];
	const outValues: unknown[] = [];

	let current = strings[0];

	for (let i = 0; i < values.length; i++) {
		const value = values[i];
		const next = strings[i + 1];

		if (isLiteral(value)) {
			current += unwrap(value) + next;
		} else {
			baked.push(current);
			outValues.push(value);
			current = next;
		}
	}

	baked.push(current);

	return [baked, outValues];
}

/**
 * Literal operator: Starts With
 */
export const sw: Literal = literal("sw");

/**
 * Literal operator: Ends With
 */
export const ew: Literal = literal("ew");

/**
 * Literal operator: Contains
 */
export const ct: Literal = literal("ct");

/**
 * Literal operator: Equals
 */
export const eq: Literal = literal("eq");

/**
 * Literal operator: Greater Than
 */
export const gt: Literal = literal("gt");

/**
 * Literal operator: Greater Than or Equal
 */
export const gte: Literal = literal("gte");

/**
 * Literal operator: Less Than
 */
export const lt: Literal = literal("lt");

/**
 * Literal operator: Less Than or Equal
 */
export const lte: Literal = literal("lte");

/**
 * Literal operator: Member in Values
 */
export const in_: Literal = literal("in");

/**
 * Literal operator: Between
 */
export const bt: Literal = literal("bt");

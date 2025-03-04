import { assertObjectMatch, assertThrows } from "@std/assert";
import { parse as E } from "./binary-filter-expression.ts";

Deno.test(function invalidOperatorTest() {
	assertThrows(() => E`witnessed yt ${"yes"}`);
});

Deno.test(function invalidNoKeyTest() {
	assertThrows(() => E`gt ${1}`);
});

Deno.test(function invalidWrongOrderTest() {
	assertThrows(() => E`${12} lt age`);
});

Deno.test(function invalidTooManyValues() {
	// This should throw because there is no distinction in number of operator arguments.
	assertThrows(() => E`name bt ${1} ${2}`);
});

Deno.test(function createEqualsTest() {
	const expression = E`some_name eq ${"Brian"}`;

	assertObjectMatch(expression, {
		key: "some_name",
		operator: "eq",
		value: "Brian",
		not: 0,
	});
});

Deno.test(function createNotEqualsTest() {
	// Any amount of whitespace is acceptable.
	const expression = E`
		someName
		not_eq
		${"Billy"}
	`;

	assertObjectMatch(expression, {
		key: "someName",
		operator: "eq",
		value: "Billy",
		not: 1,
	});
});

Deno.test(function createInArrayTest() {
	const expression = E`field1 in ${[1, 2, 3]}`;

	assertObjectMatch(expression, {
		key: "field1",
		operator: "in",
		value: [1, 2, 3],
		not: 0,
	});
});

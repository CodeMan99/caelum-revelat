import { assertEquals, assertObjectMatch, assertThrows } from "@std/assert";
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

Deno.test(function testOperatorMatch_sw() {
	const expression = E`x sw ${1}`;

	assertEquals(expression.operator, 'sw');
});

Deno.test(function testOperatorMatch_ew() {
	const expression = E`x ew ${1}`;

	assertEquals(expression.operator, 'ew');
});

Deno.test(function testOperatorMatch_ct() {
	const expression = E`x ct ${1}`;

	assertEquals(expression.operator, 'ct');
});

Deno.test(function testOperatorMatch_eq() {
	const expression = E`x eq ${1}`;

	assertEquals(expression.operator, 'eq');
});

Deno.test(function testOperatorMatch_gt() {
	const expression = E`x gt ${1}`;

	assertEquals(expression.operator, 'gt');
});

Deno.test(function testOperatorMatch_gte() {
	const expression = E`x gte ${1}`;

	assertEquals(expression.operator, 'gte');
});

Deno.test(function testOperatorMatch_lt() {
	const expression = E`x lt ${1}`;

	assertEquals(expression.operator, 'lt');
});

Deno.test(function testOperatorMatch_lte() {
	const expression = E`x lte ${1}`;

	assertEquals(expression.operator, 'lte');
});

Deno.test(function testOperatorMatch_in() {
	const expression = E`x in ${1}`;

	assertEquals(expression.operator, 'in');
});

Deno.test(function testOperatorMatch_bt() {
	const expression = E`x bt ${1}`;

	assertEquals(expression.operator, 'bt');
});


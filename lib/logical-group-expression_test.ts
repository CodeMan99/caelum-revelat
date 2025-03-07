import { assertObjectMatch, assertThrows } from "@std/assert";
import { parse as E } from "./binary-filter-expression.ts";
import { parse as G } from "./logical-group-expression.ts";

Deno.test(function invalidGroupWhenEmpty() {
	assertThrows(() => G``);
});

Deno.test(function invalidGroupNonExpressionGiven() {
	const notExpression: string = `weight gt ${150}`;

	assertThrows(() => G`${notExpression}`);
});

Deno.test(function invalidGroupMixedLogicalOperators() {
	const carCount = E`car_count lte ${4}`;
	const bikeCount = E`bike_count gte ${2}`;
	const bookCount = E`book_count lt ${42}`;

	assertThrows(() => G`${carCount} or ${bikeCount} and ${bookCount}`);
});

Deno.test(function createAndTest() {
	const emailEndsWith = E`email ew ${"@example.com"}`;
	const ageGt18 = E`age gt ${18}`;
	const group = G`${emailEndsWith} and ${ageGt18}`;

	assertObjectMatch(group, {
		or: 0,
		filters: [
			{
				key: "email",
				operator: "ew",
				value: "@example.com",
				not: 0,
			},
			{
				key: "age",
				operator: "gt",
				value: 18,
				not: 0,
			},
		],
	});
});

Deno.test(function createOrTest() {
	const royalty = E`desendant_of eq ${"King Charles"}`;
	const bestAge = E`month_age bt ${[252, 315]}`;
	const group = G`${royalty} or ${bestAge}`;

	assertObjectMatch(group, {
		or: 1,
		filters: [
			{
				key: "desendant_of",
				operator: "eq",
				value: "King Charles",
				not: 0,
			},
			{
				key: "month_age",
				operator: "bt",
				value: [252, 315],
				not: 0,
			},
		],
	});
});

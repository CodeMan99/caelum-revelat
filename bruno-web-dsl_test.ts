import { assertEquals, assertObjectMatch, assertThrows } from "@std/assert";
import { BinaryFilterExpression, E, FilterGroup, filterParams, G } from "./bruno-web-dsl.ts";
import type { FilterParameters } from "./bruno-web-dsl.ts";

Deno.test(async function BinaryFilterExpressionTests(t) {
	await t.step(function invalidOperatorTest() {
		assertThrows(() => E`witnessed yt ${"yes"}`);
	});

	await t.step(function invalidNoKeyTest() {
		assertThrows(() => E`gt ${1}`);
	});

	await t.step(function invalidWrongOrderTest() {
		assertThrows(() => E`${12} lt age`);
	});

	await t.step(function invalidTooManyValues() {
		// This should throw because there is no distinction in number of operator arguments.
		assertThrows(() => E`name bt ${1} ${2}`);
	});

	await t.step(function createEqualsTest() {
		const expression = E`some_name eq ${"Brian"}`;

		assertObjectMatch(expression, {
			key: "some_name",
			operator: "eq",
			value: "Brian",
			not: 0,
		});
	});

	await t.step(function createNotEqualsTest() {
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

	await t.step(function createInArrayTest() {
		const expression = E`field1 in ${[1, 2, 3]}`;

		assertObjectMatch(expression, {
			key: "field1",
			operator: "in",
			value: [1, 2, 3],
			not: 0,
		});
	});

	await t.step(function createAsGroupTest() {
		const group = E`color sw ${"blue"}`.asGroup();

		assertObjectMatch(group, {
			or: 0,
			filters: [
				{
					key: "color",
					operator: "sw",
					value: "blue",
					not: 0,
				},
			],
		});
	});

	await t.step(function createAsParametersTest() {
		const parameters = E`food ct ${"pizza"}`.asParameters();

		assertObjectMatch(parameters, {
			filter_groups: [
				{
					or: 0,
					filters: [
						{
							key: "food",
							operator: "ct",
							value: "pizza",
							not: 0,
						},
					],
				},
			],
		});
	});
});

Deno.test(async function FilterGroupTests(t) {
	await t.step(function invalidGroupMixedLogicalOperators() {
		const carCount = `car_count lte ${4}`;
		const bikeCount = `bike_count gte ${2}`;
		const bookCount = `book_count lt ${42}`;

		assertThrows(() => G`${carCount} or ${bikeCount} and ${bookCount}`);
	});

	await t.step(function createAndTest() {
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

	await t.step(function createOrTest() {
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

	await t.step(function createAsParametersTest() {
		const isLikelyDead = E`birth_year not_bt ${[1920, 2026]}`;
		// No logical operators is accepted by design.
		const parameters = G`${isLikelyDead}`.asParameters();

		assertObjectMatch(parameters, {
			filter_groups: [
				{
					or: 0,
					filters: [
						{
							key: "birth_year",
							operator: "bt",
							value: [1920, 2026],
							not: 1,
						},
					],
				},
			],
		});
	});
});

Deno.test(async function GeneratorExampleTest(t) {
	const example = function* (
		name: string,
		gender: "M" | "F" | "X",
		birthYear?: number,
		existingParams?: FilterParameters,
	): Generator<FilterGroup> {
		yield G`
			${E`name eq ${name}`}
			and
			${E`gender eq ${gender}`}
		`;

		if (Number.isInteger(birthYear)) {
			yield E`birth_year eq ${birthYear}`.asGroup();
		}

		if (existingParams) {
			// Trivial to combine parameters.
			yield* existingParams.filter_groups;
		}
	};

	await t.step(function exampleCall1Test() {
		const parameters = filterParams(...example("Patrick", "M"));

		assertEquals(parameters.filter_groups.length, 1);
	});

	await t.step(function exampleCall2Test() {
		const parameters = filterParams(...example("Patricia", "F", 1968));

		assertEquals(parameters.filter_groups.length, 2);
	});

	await t.step(function exampleCall3Test() {
		const parametersManual: FilterParameters = {
			filter_groups: [
				new FilterGroup(
					false,
					new BinaryFilterExpression({
						key: "wisdom",
						operator: "gt",
						value: 110,
						not: false,
					}),
				),
				new FilterGroup(
					false,
					new BinaryFilterExpression({
						key: "beauty",
						operator: "gte",
						value: 85,
						not: false,
					}),
				),
			],
		};
		const parameters = filterParams(...example("Sam Smith", "X", 1992, parametersManual));

		assertEquals(parameters.filter_groups.length, 4);
	});
});

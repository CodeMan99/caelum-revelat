import { assertEquals, assertObjectMatch } from "@std/assert";
import type { Expression, FilterParameters } from "./caelum-revelat.ts";
import { E, filterParams, G } from "./caelum-revelat.ts";

Deno.test(async function BinaryFilterExpressionTests(t) {
	await t.step(function createAsGroupTest() {
		const parameters = filterParams(E`color sw ${"blue"}`);

		assertObjectMatch(parameters, {
			filter_groups: [
				{
					or: 0,
					filters: [
						{
							key: "color",
							operator: "sw",
							value: "blue",
							not: 0,
						},
					],
				},
			],
		});
	});

	await t.step(function createAsParametersTest() {
		const parameters = filterParams(E`food ct ${"pizza"}`);

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

Deno.test(async function GeneratorExampleTest(t) {
	const example = function* (
		name: string,
		gender: "M" | "F" | "X",
		birthYear?: number,
		existingParams?: FilterParameters,
	): Generator<Expression> {
		yield G`
			${E`name eq ${name}`}
			and
			${E`gender eq ${gender}`}
		`;

		if (Number.isInteger(birthYear)) {
			yield E`birth_year eq ${birthYear}`;
		}

		if (existingParams && existingParams.filter_groups) {
			// Trivial to combine parameters.
			yield* existingParams.filter_groups;
		}
	};

	await t.step(function exampleCall1Test() {
		const parameters = filterParams(...example("Patrick", "M"));

		assertEquals(parameters.filter_groups?.length, 1);
	});

	await t.step(function exampleCall2Test() {
		const parameters = filterParams(...example("Patricia", "F", 1968));

		assertEquals(parameters.filter_groups?.length, 2);
	});

	await t.step(function exampleCall3Test() {
		const parametersManual: FilterParameters = {
			filter_groups: [
				{
					or: 0,
					filters: [
						{
							key: "wisdom",
							operator: "gt",
							value: 110,
							not: 0,
						},
					],
				},
				{
					or: 0,
					filters: [
						{
							key: "beauty",
							operator: "gte",
							value: 85,
							not: 0,
						},
					],
				},
			],
		};
		const parameters = filterParams(...example("Sam Smith", "X", 1992, parametersManual));

		assertEquals(parameters.filter_groups?.length, 4);
	});
});

Deno.test(function ZeroArgumentsTest() {
	const parameters = filterParams();

	assertEquals(parameters, {});
});

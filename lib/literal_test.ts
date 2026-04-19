import {
	assert,
	assertArrayIncludes,
	assertEquals,
	assertExists,
	assertFalse,
	assertNotEquals,
	assertObjectMatch,
	assertThrows,
} from "@std/assert";
import { bake, isLiteral, literal, parse, unwrap } from "./literal.ts";

Deno.test(async function LiteralTests(t) {
	await t.step(function testCreateLiteral() {
		const value = "value";
		const l = literal(value);

		assert(Object.hasOwn(l, "value"));
		assertEquals(Object.getOwnPropertyNames(l).length, 1);
		assertEquals(Object.getOwnPropertySymbols(l).length, 1);
		assertExists(l);
		assertObjectMatch(l, {
			value,
		});

		assertThrows(() => literal(""), TypeError, "Cannot create empty literal");
		assertThrows(() => literal(" "), TypeError, "Cannot create empty literal");
		assertThrows(() => literal("\t"), TypeError, "Cannot create empty literal");
		assertThrows(() => literal("\n"), TypeError, "Cannot create empty literal");
		assertThrows(() => literal("  \t\n  "), TypeError, "Cannot create empty literal");
	});

	await t.step(function testIsLiteral() {
		assertFalse(isLiteral("value"));
		assertFalse(isLiteral(""));
		assertFalse(isLiteral(null));
		assertFalse(isLiteral(undefined));
		assertFalse(isLiteral(1));
		assertFalse(isLiteral(true));
		assertFalse(isLiteral(false));
		assertFalse(isLiteral({}));
		assertFalse(isLiteral({ value: "eq" }));
		assert(isLiteral(literal("eq")));
		assert(isLiteral(literal("first_name")));
	});

	await t.step(function testPreventNestedLiteral() {
		const inner = literal("inner");

		// Nested literals can only happen without typescript guards. Needs to be prevented for pure javascript usage.
		assertThrows(() => literal(inner as unknown as string), Error, "Nested literal values are not supported");
	});

	await t.step(function testParse() {
		const l = parse`lte`;

		assertObjectMatch(l, {
			value: "lte",
		});
		assertEquals(l, literal("lte"));
		assertNotEquals(l, literal("gt"));
	});

	await t.step(function testBakeOneString() {
		const [strings, values] = bake`s`;

		assertEquals(strings.length, 1);
		assertArrayIncludes(strings, ["s"]);
		assertEquals(values.length, 0);
	});

	await t.step(function testBakeOneValue() {
		const [strings, values] = bake`first_name eq ${"billy"}`;

		assertEquals(strings.length, 2);
		assertArrayIncludes(strings, ["first_name eq ", ""]);
		assertEquals(values.length, 1);
		assertArrayIncludes(values, ["billy"]);
	});

	await t.step(function testBakeOneLiteral() {
		const [strings, values] = bake`${literal("last_name")} eq ${"williams"}`;

		assertEquals(strings.length, 2);
		assertArrayIncludes(strings, ["last_name eq ", ""]);
		assertEquals(values.length, 1);
		assertArrayIncludes(values, ["williams"]);
	});

	await t.step(function testBakeTwoLiterals() {
		const [strings, values] = bake` ${literal("photo")} ${literal("not_eq")} ${null} `;

		assertEquals(strings.length, 2);
		assertArrayIncludes(strings, [" photo not_eq ", " "]);
		assertEquals(values.length, 1);
		assertArrayIncludes(values, [null]);
	});

	await t.step(function testBakeTwoLiteralsSansWhitespace() {
		const [strings, values] = bake`${literal("age")}${literal(" eq ")}${5}`;

		assertEquals(strings.length, 2);
		assertArrayIncludes(strings, ["age eq ", ""]);
		assertEquals(values.length, 1);
		assertArrayIncludes(values, [5]);
	});

	await t.step(function testUnwrap() {
		const not_eq = literal("not_eq");
		const gt = literal("gt");

		assertEquals(typeof unwrap(not_eq), "string");
		assertEquals(unwrap(not_eq), "not_eq");
		assertEquals(unwrap(gt), "gt");
	});
});

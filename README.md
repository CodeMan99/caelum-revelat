# Bruno Web DSL

A minimal DSL to create [Bruno][] filters using [Template Literals][].

## Target Audience

This library is designed to be used in web frontends making requests to any
PHP backend application using Bruno. I found writing the object syntax
extremely tedious. This library allows you to write just **one line** for a
single expression.

```javascript
const username = "CodeMan99";
const parameters = E`username eq ${username}`.asParameters();
```

Instead of this monster, clocking in at 15 lines. :smiling_imp:

```javascript
const username = "CodeMan99";
const parameters = {
    filter_groups: [
        {
            or: false,
            filters: [
                {
                    key: "username",
                    operator: "eq",
                    value: username,
                    not: false,
                },
            ],
        },
    ],
};
```

This is a huge win in readability! :tada:

What about a native builder pattern? That too as some flaws - mutablity and
building from the top-down. Let's do two expressions in a single group.

```javascript
const ageRange = [21, 45];
const sports = ["Hockey", "Cricket", "Rugby"];

// Extraneous whitespace is acceptable!
const parameters = G`
    ${ E`age bt ${ageRange}` }
    and
    ${ E`favorite_sport in ${sports}` }
`.asParameters();
```

Nice! Now we will compare to a fluent builder pattern.

```javascript
const [minAge, maxAge] = [21, 45];
const sports = ["Hockey", "Cricket", "Rugby"];

const parameters = Filters.make();
const group = parameters.everyGroupBuilder(); // "and" group

group("age").between(minAge, maxAge);
group("favorite_sport").inCollection(...sports);
```

That seems _OK_. Notice though that the call to `.everyGroupBuilder()` returned
a callback. That callback is a closure containing the `parameters` object.
Every call to the callback "builds" onto that closure with mutable side-effects.

There is nothing wrong with this approach. The builder pattern enables
intellisense of every operator because the operator is a simple,
well-named method. The builder pattern avoids parsing and the associated
errors that come with parsing. I did not choose this approach because I wanted
a bottom-up pattern and have a strong preference for avoiding multibility.

## More Usage

Great! You are still here! I'm sure you want to know about the bottom-up
approach I mentioned. Just use a generator!

```typescript
import {
    E,
    G,
    FilterGroup,
    filterParams,
    type FilterParameters,
} from "@codeman99/bruno-web-dsl";
// Existing parameters before adopting @codeman99/bruno-web-dsl
import { myParameters } from "./my-example.ts";

const dynamicExample = function* (
    username: string,
    age: number,
    sports?: string[],
    existingParameters?: FilterParameters,
): Generator<FilterGroup> {
    yield G`
        ${ E`username sw ${username}` }
        and
        ${ E`age lt ${age}` }
    `;

    if (Array.isArray(sports) && sports.length > 0) {
        yield E`favorite_sport in ${sports}`.asGroup();
    }

    if (existingParameters) {
        // Combine with existing query parameters, easing adoption.
        yield* existingParameters.filter_groups;
    }
};

const parameters1 = filterParams(...dynamicExample("CodeMan99", 94));
// Send a request here with axios or any other http client!

const parameters2 = filterParams(...dynamicExample("esbenp", 80, [
    "Hockey",
    "Football",
    "Cricket",
]));
// Send a request here with axios or any other http client!

const parameters3 = filterParams(...dynamicExample("logtape", 17, [], myParameters));
// Send a request here with axios or any other http client!
```

That's neat! Notice how `const parameters1 =` appears directly before sending
the request.

One more example. Filtering is not the only thing Bruno supports you say? Well,
to be honest, plain objects are fine for those other features. Just spread the
result of building the filtering object.

```javascript
const userRole = "employee";
const parameters = {
    ...E`roles ct ${userRole}`.asParameters(),
    page: 1,
    limit: 25,
    includes: ["office"],
    sort: [
        {
            key: "last_name",
            direction: "asc",
        },
        {
            key: "first_name",
            direction: "asc",
        },
    ],
};
```

Perhaps the `sort` parameter could benefit from a simplier form. Currently
undecided on what approach to use here, if any.

## Proof of Concept Example

This example is a proof that the `parameters` object can actually become the
query string of a request.

```typescript
import * as qs from "npm:qs@6.14.0";
import { E } from "@codeman99/bruno-web-dsl";

const baseURL = "https://bruno.localhost:8443";
const programmingLanguages = ["TypeScript", "JavaScript", "PHP", "F#"];
const parameters = E`favorite_language in ${programmingLanguages}`.asParameters();
const programmerListURL = new URL("/api/programmers", baseURL);

programmerListURL.search = `?${qs.stringify(parameters)}`;

for (const [key, value] of programmerListURL.searchParams) {
    console.log(`${key}: ${value}`);
}
```

This outputs exactly what we need!

```
filter_groups[0][or]: 0
filter_groups[0][filters][0][key]: favorite_language
filter_groups[0][filters][0][operator]: in
filter_groups[0][filters][0][value][0]: TypeScript
filter_groups[0][filters][0][value][1]: JavaScript
filter_groups[0][filters][0][value][2]: PHP
filter_groups[0][filters][0][value][3]: F#
filter_groups[0][filters][0][not]: 0
```

Of course, feel free to modify this example to convince yourself.

## Documentation

Full API documentation of this module is available
at https://jsr.io/@codeman99/bruno-web-dsl/doc.

## Development

Use the [devcontainer][], based on the [official docker image for deno][]! This
will create a full development environment without any fuss. Feel free to
destroy your container at any time.


[Bruno]: https://github.com/esbenp/bruno#filtering
[Template Literals]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals
[devcontainer]: https://code.visualstudio.com/docs/devcontainers/containers
[official docker image for deno]: https://hub.docker.com/r/denoland/deno

# wordgard 0.1.0: `Pos.Plot.node` is mistyped as `Pos.Plot` in the published d.ts

Minimal reproduction of a declaration-file bug in `wordgard@0.1.0`.

## The bug

`Pos.Plot.node` holds the document `Plot` (the node class from `wordgard/doc`) at runtime, but the published `dist/doc.d.ts` types it as `Pos.Plot` itself:

```ts
// dist/doc.d.ts (wordgard 0.1.0):
declare namespace Pos {
  class Plot extends Pos.Node {
    node: Plot // <- resolves to the namespace-local Pos.Plot, not the document Plot
    // ...
  }
}
```

The source is correct. `src/doc/pos.ts` imports the document node class under an alias to avoid exactly this shadowing:

```ts
import type { Node as _Node, Plot as _Plot, Leaf } from './node'
// ...
export class Plot extends Pos.Node {
  declare node: _Plot
  // ...
}
```

The d.ts rollup loses the `_Plot` alias, so inside `namespace Pos` the name `Plot` resolves to the sibling `Pos.Plot` class. Any code that reads `pos.node` from a `Pos.Plot` (for example inside a `Correction.onContent` callback) gets a type with no `content`, `isTextblock`, `type`, and so on, even though the runtime value has all of them.

## Reproduction

`src/index.ts` defines two identical `Correction.onContent` callbacks that read `pos.node.isTextblock`:

- `correction1` uses `pos.node` as typed.
- `correction2` adds the workaround cast `pos.node as unknown as Plot`.

### 1. Runtime: both corrections work

```bash
pnpm install
pnpm vitest run --disableConsoleIntercept
```

The test creates a `GardState` with both corrections, inserts text into a paragraph, and asserts both callbacks ran and saw `isTextblock === true`. The `console.log` output shows `pos.node` is the runtime document `Plot`:

```
[correction1] pos.node: Plot {
  tag: Tag { type: Type { name: 'Paragraph', ... } },
  content: [ Leaf { param: '!hello', ... } ],
  contentLength: 6
}
```

### 2. Typecheck: only `correction1` errors

```bash
pnpm typecheck
```

```
src/index.ts(22,27): error TS2339: Property 'isTextblock' does not exist on type 'Plot'.
```

The single error is on `correction1`. Note the error message itself shows the shadowing: tsc reports the type as `Plot` while meaning `Pos.Plot`. `correction2` (the cast) and the test file typecheck cleanly.

## Related

Same class of rollup issue in the published d.ts: `Pos.Node.pos` is emitted but marked `@internal` in source, and `Mark.rank` is missing entirely.

Environment: `wordgard@0.1.0`, `typescript@6.0.x`, strict mode.

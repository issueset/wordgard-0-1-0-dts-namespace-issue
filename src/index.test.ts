import { it } from 'vitest'
import { Leaf, Node, Plot, Schema } from 'wordgard/doc'
import { GardState } from 'wordgard/state'

import { correction1 } from './index.ts'

const Doc = Plot.defineDoc({ blockContent: Node.Group.Content })
const Paragraph = Plot.define('Paragraph', {
  inlineContent: true,
  group: Node.Group.Content,
  defaultBlock: true,
  shape: { element: 'p' },
})
const schema = Schema.define([Doc, Paragraph])

it('both corrections run and receive the document Plot at runtime', () => {
  const doc = schema.doc([Paragraph.create([Leaf.text('hello')])])
  const state = GardState.create({ doc, config: [correction1] })
  state.update({ changes: { from: 1, insert: [Leaf.text('!')] } })
})

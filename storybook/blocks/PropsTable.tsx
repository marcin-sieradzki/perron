// A component's props table on its docs page, in MUI's layout: name, type, default and
// description, read from the docgen of the component its stories' meta names. Its slots, one row
// per `slotProps` key, follow in a table of their own.
import { Unstyled, useOf } from '@storybook/addon-docs/blocks'
import Markdown from 'markdown-to-jsx/react'
import { propRows, type PropRow } from './component-page.ts'
import './perron-docs.css'

const SLOT = 'slotProps.'

function Rows({ rows, defaults }: { rows: PropRow[]; defaults: boolean }) {
  return (
    <div className="pd-table">
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Type</th>
            {defaults && <th>Default</th>}
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.name}>
              <td>
                <code>{row.name}</code>
                {row.required && <sup className="pd-required">*</sup>}
              </td>
              <td>
                <code>{row.type}</code>
              </td>
              {defaults && <td>{row.default && <code>{row.default}</code>}</td>}
              <td>
                <Markdown options={{ forceInline: true }}>{row.description}</Markdown>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** `of` is the component's stories module, the one `<Meta of>` names. */
export function PropsTable({ of }: { of: unknown }) {
  const resolved = useOf(of as Parameters<typeof useOf>[0], ['meta'])
  const rows = propRows(resolved.preparedMeta.argTypes)
  const props = rows.filter((r) => !r.name.startsWith(SLOT))
  const slots = rows.filter((r) => r.name.startsWith(SLOT))
  return (
    <Unstyled>
      <div className="pd-page">
        <h2>Props</h2>
        <Rows rows={props} defaults />
        {props.some((r) => r.required) && (
          <p className="pd-note">
            <sup className="pd-required">*</sup> Required.
          </p>
        )}
        {slots.length > 0 && (
          <>
            <h3>Slots</h3>
            <Rows rows={slots} defaults={false} />
          </>
        )}
      </div>
    </Unstyled>
  )
}

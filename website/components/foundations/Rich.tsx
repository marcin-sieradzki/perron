// A sentence from a doc inside a tile or a caption: links lose their targets, since a tile is a
// link already, and code spans stay code, in the data role.
import { plain } from './data.ts'

export function Rich({ text }: { text: string }) {
  return plain(text)
    .split(/`([^`]+)`/)
    .map((part, i) => (i % 2 ? <code key={i}>{part}</code> : part))
}

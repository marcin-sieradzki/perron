# Note

A short note.

## Props

| Name             | Type                               | Default | Base UI prop | Description               |
| ---------------- | ---------------------------------- | ------- | ------------ | ------------------------- |
| `label`          | `string`                           |         | none         | The note's words          |
| `tone`           | `'calm' \| 'loud'`                 |         | none         | How loud the note is      |
| `className`      | `string`                           |         | none         | Joined on the root        |
| `style`          | `CSSProperties`                    |         | none         | Reaches the root          |
| `ref`            | `Ref<HTMLSpanElement>`             |         | none         | Reaches the root          |
| `slotProps.icon` | `useRender.ComponentProps<'span'>` |         | none         | Props for the `icon` part |

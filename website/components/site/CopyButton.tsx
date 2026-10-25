// The site's one copy button, for a command or a config shown beside it: the site's copy icon, the
// package's tick once copied, and a status line screen readers hear (CopyButtonClient). A server
// component, so the tick comes from the package's file; put it after the text it copies.
import { CopyButtonClient } from './CopyButtonClient.tsx'
import { CopyIcon } from './icons.tsx'
import { PackageIcon } from './PackageIcon.tsx'

export interface CopyButtonProps {
  /** The text the button copies, exactly as shown beside it */
  text: string
  /** What the button copies, as its label: "Copy the command" */
  label: string
  className?: string
}

export function CopyButton({ text, label, className }: CopyButtonProps) {
  return (
    <CopyButtonClient
      text={text}
      label={label}
      className={className}
      copyIcon={<CopyIcon />}
      copiedIcon={<PackageIcon name="tick" />}
    />
  )
}

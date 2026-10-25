// An icon from @mylder/perron's icons/ folder, inline, so it takes the colour of the text around
// it, sized by .perron-icon (the package's class) and hidden from screen readers. A server
// component: it reads the file at build time. A client component takes one as a prop.
import { readRepoFile } from '../../lib/repo.ts'

export interface PackageIconProps {
  /** The file's name without `.svg`, as packages/perron/icons/icons.json lists it: `search` */
  name: string
}

export function PackageIcon({ name }: PackageIconProps) {
  const svg = readRepoFile(`packages/perron/icons/${name}.svg`).replace(
    '<svg ',
    '<svg class="perron-icon" aria-hidden="true" focusable="false" ',
  )
  return <span className="site-icon" aria-hidden="true" dangerouslySetInnerHTML={{ __html: svg }} />
}

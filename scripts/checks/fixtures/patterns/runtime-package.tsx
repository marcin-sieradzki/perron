import { createPortal } from 'react-dom'
import clsx from 'clsx'

export const Fixture = () => createPortal(<div className={clsx('pn-Fixture')} />, document.body)

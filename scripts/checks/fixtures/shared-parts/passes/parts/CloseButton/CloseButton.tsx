import close from '../../../icons/close.svg?raw'

/** The icon button that closes what it sits in. */
export const CloseButton = ({ label }: { label: string }) => (
  <button className="pn-CloseButton" aria-label={label}>
    <svg viewBox="0 0 16 16" aria-hidden>
      <path d="m4 4 8 8M12 4l-8 8" />
    </svg>
    <span dangerouslySetInnerHTML={{ __html: close }} />
  </button>
)

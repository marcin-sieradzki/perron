// A props type that keeps to the contract's vocabulary.
import type * as React from 'react'
import type { ComponentPropsWithRef, ReactNode, Ref } from 'react'
import type { Select } from '@base-ui/react/select'

type Details = Select.Root.ChangeEventDetails

export interface PassesProps extends Omit<
  ComponentPropsWithRef<'button'>,
  'color' | 'onChange' | 'value' | 'defaultValue'
> {
  /** The Penpot variant */
  variant?: 'contained' | 'outlined' | 'text'
  /** The intent */
  color?: 'neutral' | 'danger'
  /** The size */
  size?: 'small' | 'medium'
  /** Fills its container's width */
  fullWidth?: boolean
  /** Stops interaction */
  disabled?: boolean
  /** An icon before the label */
  startIcon?: ReactNode
  /** An icon after the label */
  endIcon?: React.ReactNode
  /** The value */
  value?: string
  /** The value it starts with */
  defaultValue?: string
  /** Called when the value changes */
  onChange?: (event: Event | undefined, value: string, details: Details) => void
  /** Whether it is open */
  open?: boolean
  /** Whether it starts open */
  defaultOpen?: boolean
  /** Called when it opens */
  onOpen?: (event: Event | undefined, details: Details) => void
  /** Called when it closes */
  onClose?: (event: Event | undefined, reason: Details['reason'], details: Details) => void
  /** The field's name in a form */
  name?: string
  /** Overrides the owned string for "Close" */
  closeLabel?: string
  /** The root element */
  ref?: Ref<HTMLButtonElement>
  /**
   * @deprecated Use `variant` instead.
   */
  outlined?: boolean
}

export const Passes = (props: PassesProps) => <button {...props} />

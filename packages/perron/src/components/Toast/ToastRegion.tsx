// Toast's region: the one Toast.Provider, and the one Toast.Portal and Toast.Viewport that render
// every open toast of an app, held by PerronProvider, or by a Toast with no PerronProvider around it
// (docs/components/toast.md, CR-2). Each toast renders here from the props its Toast put in the
// toast's `data`, not where the Toast is written. Internal to Toast's folder: the barrel exports
// Toast.tsx alone.
import { mergeProps } from '@base-ui/react/merge-props'
import { Toast as BaseToast } from '@base-ui/react/toast'
import { createContext, useContext, useId } from 'react'
import type { CSSProperties, KeyboardEvent, PointerEvent, ReactNode } from 'react'
import { useOwnedStrings } from '../../PerronProvider.tsx'
import { given, withClass } from '../../internal/nodes.ts'
import { usePart } from '../../internal/use-part.ts'
import { CloseButton } from '../../parts/CloseButton/CloseButton.tsx'
import { IntentIcon } from '../../parts/IntentIcon/IntentIcon.tsx'
import type { ToastCloseReason, ToastProps } from './Toast.tsx'
import './Toast.css'

/** The props a toast renders with: a Toast's own, less the ones that decide when it shows. */
export type ToastView = Omit<ToastProps, 'open' | 'defaultOpen' | 'onClose' | 'autoHideDuration'>

/** What a Toast puts in its toast's `data`, for the region to render it from. */
export interface ToastData {
  /** The toast's look and words. */
  view: ToastView
  /** Records why the toast is about to close, before Base UI closes it (CR-6). */
  record: (reason: Exclude<ToastCloseReason, 'timeout'>, event: Event) => void
}

/** Whether a region is around: a PerronProvider's, or a Toast's own. */
const HostContext = createContext(false)

/** Whether a PerronProvider's region, or another Toast's, is around this one. */
export const useToastHosted = () => useContext(HostContext)

export interface ToastHostProps {
  /** Overrides "Notifications", the region's name. */
  notificationsLabel?: string
  children?: ReactNode
}

/** The list of open toasts around `children`, and the region beside them that renders them. */
export function ToastHost({ notificationsLabel, children }: ToastHostProps) {
  return (
    <HostContext.Provider value={true}>
      {/* CR-2: no props, so Base UI's limit of 3 holds, and each toast brings its own timeout */}
      <BaseToast.Provider>
        {children}
        <ToastRegion notificationsLabel={notificationsLabel} />
      </BaseToast.Provider>
    </HostContext.Provider>
  )
}

/** The region: every toast in the list, newest first, in the list's order (CR-2, CR-8). */
function ToastRegion({ notificationsLabel }: { notificationsLabel?: string }) {
  // CR-3: the locale's word, never Base UI's English one
  const strings = useOwnedStrings({ notifications: notificationsLabel })
  const { toasts } = BaseToast.useToastManager<ToastData>()
  return (
    <BaseToast.Portal className="pn-Toast-portal">
      <BaseToast.Viewport className="pn-Toast-viewport" aria-label={strings.notifications}>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} />
        ))}
      </BaseToast.Viewport>
    </BaseToast.Portal>
  )
}

/** One toast from the list, drawn from its Toast's props as Alert draws itself (CR-1). */
function ToastItem({ toast }: { toast: BaseToast.Root.ToastObject<ToastData> }) {
  const { view, record } = toast.data!
  const {
    color = 'neutral',
    title,
    children,
    icon,
    action,
    closeLabel,
    slotProps,
    ref,
    style,
    className,
    ...rest
  } = view
  const strings = useOwnedStrings({ close: closeLabel })
  const descriptionId = useId()

  // Alert's CR-3 and CR-5: the caller's icon when given, the intent's when left out, no part when
  // there is none, and aria-hidden after the caller's
  const iconPart = usePart(
    'div',
    slotProps?.icon,
    {
      className: 'pn-Toast-icon',
      'aria-hidden': true,
      children: icon === undefined ? <IntentIcon color={color} /> : icon,
    },
    icon === undefined ? color !== 'neutral' : given(icon),
  )
  const actionPart = usePart(
    'div',
    slotProps?.action,
    { className: 'pn-Toast-action', children: action },
    given(action),
  )

  // CR-9: with no title, the description names the toast, and describes it no more
  const named = given(title)
  const naming =
    !named && given(children)
      ? { 'aria-labelledby': descriptionId, 'aria-describedby': undefined }
      : {}

  // CR-6: each reason is recorded before Base UI's own handler closes the toast
  const own = {
    'data-color': color,
    ...naming,
    onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'Escape') record('escape-key', event.nativeEvent)
    },
    onPointerUp: (event: PointerEvent<HTMLDivElement>) => {
      if (event.currentTarget.hasAttribute('data-swiping')) record('swipe', event.nativeEvent)
    },
  }

  // CR-11: the swipe moves the toast by `translate`, from Base UI's swipe variables, so Base UI's
  // inline `transform` while swiping is dropped, which would move it twice as far
  const rootStyle = (state: BaseToast.Root.State): CSSProperties => ({
    ...(typeof style === 'function' ? style(state) : style),
    transform: undefined,
  })

  const { render: titleRender, ...titleProps } = slotProps?.title ?? {}

  return (
    <BaseToast.Root
      {...mergeProps<'div'>(rest, own)}
      ref={ref}
      toast={toast}
      style={rootStyle}
      className={withClass('pn-Toast', className)}
    >
      {iconPart}
      <BaseToast.Content
        {...slotProps?.content}
        className={withClass('pn-Toast-content', slotProps?.content?.className)}
      >
        {named ? (
          <BaseToast.Title
            {...titleProps}
            render={titleRender ?? <p />}
            className={withClass('pn-Toast-title', titleProps.className)}
          >
            {title}
          </BaseToast.Title>
        ) : null}
        {given(children) ? (
          <BaseToast.Description
            {...mergeProps<typeof BaseToast.Description>(slotProps?.description, {
              id: descriptionId,
              render: <div />,
            })}
            className={withClass('pn-Toast-description', slotProps?.description?.className)}
          >
            {children}
          </BaseToast.Description>
        ) : null}
        {actionPart}
      </BaseToast.Content>
      {/* CR-7: always rendered, never disabled, never aria-hidden */}
      <BaseToast.Close
        {...mergeProps<typeof BaseToast.Close>(slotProps?.close, {
          render: <CloseButton label={strings.close} />,
          'aria-hidden': false,
          onClick: (event) => record('close-press', event.nativeEvent),
        })}
        className={withClass('pn-Toast-close', slotProps?.close?.className)}
      />
    </BaseToast.Root>
  )
}

// A made-up Button's stories: the line below is the type test that proves DD-2.
import { Button } from './Button.tsx'

// @ts-expect-error DD-2: MUI's contained is no variant of Button
export const Contained = () => <Button variant="contained">Save</Button>

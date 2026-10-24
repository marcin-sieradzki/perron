/** Names a variable clip and a clipPath key with no hiding value: neither hides text. */
export const Crop = ({ clip, cropped }: { clip: string; cropped: boolean }) => (
  <img alt="" src={cropped ? clip : 'full.png'} style={{ clipPath: 'circle(50%)' }} />
)

export const label = (clip: boolean) => (clip ? 'clipped' : 'whole')

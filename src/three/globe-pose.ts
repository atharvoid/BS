/** Compose user yaw and automatic drift once; rebase against the displayed
 * angle at pointer-down so an interrupted drag never snaps. */
export function globeYaw(userYaw: number, drift: number) {
  return userYaw + drift
}
export function globeUserYaw(displayedYaw: number, drift: number) {
  return displayedYaw - drift
}

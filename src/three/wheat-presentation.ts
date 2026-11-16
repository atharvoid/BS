/** Preserve the wheat asset's existing state key and public helpers. */
import {WHEAT_PRESENTATION} from './category-presentation.ts'
export {WHEAT_VERSION} from './category-presentation.ts'
export type {PresentationPair as WheatPair} from './category-presentation.ts'
export const subscribeWheat=WHEAT_PRESENTATION.subscribe
export const validWheatPair=WHEAT_PRESENTATION.valid
export const wheatPair=WHEAT_PRESENTATION.get
export const retainWheat=WHEAT_PRESENTATION.retain
export const persistWheat=WHEAT_PRESENTATION.persist

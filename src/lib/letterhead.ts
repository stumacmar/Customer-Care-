/*
 * The name that goes on letters, exports and the customer's app for a plot.
 * A group can run several trading names (subsidiaries, joint ventures) from
 * one app: a development's trading name wins, otherwise the company name.
 */
import type { AppState, Plot } from '../types'

export function letterheadName(state: AppState, plot: Plot): string {
  const dev = state.developments.find((d) => d.id === plot.developmentId)
  return dev?.tradingName || state.developerName
}

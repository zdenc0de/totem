import type { Dispatch } from 'react'
import type { FlowAction, FlowState } from '../state/flow'

export type ScreenProps = {
  state: FlowState
  dispatch: Dispatch<FlowAction>
}

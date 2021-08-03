export type ControlsAction =
  | { type: '@SET_STOPPED_PREMATURELY'; payload: boolean }
  | { type: '@SET_TIMER'; payload: number }
  | { type: '@SET_PERCENTAGE'; payload: number }
  | { type: '@SET_IS_RUNNING', payload: boolean }
  | { type: '@SET_IS_LOADING'; payload: boolean }
  | { type: '@SET_HAS_ERROR'; payload: boolean }
  | { type: '@RESET_STATE' };
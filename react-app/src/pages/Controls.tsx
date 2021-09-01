import React, { useCallback, useReducer } from 'react';
import { Divider, Loader, Message } from 'semantic-ui-react';
import ProgressBar from '../components/ProgressBar';
import { ActionButton } from '../components/ActionButton';
import { useToasts } from 'react-toast-notifications';
import { MESSAGE } from '@electron-app';
import reducer, { INITIAL_STATE } from './reducer';

const electron = window.require('electron');
const { ipcRenderer } = electron;

interface ControlsProps {
  onBack?: () => void;
}

const Controls: React.FC<ControlsProps> = ({ onBack }) => {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);

  const { percentage, isRunning, isLoading, isWaitingCcc, isReady } = state;
  const { addToast } = useToasts();

  const resetState = () => {
    dispatch({
      type: '@RESET_STATE',
    });
  };

  const stopPopulationStateUpdate = useCallback(() => {
    resetState();
    dispatch({
      type: '@SET_IS_RUNNING',
      payload: false,
    });
    dispatch({
      type: '@SET_STOPPED_PREMATURELY',
      payload: true,
    });
    addToast('Execution stopped successfully', { appearance: 'success' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stopTablePopulationExecution = () => {
    stopPopulationStateUpdate();
    ipcRenderer.send(MESSAGE.STOP_IMPORTER);
  };

  React.useEffect(() => {
    ipcRenderer.on(MESSAGE.STOP_IMPORTER_SHORTCUT, stopPopulationStateUpdate);
    return () => ipcRenderer.removeListener(MESSAGE.STOP_IMPORTER_SHORTCUT, stopPopulationStateUpdate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    const handler = (event: any, percentage: number) => {
      const roundedPercentage = +percentage.toFixed(1);
      if (roundedPercentage >= 100) {
        dispatch({
          type: '@SET_IS_RUNNING',
          payload: false,
        });
        dispatch({
          type: '@SET_IS_READY',
          payload: true,
        })
      }
      dispatch({
        type: '@SET_PERCENTAGE',
        payload: roundedPercentage,
      });
    };

    ipcRenderer.on(MESSAGE.PROGRESS_UPDATE, handler);
    return () => ipcRenderer.removeListener(MESSAGE.PROGRESS_UPDATE, handler);
  }, []);

  React.useEffect(() => {
    const handler = (event: any, isLoading: boolean) => {
      dispatch({
        type: '@SET_IS_LOADING',
        payload: isLoading,
      });
    };

    ipcRenderer.on(MESSAGE.LOADING_UPDATE, handler);
    return () => ipcRenderer.removeListener(MESSAGE.LOADING_UPDATE, handler);
  }, []);

  React.useEffect(() => {
    const handler = (event: any, message: string) => {
      resetState();
      dispatch({
        type: '@SET_IS_RUNNING',
        payload: false,
      });
      addToast(message, { appearance: 'error', autoDismiss: false });
    };

    ipcRenderer.on(MESSAGE.ERROR, handler);
    return () => ipcRenderer.removeListener(MESSAGE.ERROR, handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    ipcRenderer.on(MESSAGE.RESET_CONTROLS_STATE, resetState);
    return () => ipcRenderer.removeListener(MESSAGE.RESET_CONTROLS_STATE, resetState);
  }, []);

  React.useEffect(() => {
    const handler = (event: any, isWaitingCcc: boolean) => {
      dispatch({
        type: '@SET_IS_WAITING_CCC',
        payload: isWaitingCcc,
      });
    };

    ipcRenderer.on(MESSAGE.WAITING_CCC_UPDATE, handler);
    return () => ipcRenderer.removeListener(MESSAGE.WAITING_CCC_UPDATE, handler);
  }, []);

  const isIdle = !isLoading && !isWaitingCcc && !isRunning && !isReady;
  const isDownloadingForgettables = isLoading && !isWaitingCcc && !isReady;

  const renderContent = () => {
    if (isIdle) {
      return (
        <Message>
          <Message.Header>No input currently running</Message.Header>
          You can start one from FIT REV Scrubber
        </Message>
      );
    } else if (isWaitingCcc) {
      return (
        <div className="loader-container">
          <Loader active inline="centered">
            Waiting for you to open CCC and put it on your main screen...
          </Loader>
        </div>
      );
    }

    return <ProgressBar percentage={percentage} />;
  };

  if (isDownloadingForgettables) {
    return (
      <div className="loader-container">
        <Loader active inline="centered">
          Downloading forgettables...
        </Loader>
      </div>
    );
  }

  return (
    <div className="controls-loader">
      <div>{renderContent()}</div>
      <div>
        {!isDownloadingForgettables && (
          <>
            <Divider horizontal>Actions</Divider>
            <div className="button-group">
              {isRunning && <ActionButton.Stop onClick={stopTablePopulationExecution} />}
              {onBack && <ActionButton.Settings onClick={onBack} disabled={isRunning} />}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Controls;

import { AbstractConnector } from '@web3-react/abstract-connector';
import React from 'react';
import styled from 'styled-components';
import Option from './Option';
import { SUPPORTED_WALLETS } from '../../constants';
import { injected } from '../../connectors';
import { darken } from 'polished';
import Loader from '../Loader';

const PendingSection = styled.div`
  ${({ theme }) => theme.flexColumnNoWrap};
  align-items: center;
  justify-content: center;
  width: 100%;
  & > * {
    width: 100%;
  }
`;

const StyledLoader = styled(Loader)`
  margin-right: 1rem;
`;

const LoadingMessage = styled.div<{ error?: boolean }>`
  ${({ theme }) => theme.flexRowNoWrap};
  align-items: center;
  justify-content: flex-start;
  border-radius: 12px;
  margin-bottom: 20px;
  color: ${({ theme, error }) => (error ? theme.newTheme.error : 'inherit')};
  border: 1px solid ${({ theme, error }) => (error ? theme.newTheme.error : theme.text4)};

  & > * {
    padding: 1rem;
  }
`;

const ErrorGroup = styled.div`
  ${({ theme }) => theme.flexRowNoWrap};
  align-items: center;
  justify-content: flex-start;
`;

const ErrorButton = styled.div`
  border-radius: 8px;
  font-size: 12px;
  color: ${({ theme }) => theme.newTheme.white};
  background-color: ${({ theme }) => theme.newTheme.primary1};
  margin-left: 1rem;
  padding: 0.5rem;
  font-weight: 600;
  user-select: none;

  &:hover {
    cursor: pointer;
    background-color: ${({ theme }) => darken(0.04, theme.newTheme.primary1)};
  }
`;

const LoadingWrapper = styled.div`
  ${({ theme }) => theme.flexRowNoWrap};
  align-items: center;
  justify-content: center;
`;

export default function PendingView({
  connector,
  error = false,
  setPendingError,
  tryActivation,
}: {
  connector?: AbstractConnector;
  error?: boolean;
  setPendingError: (error: boolean) => void;
  tryActivation: (connector: AbstractConnector) => void;
}) {
  const isMetamask = window?.ethereum?.isMetaMask;

  return (
    <PendingSection>
      <LoadingMessage error={error}>
        <LoadingWrapper>
          {error ? (
            <ErrorGroup>
              <div>Error connecting.</div>
              <ErrorButton
                onClick={() => {
                  setPendingError(false);
                  connector && tryActivation(connector);
                }}
              >
                Try Again
              </ErrorButton>
            </ErrorGroup>
          ) : (
            <>
              <StyledLoader />
              Initializing...
            </>
          )}
        </LoadingWrapper>
      </LoadingMessage>
      {Object.keys(SUPPORTED_WALLETS).map((key) => {
        const option = SUPPORTED_WALLETS[key];
        if (option.connector === connector) {
          if (option.connector === injected) {
            if (isMetamask && option.name !== 'MetaMask Wallet') {
              return null;
            }
            if (!isMetamask && option.name === 'MetaMask Wallet') {
              return null;
            }
          }
          return (
            <Option
              id={`connect-${key}`}
              key={key}
              color={option.color}
              header={option.name}
              icon={require('../../assets/images/' + option.iconName)}
            />
          );
        }
        return null;
      })}
    </PendingSection>
  );
}

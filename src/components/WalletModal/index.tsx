import { AbstractConnector } from '@web3-react/abstract-connector';
import { UnsupportedChainIdError, useWeb3React } from '@web3-react/core';
import { WalletConnectConnector } from '@web3-react/walletconnect-connector';
import React, { useEffect, useState } from 'react';
import { isMobile } from 'react-device-detect';
import styled from 'styled-components';
import MetamaskIcon from '../../assets/images/metamask.png';
import { apiService } from '../../api/service';
import { injected } from '../../connectors';
import { SUPPORTED_WALLETS } from '../../constants';
import usePrevious from '../../hooks/usePrevious';
import { ApplicationModal } from '../../state/application/actions';
import { useModalOpen, useUserBlockedModalToggle, useWalletModalToggle } from '../../state/application/hooks';
import { TEXT } from '../../theme';
import AccountDetails from '../AccountDetails';
import Modal from '../Modal';
import Option from './Option';
import PendingView from './PendingView';
import CloseSvgIcon from '../../assets/svg-bid/close-small.svg';
import { switchNetwork } from '../../utils/switchNetwork';
import { Link } from 'react-router-dom';
import { InjectedConnector } from '@web3-react/injected-connector';

const CloseIcon = styled.div`
  position: absolute;
  right: 24px;
  top: 25px;

  &:hover {
    cursor: pointer;
    opacity: 0.5;
  }
`;

const Wrapper = styled.div`
  ${({ theme }) => theme.flexColumnNoWrap}
  margin: 0;
  padding: 0;
  width: 100%;
`;

const LinkText = styled.div`
  display: inline;
  cursor: pointer;
`;
const HeaderRow = styled.div`
  ${({ theme }) => theme.flexRowNoWrap};
  justify-content: center;
  padding-bottom: 20px;
  font-weight: 500;
  color: ${({ theme }) => theme.newTheme.textPrimary};
  ${({ theme }) => theme.mediaWidth.upToMedium`
    padding: 1rem;
  `};
`;

const ContentWrapper = styled.div``;

const UpperSection = styled.div`
  position: relative;
  padding: 24px;
  h5 {
    margin: 0;
    margin-bottom: 0.5rem;
    font-size: 1rem;
    font-weight: 400;
  }

  h5:last-child {
    margin-bottom: 0px;
  }

  h4 {
    margin-top: 0;
    font-weight: 500;
  }
`;

const Blurb = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-top: 18px;

  a {
    margin-top: 8px;
  }
`;

const OptionGrid = styled.div`
  display: grid;
  grid-gap: 8px;
  ${({ theme }) => theme.mediaWidth.upToMedium`
    grid-template-columns: 1fr;
    grid-gap: 10px;
  `};
`;

const HoverText = styled.div`
  :hover {
    cursor: pointer;
  }
`;

const WALLET_VIEWS = {
  OPTIONS: 'options',
  OPTIONS_SECONDARY: 'options_secondary',
  ACCOUNT: 'account',
  PENDING: 'pending',
};

export default function WalletModal({
  pendingTransactions,
  confirmedTransactions,
  ENSName,
}: {
  pendingTransactions: string[]; // hashes of pending
  confirmedTransactions: string[]; // hashes of confirmed
  ENSName?: string;
}) {
  // important that these are destructed from the account-specific web3-react context
  const { active, account, connector, activate, error, deactivate } = useWeb3React();

  const [walletView, setWalletView] = useState(WALLET_VIEWS.ACCOUNT);

  const [pendingWallet, setPendingWallet] = useState<AbstractConnector | undefined>();

  const [pendingError, setPendingError] = useState<boolean>();

  const [providerId, setproviderId] = useState('');

  const walletModalOpen = useModalOpen(ApplicationModal.WALLET);
  const toggleWalletModal = useWalletModalToggle();

  const previousAccount = usePrevious(account);

  const toggleUserBlockedModal = useUserBlockedModalToggle();

  // close on connection, when logged out before
  useEffect(() => {
    if (account && !previousAccount && walletModalOpen) {
      toggleWalletModal();
    }
  }, [account, previousAccount, toggleWalletModal, walletModalOpen]);

  // always reset to account view
  useEffect(() => {
    if (walletModalOpen) {
      setPendingError(false);
      setWalletView(WALLET_VIEWS.ACCOUNT);
    }
  }, [walletModalOpen]);

  const setLoggedIn = () => {
    localStorage.setItem('loggedIn', 'true');
  };

  // close modal when a connection is successful
  const activePrevious = usePrevious(active);
  const connectorPrevious = usePrevious(connector);
  useEffect(() => {
    if (walletModalOpen && ((active && !activePrevious) || (connector && connector !== connectorPrevious && !error))) {
      setWalletView(WALLET_VIEWS.ACCOUNT);
    }
  }, [setWalletView, active, error, connector, walletModalOpen, activePrevious, connectorPrevious]);

  const tryActivation = async (connector: AbstractConnector | undefined) => {
    setPendingWallet(connector); // set wallet for pending view
    setWalletView(WALLET_VIEWS.PENDING);

    // if the connector is walletconnect and the user has already tried to connect, manually reset the connector
    if (connector instanceof WalletConnectConnector && connector.walletConnectProvider?.wc?.uri) {
      connector.walletConnectProvider = undefined;
    }

    connector &&
      activate(connector, undefined, true)
        .then(() => {
          setLoggedIn();
        })
        .catch((error) => {
          if (error instanceof UnsupportedChainIdError) {
            switchNetwork();
            activate(connector).then(() => {
              setLoggedIn();
            });
          } else {
            setPendingError(true);
          }
        });

    if (connector instanceof InjectedConnector) {
      setproviderId('MetaMask');
    } else {
      setproviderId('WalletConnect');
    }
  };

  const checkWallet = async () => {
    if (!account) return;
    const response = await apiService.getByAddress(account);
    if (response && response?.data && !response?.data?.isActive) {
      deactivate();
      localStorage.removeItem('loggedIn');
      toggleUserBlockedModal();
    }
  };

  useEffect(() => {
    if (!account || !providerId) return;
    apiService.addWallet({ address: account, providerId });
  }, [account, providerId]);

  useEffect(() => {
    if (!account) return;
    checkWallet();
  }, [account]);

  // get wallets user can switch too, depending on device/browser
  function getOptions() {
    const isMetamask = window.ethereum && window.ethereum.isMetaMask;
    return Object.keys(SUPPORTED_WALLETS).map((key) => {
      const option = SUPPORTED_WALLETS[key];
      // check for mobile options
      if (isMobile) {
        //disable portis on mobile for now
        // if (option.connector === portis) {
        //   return null;
        // }

        if (!window.web3 && !window.ethereum && option.mobile) {
          return (
            <Option
              onClick={() => {
                option.connector !== connector && !option.href && tryActivation(option.connector);
              }}
              id={`connect-${key}`}
              key={key}
              active={option.connector && option.connector === connector}
              color={option.color}
              link={option.href}
              header={option.name}
              description={option?.description}
              icon={require('../../assets/images/' + option.iconName)}
            />
          );
        }
        return null;
      }

      // overwrite injected when needed
      if (option.connector === injected) {
        // don't show injected if there's no injected provider
        if (!(window.web3 || window.ethereum)) {
          if (option.name === 'MetaMask Wallet') {
            return (
              <Option
                id={`connect-${key}`}
                key={key}
                color={'#E8831D'}
                header={'Install Metamask'}
                link={'https://metamask.io/'}
                icon={MetamaskIcon}
                description={option?.description}
              />
            );
          } else {
            return null; //dont want to return install twice
          }
        }
        // don't return metamask if injected provider isn't metamask
        else if (option.name === 'MetaMask Wallet' && !isMetamask) {
          return null;
        }
        // likewise for generic
        else if (option.name === 'Injected' && isMetamask) {
          return null;
        }
      }

      // return rest of options
      return (
        !isMobile &&
        !option.mobileOnly && (
          <Option
            id={`connect-${key}`}
            onClick={() => {
              option.connector === connector
                ? setWalletView(WALLET_VIEWS.ACCOUNT)
                : !option.href && tryActivation(option.connector);
            }}
            key={key}
            active={option.connector === connector}
            color={option.color}
            link={option.href}
            description={option?.description}
            header={option.name}
            icon={require('../../assets/images/' + option.iconName)}
          />
        )
      );
    });
  }

  function getModalContent() {
    if (error) {
      return (
        <UpperSection>
          <CloseIcon onClick={toggleWalletModal}>
            <img src={CloseSvgIcon} alt="close" />
          </CloseIcon>
          <HeaderRow>{error instanceof UnsupportedChainIdError ? 'Wrong Network' : 'Error connecting'}</HeaderRow>
          <ContentWrapper>
            {error instanceof UnsupportedChainIdError ? (
              <h5 style={{ textAlign: 'center' }}>Please connect to the appropriate Ethereum network.</h5>
            ) : (
              'Error connecting. Try refreshing the page.'
            )}
          </ContentWrapper>
        </UpperSection>
      );
    }
    if (account && walletView === WALLET_VIEWS.ACCOUNT) {
      return (
        <AccountDetails
          toggleWalletModal={toggleWalletModal}
          pendingTransactions={pendingTransactions}
          confirmedTransactions={confirmedTransactions}
          ENSName={ENSName}
          openOptions={() => setWalletView(WALLET_VIEWS.OPTIONS)}
        />
      );
    }
    return (
      <UpperSection>
        <CloseIcon onClick={toggleWalletModal}>
          <img src={CloseSvgIcon} alt="close" />
        </CloseIcon>
        {walletView !== WALLET_VIEWS.ACCOUNT ? (
          <HeaderRow color="blue">
            <HoverText
              onClick={() => {
                setPendingError(false);
                setWalletView(WALLET_VIEWS.ACCOUNT);
              }}
            >
              Back
            </HoverText>
          </HeaderRow>
        ) : (
          <HeaderRow>
            <TEXT.default fontWeight={600} fontSize={20} color="textPrimary">
              Connect wallet
            </TEXT.default>
          </HeaderRow>
        )}
        <ContentWrapper>
          {walletView === WALLET_VIEWS.PENDING ? (
            <PendingView
              connector={pendingWallet}
              error={pendingError}
              setPendingError={setPendingError}
              tryActivation={tryActivation}
            />
          ) : (
            <OptionGrid>{getOptions()}</OptionGrid>
          )}
          {walletView !== WALLET_VIEWS.PENDING && (
            <Blurb>
              <TEXT.default fontWeight={600} fontSize={12} color="textSecondary">
                By connecting, I accept
              </TEXT.default>
              <LinkText as={Link} to="/service" style={{ textDecoration: 'none' }} onClick={toggleWalletModal}>
                <TEXT.default fontWeight={600} fontSize={14} color="primary1" lineHeight="23.1px">
                  Terms of Use
                </TEXT.default>
              </LinkText>
            </Blurb>
          )}
        </ContentWrapper>
      </UpperSection>
    );
  }

  return (
    <Modal isOpen={walletModalOpen} onDismiss={toggleWalletModal} minHeight={false} maxHeight={90}>
      <Wrapper>{getModalContent()}</Wrapper>
    </Modal>
  );
}

import { ChainId, Pair, Trade } from '@bidelity/sdk';
import React from 'react';
import styled from 'styled-components';
import Modal from '../Modal';
import { ExternalLink, TEXT } from '../../theme';
import { RowBetween } from '../Row';
import { ButtonPrimary } from '../Button';
import { AutoColumn, ColumnCenter } from '../Column';

import { getEtherscanLink } from '../../utils';
import { useActiveWeb3React } from '../../hooks';
import CloseSvgIcon from '../../assets/svg-bid/close-small.svg';
import ClockIcon from '../../assets/svg-bid/clock.svg';
import ErrorIcon from '../../assets/svg-bid/error.svg';
import CircleIcon from '../../assets/svg-bid/tick-circle.svg';
import ExportIcon from '../../assets/svg-bid/export.svg';
import ApproveTokensIcon from '../../assets/svg-bid/approve-tokens-image.svg';
import MetamaskIcon from '../../assets/images/metamask.png';
import { darken } from 'polished';
import { PairState } from '../../data/Reserves';

const TransactionButton = styled(ButtonPrimary)`
  padding-top: 10px;
  padding-bottom: 10px;
  border-radius: 8px;
`;

const Wrapper = styled.div`
  width: 100%;
  background-color: ${({ theme }) => theme.newTheme.white};
`;

const WrapperSecondary = styled(Wrapper)`
  padding: 24px;
`;

const Section = styled(AutoColumn)`
  padding: 16px 16px 0 16px;
`;

const BottomSection = styled(Section)`
  border-bottom-left-radius: 20px;
  border-bottom-right-radius: 20px;
  padding: 8px 16px 16px;
`;

const ConfirmedIcon = styled(ColumnCenter)`
  margin-top: 40px;
  img {
    width: 50px;
    height: 50px;
  }
`;

const CloseIcon = styled.div`
  position: absolute;
  right: 10px;
  top: 2px;

  &:hover {
    cursor: pointer;
    opacity: 0.5;
  }
`;

const TitleSection = styled.div`
  position: relative;
  display: flex;
  justify-content: center;
  margin-bottom: 18px;
`;

const PendingSection = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 16px;
`;

const PendingSectionSecondary = styled(PendingSection)`
  border: 1px solid ${({ theme }) => theme.newTheme.border3};
  border-radius: 14px;
`;

const TopSection = styled(RowBetween)`
  position: relative;
  padding: 10px 3px 4px;
`;

const ImageWrapper = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 8px;
  img {
    width: 50px;
    height: 50px;
  }
`;

const Image = styled.div`
  display: flex;
  justify-content: center;
  img {
    width: 60px;
    height: 60px;
  }
`;

const ImageWrapperBig = styled(ImageWrapper)`
  img {
    width: 263px;
    height: 228px;
  }
`;

const ErrorSection = styled.div`
  padding: 16px;
  display: flex;
  flex-direction: column;
`;

const ButtonWrapper = styled.div`
  width: 100%;
  margin-top: 20px;
`;

const WalletSection = styled.div`
  margin-top: 10px;
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: ${({ theme }) => theme.newTheme.bg2};
  border-radius: 14px;
  cursor: pointer;

  :hover {
    background-color: ${({ theme }) => darken(0.04, theme.newTheme.bg2)};
  }
`;

const AddToMetamaskSection = styled(WalletSection)`
  margin-top: 24px;
  background-color: ${({ theme }) => theme.newTheme.primary1};

  :hover {
    background-color: ${({ theme }) => darken(0.02, theme.newTheme.primary1)};
  }
`;

const WalletIcon = styled.div`
  height: 40px;
  width: 40px;
  background-color: ${({ theme }) => theme.newTheme.white};
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  border: 1px solid ${({ theme }) => theme.newTheme.border3};

  img {
    width: 20px;
    height: 20px;
  }
`;

function ConfirmationPendingContent({
  onDismiss,
  pendingText,
  pendingContent,
}: {
  onDismiss: () => void;
  pendingText: string;
  pendingContent?: () => React.ReactNode;
}) {
  return (
    <Wrapper>
      <PendingSection>
        <TopSection>
          <div />
          <div onClick={onDismiss} style={{ cursor: 'pointer' }}>
            <img src={CloseSvgIcon} alt="close" />
          </div>
        </TopSection>
        <ImageWrapper>
          <img src={ClockIcon} alt="pending" />
        </ImageWrapper>
        <AutoColumn gap="12px" justify={'center'}>
          <TEXT.default fontWeight={600} fontSize={20} color="warning">
            Waiting For Confirmation
          </TEXT.default>
          {pendingContent ? (
            pendingContent()
          ) : (
            <TEXT.default fontWeight={600} fontSize={14} textAlign="center">
              {pendingText}
            </TEXT.default>
          )}
          <TEXT.default fontWeight={400} fontSize={14} color="textSecondary" textAlign="center">
            Confirm this transaction in your wallet
          </TEXT.default>
        </AutoColumn>
      </PendingSection>
    </Wrapper>
  );
}

export function ApproveTokensContent({ onDismiss, pendingText }: { onDismiss: () => void; pendingText: string }) {
  return (
    <Wrapper>
      <PendingSection>
        <TopSection>
          <div />
          <TEXT.primary fontSize={20} fontWeight={600}>
            Approve Tokens
          </TEXT.primary>
          <div onClick={onDismiss} style={{ cursor: 'pointer' }}>
            <img src={CloseSvgIcon} alt="close" />
          </div>
        </TopSection>
        <ImageWrapperBig>
          <img src={ApproveTokensIcon} alt="pending" />
        </ImageWrapperBig>
        <AutoColumn gap="10px" justify={'center'}>
          <TEXT.default fontWeight={600} fontSize={20} color="warning">
            Waiting For Confirmation
          </TEXT.default>
          <TEXT.default fontWeight={600} fontSize={14} textAlign="center">
            {pendingText}
          </TEXT.default>
          <TEXT.default fontWeight={400} fontSize={14} color="textSecondary" textAlign="center">
            Confirm this transaction in your wallet
          </TEXT.default>
        </AutoColumn>
      </PendingSection>
    </Wrapper>
  );
}

function TransactionSubmittedContent({
  onDismiss,
  chainId,
  hash,
  v2pair,
  pair,
  isRemove,
}: {
  onDismiss: () => void;
  hash: string | undefined;
  chainId: ChainId;
  trade?: Trade | undefined;
  v2pair?: [PairState, Pair | null];
  pair?: Pair | null | undefined;
  isRemove?: boolean;
}) {
  let address: string;
  let decimals: number;
  let symbol: string | undefined;

  if (v2pair && v2pair[1]?.liquidityToken) {
    const lpToken = v2pair[1]?.liquidityToken;

    address = lpToken?.address;
    decimals = lpToken?.decimals;
    symbol = lpToken?.symbol;
  } else if (pair && pair.liquidityToken) {
    address = pair.liquidityToken?.address;
    decimals = pair.liquidityToken?.decimals;
    symbol = pair.liquidityToken?.symbol;
  }

  const { library } = useActiveWeb3React();

  const callback = (error: any, response: any) => console.debug(error);

  const addToMetamask = () => {
    if (library) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
      // @ts-ignore
      library?.provider.send(
        {
          method: 'wallet_watchAsset',
          params: {
            type: 'ERC20',
            options: {
              address: address,
              symbol: symbol,
              decimals: decimals,
            },
          } as any,
        },
        callback
      );
    }
  };

  if (isRemove) {
    return (
      <WrapperSecondary>
        <AutoColumn gap="xl">
          <RowBetween>
            <div />
            <TEXT.primary fontSize={20} fontWeight={600}>
              You will receive
            </TEXT.primary>
            <div onClick={onDismiss} style={{ cursor: 'pointer' }}>
              <img src={CloseSvgIcon} alt="close" />
            </div>
          </RowBetween>
          <PendingSectionSecondary>
            <ConfirmedIcon>
              <img src={ExportIcon} alt="confirmed" />
            </ConfirmedIcon>
            <AutoColumn gap="14px">
              <AutoColumn gap="10px" justify={'center'}>
                <TEXT.primary fontWeight={600} fontSize={16}>
                  Transaction Submitted
                </TEXT.primary>
                {chainId && hash && (
                  <ExternalLink href={getEtherscanLink(chainId, hash, 'transaction')}>
                    <TEXT.default fontWeight={600} fontSize={14} color="blue">
                      View on EtherScan
                    </TEXT.default>
                  </ExternalLink>
                )}
              </AutoColumn>
              <WalletSection onClick={addToMetamask}>
                <div style={{ flex: 1, marginRight: '10px' }}>
                  <TEXT.default fontWeight={700} fontSize={12} color="primary1">
                    Add {symbol} to Metamask
                  </TEXT.default>
                </div>
                <WalletIcon>
                  <img src={MetamaskIcon} alt="icon" />
                </WalletIcon>
              </WalletSection>
            </AutoColumn>
          </PendingSectionSecondary>
          <ButtonWrapper>
            <TransactionButton onClick={onDismiss}>
              <TEXT.default fontWeight={600} fontSize={14} color="white">
                Close
              </TEXT.default>
            </TransactionButton>
          </ButtonWrapper>
        </AutoColumn>
      </WrapperSecondary>
    );
  }

  return (
    <Wrapper>
      <PendingSection>
        <ConfirmedIcon>
          <img src={CircleIcon} alt="confirmed" />
        </ConfirmedIcon>
        <AutoColumn gap="12px" justify={'center'}>
          <TEXT.default fontWeight={600} fontSize={20} color="primary1">
            Confirmed
          </TEXT.default>
          {chainId && hash && (
            <ExternalLink href={getEtherscanLink(chainId, hash, 'transaction')}>
              <TEXT.default fontWeight={600} fontSize={14} color="#335BE9">
                View in Explorer
              </TEXT.default>
            </ExternalLink>
          )}
        </AutoColumn>
        {symbol !== undefined && (
          <AddToMetamaskSection onClick={addToMetamask}>
            <div style={{ flex: 0.8 }}>
              <TEXT.default fontWeight={500} fontSize={14} color="white">
                Add {symbol} to MetaMask as a new token
              </TEXT.default>
            </div>
            <WalletIcon>
              <img src={MetamaskIcon} alt="icon" />
            </WalletIcon>
          </AddToMetamaskSection>
        )}
      </PendingSection>
    </Wrapper>
  );
}

export function ConfirmationModalContent({
  title,
  bottomContent,
  onDismiss,
  topContent,
}: {
  title: string;
  onDismiss: () => void;
  topContent: () => React.ReactNode;
  bottomContent: () => React.ReactNode;
}) {
  return (
    <Wrapper>
      <Section>
        <TitleSection>
          <TEXT.default fontWeight={600} fontSize={20} color="textPrimary" textAlign="center">
            {title}
          </TEXT.default>
          <CloseIcon onClick={onDismiss}>
            <img src={CloseSvgIcon} alt="close" />
          </CloseIcon>
        </TitleSection>
        {topContent()}
      </Section>
      <BottomSection gap="12px">{bottomContent()}</BottomSection>
    </Wrapper>
  );
}

export function TransactionErrorContent({
  message = 'Transaction failed.',
  buttonText = 'Dismiss',
  onDismiss,
}: {
  message?: string;
  buttonText?: string;
  onDismiss: () => void;
}) {
  return (
    <Wrapper>
      <ErrorSection>
        <ImageWrapper>
          <img src={ErrorIcon} alt="error" />
        </ImageWrapper>
        <TEXT.default fontWeight={600} fontSize={16} color="error" textAlign="center" marginTop="20px">
          {message}
        </TEXT.default>
        <TransactionButton onClick={onDismiss} marginTop="28px">
          {buttonText}
        </TransactionButton>
      </ErrorSection>
    </Wrapper>
  );
}

interface TokenModalProps {
  onDismiss: () => void;
  icon: typeof CircleIcon;
  title: string;
  text: string;
}

export function TokenAddedModalContent({ onDismiss, title, text, icon }: TokenModalProps) {
  return (
    <Wrapper style={{ padding: '18px' }}>
      <AutoColumn gap="16px">
        <RowBetween>
          <div />
          <div />
          <div onClick={onDismiss} style={{ cursor: 'pointer' }}>
            <img src={CloseSvgIcon} alt="close" />
          </div>
        </RowBetween>
        <Image>
          <img src={icon} alt="error" />
        </Image>
        <TEXT.primary fontWeight={600} fontSize={20} textAlign="center">
          {title}
        </TEXT.primary>
        <TEXT.primary fontWeight={500} fontSize={14} textAlign="center">
          {text}
        </TEXT.primary>
        <TransactionButton onClick={onDismiss}>Confirm</TransactionButton>
      </AutoColumn>
    </Wrapper>
  );
}

interface ConfirmationModalProps {
  isOpen: boolean;
  onDismiss: () => void;
  hash: string | undefined;
  content: () => React.ReactNode;
  attemptingTxn: boolean;
  pendingText: string;
  pendingContent?: () => React.ReactNode;
  trade?: Trade | undefined;
  v2pair?: [PairState, Pair | null];
  isAddLiquidityPage?: boolean;
  pair?: Pair | null | undefined;
  isRemove?: boolean;
}

export default function TransactionConfirmationModal({
  isOpen,
  onDismiss,
  attemptingTxn,
  hash,
  pendingText,
  content,
  pendingContent,
  trade,
  isAddLiquidityPage,
  v2pair,
  pair,
  isRemove,
}: ConfirmationModalProps) {
  const { chainId } = useActiveWeb3React();

  if (!chainId) return null;

  // confirmation screen
  return (
    <Modal
      isOpen={isOpen}
      onDismiss={onDismiss}
      maxHeight={90}
      maxWidth={attemptingTxn || hash || isAddLiquidityPage ? 345 : 380}
    >
      {attemptingTxn ? (
        <ConfirmationPendingContent onDismiss={onDismiss} pendingText={pendingText} pendingContent={pendingContent} />
      ) : hash ? (
        <TransactionSubmittedContent
          chainId={chainId}
          hash={hash}
          onDismiss={onDismiss}
          trade={trade}
          v2pair={v2pair}
          pair={pair}
          isRemove={isRemove}
        />
      ) : (
        content()
      )}
    </Modal>
  );
}

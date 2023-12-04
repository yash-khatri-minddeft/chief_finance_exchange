import React from 'react';
import styled from 'styled-components';

import LogoBig from '../../assets/Pngs/logo-white.png';
import WalletIcon from '../../assets/svg-bid/wallet.svg';
import TradeIcon from '../../assets/svg-bid/trade.svg';
import Exchange from '../../assets/svg-bid/landing-exchange.svg';
import { useActiveWeb3React } from '../../hooks';

import Web3Status from '../Web3Status';
import { TEXT } from '../../theme';
import { NavLink } from 'react-router-dom';
import LanguageSwitcher from '../LanguageSwitcher';
import { useTokenAddedModalOpen, useTokenAddedModalToggle } from '../../state/application/hooks';
import { TokenAddedModal } from '../SearchModal/TokenAddedModal';
import TokenList from '../home/PricesRow';

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  background-color: ${({ theme }) => theme.newTheme.primary2};
`;

const HeaderFrame = styled.div<{ isBorder: string }>`
  position: relative;
  width: 100vw;
  padding: 16px 1.25rem;
  display: flex;
  z-index: 2;
  justify-content: space-between;
  align-items: center;
  border-bottom: ${({ theme, isBorder }) => (isBorder === 'true' ? `1px solid ${theme.newTheme.border}` : '')}};
`;

const HeaderControls = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-self: flex-end;
`;

const HeaderElement = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;

  ${({ theme }) => theme.mediaWidth.upToMedium`
   flex-direction: row-reverse;
    align-items: center;
  `};
`;

const HeaderRow = styled.div`
  display: flex;
  align-items: center;
`;

const BlockWithMargin = styled(HeaderRow)<{ marginLeft: string }>`
  margin-left: ${({ marginLeft }) => marginLeft};
`;

const StyledNavLink = styled(NavLink)`
  color: ${({ theme }) => theme.newTheme.white};
  display: flex;
  align-items: center;
  text-decoration: none;
`;

const AccountElement = styled.div<{ active: boolean }>`
  display: flex;
  flex-direction: row;
  align-items: center;
  background-color: ${({ theme, active }) => (!active ? theme.bg1 : theme.bg3)};
  border-radius: 0.8rem;
  white-space: nowrap;
  width: 100%;
  cursor: pointer;

  :focus {
    border: 1px solid blue;
  }
`;

const Title = styled.a`
  display: flex;
  align-items: center;
  pointer-events: auto;
  justify-self: flex-start;
  margin-right: 0.75rem;
  text-decoration: none;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    justify-self: center;
  `};
  :hover {
    cursor: pointer;
  }
`;

const BottomRow = styled.div`
  padding: 10px 0;
`;

const TopRow = styled.div`
  padding: 16px 65px 9px;
`;

export default function Header({
  showBottom = false,
  showTop = false,
  isHome = false,
}: {
  showBottom?: boolean;
  showTop?: boolean;
  isHome?: boolean;
}) {
  const { account } = useActiveWeb3React();

  const open = useTokenAddedModalOpen();
  const toggle = useTokenAddedModalToggle();

  return (
    <Wrapper>
      {showTop && (
        <TopRow>
          <TokenList />
        </TopRow>
      )}
      <HeaderFrame isBorder={String(showBottom)}>
        <TokenAddedModal isOpen={open} onDismiss={toggle} />
        <HeaderRow>
          <Title href="/">
            <img width="44px" height="42px" src={LogoBig} alt="logo" />
            <BlockWithMargin marginLeft={'0.5rem'}>
              <TEXT.big>Chief Finance</TEXT.big>
            </BlockWithMargin>
          </Title>

          <BlockWithMargin marginLeft={'2.5rem'}>
            <HeaderRow>
              <StyledNavLink to={'/pool'}>
                <img width="14px" height="13px" src={WalletIcon} alt="icon" />
                <BlockWithMargin marginLeft={'0.5rem'}>
                  <TEXT.white600>Pool</TEXT.white600>
                </BlockWithMargin>
              </StyledNavLink>
              <StyledNavLink to={'/swap'}>
                <BlockWithMargin marginLeft={'1.5rem'}>
                  <img width="14px" height="13px" src={isHome ? Exchange : TradeIcon} alt="icon" />
                  <BlockWithMargin marginLeft={'0.5rem'}>
                    <TEXT.white600>Exchange</TEXT.white600>
                  </BlockWithMargin>
                </BlockWithMargin>
              </StyledNavLink>
            </HeaderRow>
          </BlockWithMargin>
        </HeaderRow>

        <HeaderControls>
          <HeaderElement>
            <AccountElement active={!!account} style={{ pointerEvents: 'auto' }}>
              <Web3Status />
            </AccountElement>
          </HeaderElement>

          <BlockWithMargin marginLeft={'1rem'}>
            <LanguageSwitcher />
          </BlockWithMargin>
        </HeaderControls>
      </HeaderFrame>
      {showBottom && (
        <BottomRow>
          <TEXT.default fontWeight={700} fontSize={16} color="text2" textAlign="center">
            Exchange (DeFi)
          </TEXT.default>
        </BottomRow>
      )}
    </Wrapper>
  );
}

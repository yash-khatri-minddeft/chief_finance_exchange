import React, { useMemo } from 'react';
import styled from 'styled-components';
import { Pair } from '@bidelity/sdk';
import { useTokenBalancesWithLoadingIndicator } from '../../state/wallet/hooks';
import { ButtonPrimary } from '../../components/Button';
import { AutoColumn } from '../../components/Column';
import { useActiveWeb3React } from '../../hooks';
import { usePairs } from '../../data/Reserves';
import { toV2LiquidityToken, useTrackedTokenPairs } from '../../state/user/hooks';
import { useTranslation } from 'react-i18next';
import { useWalletModalToggle } from '../../state/application/hooks';
import PoolImage from '../../assets/svg-bid/direct-normal.svg';
import PlusIcon from '../../assets/svg-bid/plus.svg';
import { TEXT } from '../../theme';
import { darken } from 'polished';
import { Link } from 'react-router-dom';
import FullPositionCard from '../../components/PositionCard';
import { PageWrap } from '../AppBody';
import PoolsLink from '../../components/Poolslink';

const PoolPageWrapper = styled.div`
  position: relative;
  max-width: 436px;
  width: 100%;

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    width: 90%;
  `}
`;

const PageWrapper = styled(AutoColumn)`
  width: 100%;
  padding: 24px;
  background: ${({ theme }) => theme.newTheme.white};
  border-radius: 20px;
  margin-top: 32px;
`;

const ButtonWrapper = styled.div`
  margin-top: 16px;
`;

const Button = styled(ButtonPrimary)`
  border-radius: 14px;
  padding: 16px 0;
`;

const Flex = styled.div`
  display: flex;
  justify-content: center;
`;

const DisconnectButton = styled(Button)`
  background-color: ${({ theme }) => theme.newTheme.white};
  border: 1px solid ${({ theme }) => theme.newTheme.black};
  color: ${({ theme }) => theme.newTheme.black};

  :hover,
  :focus {
    background-color: ${({ theme }) => darken(0.05, theme.newTheme.white)};
  }
`;

const AddLiquidityButton = styled(ButtonPrimary)`
  display: flex;
  align-items: center;
  padding: 8px 0;
  border-radius: 10px;
`;

const BottomButtonWrapper = styled.div`
  width: 100%;
  margin-top: 16px;
`;

const BodySection = styled(Flex)`
  width: 100%;
`;

const Section = styled.div`
  width: 100%;
  max-width: 296px;
`;

const CardsWrapper = styled.div`
  margin-top: 8px;
  max-height: 415px;
  overflow: auto;
`;

const PoolImageWrapper = styled(BodySection)`
  img {
    width: 42px;
    height: 42px;
  }
`;

const TextSectionWithLiquidity = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
`;

export default function Pool() {
  // const theme = useContext(ThemeContext);
  const { account, deactivate } = useActiveWeb3React();

  const { t } = useTranslation();
  const toggleWalletModal = useWalletModalToggle();

  //fetch the user's balances of all tracked V2 LP tokens
  const trackedTokenPairs = useTrackedTokenPairs();

  const tokenPairsWithLiquidityTokens = useMemo(
    () => trackedTokenPairs.map((tokens) => ({ liquidityToken: toV2LiquidityToken(tokens), tokens })),
    [trackedTokenPairs]
  );
  const liquidityTokens = useMemo(
    () => tokenPairsWithLiquidityTokens.map((tpwlt) => tpwlt.liquidityToken),
    [tokenPairsWithLiquidityTokens]
  );
  const [v2PairsBalances, fetchingV2PairBalances] = useTokenBalancesWithLoadingIndicator(
    account ?? undefined,
    liquidityTokens
  );

  // fetch the reserves for all V2 pools in which the user has a balance
  const liquidityTokensWithBalances = useMemo(
    () =>
      tokenPairsWithLiquidityTokens.filter(({ liquidityToken }) =>
        v2PairsBalances[liquidityToken.address]?.greaterThan('0')
      ),
    [tokenPairsWithLiquidityTokens, v2PairsBalances]
  );
  const v2Pairs = usePairs(liquidityTokensWithBalances.map(({ tokens }) => tokens));
  const v2IsLoading =
    fetchingV2PairBalances ||
    v2Pairs?.length < liquidityTokensWithBalances.length ||
    v2Pairs?.some((V2Pair) => !V2Pair);
  const allV2PairsWithLiquidity = v2Pairs.map(([, pair]) => pair).filter((v2Pair): v2Pair is Pair => Boolean(v2Pair));

  const disconnect = () => {
    deactivate();
  };

  return (
    <PageWrap>
      <PoolPageWrapper>
        {!v2IsLoading && allV2PairsWithLiquidity.length === 0 && <AddLiquidity />}

        {v2IsLoading && (
          <PageWrapper>
            <Flex>Loading...</Flex>
          </PageWrapper>
        )}

        {!v2IsLoading && allV2PairsWithLiquidity.length === 0 && (
          <PageWrapper>
            <BodySection>
              <Section>
                <PoolImageWrapper>
                  <img src={PoolImage} alt="img" />
                </PoolImageWrapper>
                <TEXT.default
                  fontWeight={600}
                  fontSize={16}
                  color="textSecondary"
                  textAlign="center"
                  lineHeight="24px"
                  marginTop="16px"
                >
                  Your active V2 liquidity positions will appear here.
                </TEXT.default>
              </Section>
            </BodySection>
            <ButtonWrapper>
              {account === null && <Button onClick={toggleWalletModal}>{t('connect wallet')}</Button>}
              {account !== null && <DisconnectButton onClick={disconnect}>Disconnect</DisconnectButton>}
            </ButtonWrapper>
          </PageWrapper>
        )}

        {!v2IsLoading && allV2PairsWithLiquidity.length !== 0 && (
          <PageWrapper>
            <TextSectionWithLiquidity>
              <TEXT.default fontWeight={600} fontSize={20} lineHeight="30px" color="textPrimary">
                Your Liquidity
              </TEXT.default>
              <TEXT.default fontWeight={500} fontSize={12} lineHeight="20.4px" color="textSecondary">
                Remove liquidity to receive tokens back
              </TEXT.default>
            </TextSectionWithLiquidity>

            <CardsWrapper>
              {allV2PairsWithLiquidity.map((v2Pair) => (
                <FullPositionCard key={v2Pair.liquidityToken.address} pair={v2Pair} />
              ))}
            </CardsWrapper>

            <TextSectionWithLiquidity style={{ marginTop: '16px' }}>
              <BottomButtonWrapper>
                <AddLiquidity />
              </BottomButtonWrapper>
            </TextSectionWithLiquidity>
          </PageWrapper>
        )}
        <PoolsLink to="/pools:list" />
      </PoolPageWrapper>
    </PageWrap>
  );
}

const AddLiquidity = () => {
  return (
    <AddLiquidityButton as={Link} to="/add">
      <img src={PlusIcon} alt="add" style={{ marginRight: '8px' }} />
      Add Liquidity
    </AddLiquidityButton>
  );
};

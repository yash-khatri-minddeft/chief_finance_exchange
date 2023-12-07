import { JSBI, Pair, Percent, TokenAmount } from '@bidelity/sdk';
import { darken } from 'polished';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { useTotalSupply } from '../../data/TotalSupply';
import { useActiveWeb3React } from '../../hooks';
import { useTokenBalance } from '../../state/wallet/hooks';
import { TEXT } from '../../theme';
import { currencyId } from '../../utils/currencyId';
import { unwrappedToken } from '../../utils/wrappedCurrency';
import { ButtonPrimary } from '../Button';
import Card, { LightCard } from '../Card';
import { AutoColumn } from '../Column';
import CurrencyLogo from '../CurrencyLogo';
import { RowBetween } from '../Row';
import OpenIcon from '../../assets/svg-bid/vector-down.svg';
import CloseIcon from '../../assets/svg-bid/vector-up.svg';
import { useAddToMetamask } from '../../hooks/useAddToMetamask';
import { ZERO_STRING } from '../../constants';

export const FixedHeightRow = styled(RowBetween)`
  height: 24px;
`;

export const HoverCard = styled(Card)`
  border: 1px solid transparent;

  :hover {
    border: 1px solid ${({ theme }) => darken(0.06, theme.bg2)};
  }
`;

const Wrapper = styled.div`
  padding: 16px;
  border-radius: 20px;
  background-color: ${({ theme }) => theme.newTheme.white};
`;

const InnerSection = styled.div`
  padding: 16px;
  border-radius: 10px;
  background-color: ${({ theme }) => theme.newTheme.bg2};
`;

const LiquidityCard = styled.div`
  margin-top: 8px;
  background-color: ${({ theme }) => theme.newTheme.bg2};
  border-radius: 14px;
  overflow: hidden;
`;

const PairInfo = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
`;

const InlineDiv = styled.div`
  display: flex;
  align-items: center;
`;

const AddLiquidityButton = styled(ButtonPrimary)`
  display: flex;
  align-items: center;
  padding: 8px 0;
  border-radius: 10px;
`;

const RemoveLiquidityButton = styled(ButtonPrimary)`
  border: 1px solid #c0c0cf;
  border-radius: 8px;
  background-color: ${({ theme }) => theme.newTheme.bg2};
  color: ${({ theme }) => theme.newTheme.black};
  padding: 6px 20px;
  margin-right: 16px;
  font-size: 12px;
  font-weight: 600;

  :hover,
  :focus {
    background-color: ${({ theme }) => darken(0.05, theme.newTheme.bg2)};
  }
`;

const IconWrapper = styled.div`
  cursor: pointer;
`;

const Flex = styled.div`
  display: flex;
  align-items: center;
`;

interface PositionCardProps {
  pair: Pair;
  showUnwrapped?: boolean;
  border?: string;
  stakedBalance?: TokenAmount; // optional balance to indicate that liquidity is deposited in mining pool
}

export function MinimalPositionCard({ pair, showUnwrapped = false, border }: PositionCardProps) {
  const { account } = useActiveWeb3React();

  const currency0 = showUnwrapped ? pair.token0 : unwrappedToken(pair.token0);
  const currency1 = showUnwrapped ? pair.token1 : unwrappedToken(pair.token1);

  const userPoolBalance = useTokenBalance(account ?? undefined, pair.liquidityToken);
  const totalPoolTokens = useTotalSupply(pair.liquidityToken);

  const poolTokenPercentage =
    !!userPoolBalance && !!totalPoolTokens && JSBI.greaterThanOrEqual(totalPoolTokens.raw, userPoolBalance.raw)
      ? new Percent(userPoolBalance.raw, totalPoolTokens.raw)
      : undefined;

  const [token0Deposited, token1Deposited] =
    !!pair &&
    !!totalPoolTokens &&
    totalPoolTokens?.toSignificant(6) !== ZERO_STRING &&
    !!userPoolBalance &&
    userPoolBalance?.toSignificant(6) !== ZERO_STRING &&
    // this condition is a short-circuit in the case where useTokenBalance updates sooner than useTotalSupply
    JSBI.greaterThanOrEqual(totalPoolTokens.raw, userPoolBalance.raw)
      ? [
          pair.getLiquidityValue(pair.token0, totalPoolTokens, userPoolBalance, false),
          pair.getLiquidityValue(pair.token1, totalPoolTokens, userPoolBalance, false),
        ]
      : [undefined, undefined];

  return (
    <>
      {userPoolBalance && JSBI.greaterThan(userPoolBalance.raw, JSBI.BigInt(0)) ? (
        <Wrapper>
          <InnerSection>
            <AutoColumn gap="10px">
              <TEXT.primary fontWeight={600} fontSize={14}>
                LP tokens in your wallet
              </TEXT.primary>
              <RowBetween>
                <Flex>
                  <CurrencyLogo currency={currency0} />
                  <CurrencyLogo currency={currency1} style={{ marginLeft: '4px', marginRight: '6px' }} />
                  <TEXT.primary fontWeight={600} fontSize={12}>
                    {currency0.symbol} - {currency1.symbol}
                  </TEXT.primary>
                </Flex>
                <TEXT.primary fontWeight={600} fontSize={12}>
                  {userPoolBalance ? userPoolBalance.toSignificant(4) : '-'}
                </TEXT.primary>
              </RowBetween>
              <AutoColumn gap="3px">
                <RowBetween>
                  <TEXT.secondary fontWeight={500} fontSize={12}>
                    Share of Pool:
                  </TEXT.secondary>
                  <TEXT.primary fontWeight={600} fontSize={12}>
                    {poolTokenPercentage ? poolTokenPercentage.toFixed(6) + '%' : '-'}
                  </TEXT.primary>
                </RowBetween>
                <RowBetween>
                  <TEXT.secondary fontWeight={500} fontSize={12}>
                    Pool {currency0.symbol}:
                  </TEXT.secondary>
                  <TEXT.primary fontWeight={600} fontSize={12}>
                    {token0Deposited ? token0Deposited?.toSignificant(6) : '-'}
                  </TEXT.primary>
                </RowBetween>
                <RowBetween>
                  <TEXT.secondary fontWeight={500} fontSize={12}>
                    Pool {currency1.symbol}:
                  </TEXT.secondary>
                  <TEXT.primary fontWeight={600} fontSize={12}>
                    {token1Deposited ? token1Deposited?.toSignificant(6) : '-'}
                  </TEXT.primary>
                </RowBetween>
              </AutoColumn>
            </AutoColumn>
          </InnerSection>
        </Wrapper>
      ) : (
        <LightCard>
          <TEXT.secondary fontWeight={500} fontSize={12} lineHeight="24px">
            By adding liquidity you&apos;ll earn 0.17% of all trades on this pair proportional to your share of the
            pool. Fees are added to the pool, accrue in real time and can be claimed by withdrawing your liquidity.
          </TEXT.secondary>
        </LightCard>
      )}
    </>
  );
}

export default function FullPositionCard({ pair, stakedBalance }: PositionCardProps) {
  const { account } = useActiveWeb3React();

  const currency0 = unwrappedToken(pair.token0);
  const currency1 = unwrappedToken(pair.token1);

  const lpToken = pair.liquidityToken;

  const addToMetamask = useAddToMetamask(lpToken);

  const [showMore, setShowMore] = useState(false);
  const userDefaultPoolBalance = useTokenBalance(account ?? undefined, pair.liquidityToken);
  const totalPoolTokens = useTotalSupply(pair.liquidityToken);

  // if staked balance balance provided, add to standard liquidity amount
  const userPoolBalance = stakedBalance ? userDefaultPoolBalance?.add(stakedBalance) : userDefaultPoolBalance;

  const poolTokenPercentage =
    !!userPoolBalance && !!totalPoolTokens && JSBI.greaterThanOrEqual(totalPoolTokens.raw, userPoolBalance.raw)
      ? new Percent(userPoolBalance.raw, totalPoolTokens.raw)
      : undefined;

  const [token0Deposited, token1Deposited] =
    !!pair &&
    !!totalPoolTokens &&
    !!userPoolBalance &&
    // this condition is a short-circuit in the case where useTokenBalance updates sooner than useTotalSupply
    JSBI.greaterThanOrEqual(totalPoolTokens.raw, userPoolBalance.raw)
      ? [
          pair.getLiquidityValue(pair.token0, totalPoolTokens, userPoolBalance, false),
          pair.getLiquidityValue(pair.token1, totalPoolTokens, userPoolBalance, false),
        ]
      : [undefined, undefined];

  return (
    <LiquidityCard>
      <RowBetween justifyContent="center" padding="16px">
        <PairInfo>
          <InlineDiv>
            <CurrencyLogo currency={currency0} size={'20px'} />
            <InlineDiv style={{ marginLeft: '4px' }}>
              <CurrencyLogo currency={currency1} size={'20px'} />
            </InlineDiv>
            <TEXT.default fontWeight={600} fontSize={12} color="textPrimary" display="inline" marginLeft="8px">
              {currency0.symbol} - {currency1.symbol}
            </TEXT.default>
          </InlineDiv>

          <TEXT.default fontWeight={600} fontSize={12} color="textPrimary" marginTop="8px">
            {userPoolBalance?.toSignificant(6)}
          </TEXT.default>
        </PairInfo>
        <div style={{ display: 'flex' }}>
          {showMore && (
            <RemoveLiquidityButton as={Link} to={`/remove/${currencyId(currency0)}/${currencyId(currency1)}`}>
              Remove liquidity
            </RemoveLiquidityButton>
          )}
          <IconWrapper onClick={() => setShowMore(!showMore)}>
            <img src={showMore ? CloseIcon : OpenIcon} alt="icon" />
          </IconWrapper>
        </div>
      </RowBetween>

      {showMore && (
        <AutoColumn gap="md" style={{ padding: '16px' }}>
          <RowBetween>
            <Flex>
              <CurrencyLogo currency={currency0} size={'20px'} />
              <TEXT.default fontWeight={600} fontSize={12} color="textPrimary" marginLeft="8px">
                {currency0.symbol}
              </TEXT.default>
            </Flex>
            <TEXT.default fontWeight={600} fontSize={12} color="textPrimary">
              {token0Deposited?.toSignificant(6)}
            </TEXT.default>
          </RowBetween>
          <RowBetween>
            <Flex>
              <CurrencyLogo currency={currency1} size={'20px'} />
              <TEXT.default fontWeight={600} fontSize={12} color="textPrimary" marginLeft="8px">
                {currency1.symbol}
              </TEXT.default>
            </Flex>
            <TEXT.default fontWeight={600} fontSize={12} color="textPrimary">
              {token1Deposited?.toSignificant(6)}
            </TEXT.default>
          </RowBetween>
          <div />
          <RowBetween>
            <TEXT.default fontWeight={600} fontSize={12} color="textPrimary">
              Reward
            </TEXT.default>
            <TEXT.default fontWeight={600} fontSize={12} color="textPrimary">
              -
            </TEXT.default>
          </RowBetween>
          <RowBetween>
            <TEXT.default fontWeight={600} fontSize={12} color="textPrimary">
              Share of Pool
            </TEXT.default>
            <TEXT.default fontWeight={600} fontSize={12} color="textPrimary">
              {poolTokenPercentage
                ? (poolTokenPercentage.toFixed(2) === '0.00' ? '<0.01' : poolTokenPercentage.toFixed(2)) + '%'
                : '-'}
            </TEXT.default>
          </RowBetween>
          <AddLiquidityButton onClick={addToMetamask} style={{ padding: '8px 0', marginTop: '8px' }}>
            <TEXT.default fontWeight={600} fontSize={14}>
              Add {lpToken.symbol} token to Metamask
            </TEXT.default>
          </AddLiquidityButton>
        </AutoColumn>
      )}
    </LiquidityCard>
  );
}

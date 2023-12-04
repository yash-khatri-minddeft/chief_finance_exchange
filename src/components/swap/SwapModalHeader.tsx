import { Trade, TradeType } from '@bidelity/sdk';
import React, { useMemo } from 'react';
import { AlertTriangle } from 'react-feather';
import styled from 'styled-components';
import { Field } from '../../state/swap/actions';
import { TEXT, TYPE } from '../../theme';
import { ButtonPrimary } from '../Button';
import { isAddress, shortenAddress } from '../../utils';
import { computeSlippageAdjustedAmounts } from '../../utils/prices';
import { AutoColumn } from '../Column';
import CurrencyLogo from '../CurrencyLogo';
import { RowBetween, RowFixed } from '../Row';
import { SwapShowAcceptChanges } from './styleds';
import ArrowDownIcon from '../../assets/svg-bid/arrow-down-in-circle.svg';
import VectorDonIcon from '../../assets/svg-bid/vector-down.svg';

const InfoWrapper = styled.div`
  padding: 16px;
  margin-bottom: 6px;
`;

const FlexWithAlign = styled.div`
  display: flex;
  align-items: center;
`;

const InfoRow = styled(FlexWithAlign)`
  padding: 8px;
  border-radius: 14px;
  max-width: 313px;
  background-color: ${({ theme }) => theme.newTheme.bg2}};
`;

const AmountInfo = styled.div`
  padding: 18px 16px;
  margin-left: 10px;
  border-radius: 10px;
  background-color: ${({ theme }) => theme.newTheme.white};
  width: 100%;
  overflow: hidden;
`;

const ArrowWrapper = styled(FlexWithAlign)`
  justify-content: center;
  margin: 6px 0;
  img {
    width: 26px;
    height: 24px;
  }
`;

export default function SwapModalHeader({
  trade,
  allowedSlippage,
  recipient,
  showAcceptChanges,
  onAcceptChanges,
}: {
  trade: Trade;
  allowedSlippage: number;
  recipient: string | null;
  showAcceptChanges: boolean;
  onAcceptChanges: () => void;
}) {
  const slippageAdjustedAmounts = useMemo(
    () => computeSlippageAdjustedAmounts(trade, allowedSlippage),
    [trade, allowedSlippage]
  );

  return (
    <AutoColumn gap={'md'}>
      <InfoWrapper>
        <InfoRowItem trade={trade} field="inputAmount" />
        <ArrowWrapper>
          <img src={ArrowDownIcon} alt="arrow" />
        </ArrowWrapper>
        <InfoRowItem trade={trade} field="outputAmount" direction="To" />
      </InfoWrapper>
      {showAcceptChanges ? (
        <SwapShowAcceptChanges justify="flex-start" gap={'0px'}>
          <RowBetween>
            <RowFixed>
              <AlertTriangle size={20} style={{ marginRight: '9px', minWidth: 24, color: '#FFA51E' }} />
              <TEXT.default fontWeight={500} fontSize={14} color="textPrimary">
                {' '}
                Price Updated
              </TEXT.default>
            </RowFixed>
            <ButtonPrimary
              style={{
                padding: '6px 20px',
                width: 'fit-content',
                fontWeight: 600,
                fontSize: '12px',
                borderRadius: '8px',
              }}
              onClick={onAcceptChanges}
            >
              Accept
            </ButtonPrimary>
          </RowBetween>
        </SwapShowAcceptChanges>
      ) : null}
      <AutoColumn justify="flex-start" gap="sm">
        {trade.tradeType === TradeType.EXACT_INPUT ? (
          <TEXT.default fontSize={12} fontWeight={500} color="textSecondary" textAlign="left" style={{ width: '100%' }}>
            {`Output is estimated. You will receive at least `}
            <TEXT.default fontWeight={600} color="primary1" display="inline">
              {slippageAdjustedAmounts[Field.OUTPUT]?.toSignificant(6)} {trade.outputAmount.currency.symbol}
            </TEXT.default>
            {' or the transaction will revert.'}
          </TEXT.default>
        ) : (
          <TEXT.default fontSize={12} fontWeight={500} color="textSecondary" textAlign="left" style={{ width: '100%' }}>
            {`Input is estimated. You will sell at most `}
            <TEXT.default fontWeight={600} color="primary1" display="inline">
              {slippageAdjustedAmounts[Field.INPUT]?.toSignificant(6)} {trade.inputAmount.currency.symbol}
            </TEXT.default>
            {' or the transaction will revert.'}
          </TEXT.default>
        )}
      </AutoColumn>
      {recipient !== null ? (
        <AutoColumn justify="flex-start" gap="sm" style={{ padding: '12px 0 0 0px' }}>
          <TYPE.main>
            Output will be sent to{' '}
            <b title={recipient}>{isAddress(recipient) ? shortenAddress(recipient) : recipient}</b>
          </TYPE.main>
        </AutoColumn>
      ) : null}
    </AutoColumn>
  );
}

const InfoRowItem = ({
  trade,
  field,
  direction = 'From',
}: {
  trade: Trade;
  field: 'inputAmount' | 'outputAmount';
  direction?: 'From' | 'To';
}) => {
  return (
    <InfoRow>
      <FlexWithAlign>
        <FlexWithAlign>
          <CurrencyLogo currency={trade[field].currency} size={'26px'} style={{ marginRight: '8px' }} />
        </FlexWithAlign>
        <div>
          <TEXT.default fontWeight={600} fontSize={10} color="textSecondary">
            {direction}
          </TEXT.default>
          <TEXT.default fontWeight={600} fontSize={14} color="textPrimary" marginTop="4px">
            {trade[field].currency.symbol}
          </TEXT.default>
        </div>
        <div style={{ marginLeft: 20 }}>
          <img src={VectorDonIcon} alt="img" />
        </div>
      </FlexWithAlign>
      <AmountInfo>
        <TEXT.default fontWeight={600} fontSize={16} color="textPrimary">
          {trade[field].toSignificant(6)}
        </TEXT.default>
      </AmountInfo>
    </InfoRow>
  );
};

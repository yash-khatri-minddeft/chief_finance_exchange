import { Trade, TradeType } from '@bidelity/sdk';
import React, { useMemo, useState } from 'react';
import { Field } from '../../state/swap/actions';
import { TEXT } from '../../theme';
import {
  computeSlippageAdjustedAmounts,
  computeTradePriceBreakdown,
  formatExecutionPrice,
  warningSeverity,
} from '../../utils/prices';
import { ButtonError } from '../Button';
import { AutoColumn } from '../Column';
import QuestionHelper from '../QuestionHelper';
import { AutoRow, RowBetween, RowFixed } from '../Row';
import FormattedPriceImpact from './FormattedPriceImpact';
import { StyledBalanceMaxMini, SwapCallbackError } from './styleds';
import RefreshIcon from '../../assets/svg-bid/refresh.svg';

export default function SwapModalFooter({
  trade,
  onConfirm,
  allowedSlippage,
  swapErrorMessage,
  disabledConfirm,
}: {
  trade: Trade;
  allowedSlippage: number;
  onConfirm: () => void;
  swapErrorMessage: string | undefined;
  disabledConfirm: boolean;
}) {
  const [showInverted, setShowInverted] = useState<boolean>(false);
  const slippageAdjustedAmounts = useMemo(
    () => computeSlippageAdjustedAmounts(trade, allowedSlippage),
    [allowedSlippage, trade]
  );
  const { priceImpactWithoutFee, realizedLPFee } = useMemo(() => computeTradePriceBreakdown(trade), [trade]);
  const severity = warningSeverity(priceImpactWithoutFee);

  return (
    <>
      <AutoColumn gap="0px">
        <RowBetween align="center">
          <TEXT.default fontWeight={500} fontSize={12} color="textPrimary">
            Price
          </TEXT.default>
          <TEXT.default
            fontWeight={500}
            fontSize={12}
            color="textPrimary"
            style={{
              justifyContent: 'center',
              alignItems: 'center',
              display: 'flex',
              textAlign: 'right',
              paddingLeft: '10px',
            }}
          >
            {formatExecutionPrice(trade, showInverted)}
            <StyledBalanceMaxMini onClick={() => setShowInverted(!showInverted)}>
              <img src={RefreshIcon} width="14px" height="14px" alt="refresh" />
            </StyledBalanceMaxMini>
          </TEXT.default>
        </RowBetween>

        <RowBetween style={{ marginTop: 8 }}>
          <RowFixed>
            <TEXT.default fontWeight={500} fontSize={12} color="textPrimary">
              {trade.tradeType === TradeType.EXACT_INPUT ? 'Minimum received' : 'Maximum sold'}
            </TEXT.default>
            <QuestionHelper text="Your transaction will revert if there is a large, unfavorable price movement before it is confirmed." />
          </RowFixed>
          <RowFixed>
            <TEXT.default fontWeight={500} fontSize={12} color="textPrimary">
              {trade.tradeType === TradeType.EXACT_INPUT
                ? slippageAdjustedAmounts[Field.OUTPUT]?.toSignificant(4) ?? '-'
                : slippageAdjustedAmounts[Field.INPUT]?.toSignificant(4) ?? '-'}
            </TEXT.default>
            <TEXT.default fontWeight={500} fontSize={12} color="textPrimary" marginLeft="4px">
              {trade.tradeType === TradeType.EXACT_INPUT
                ? trade.outputAmount.currency.symbol
                : trade.inputAmount.currency.symbol}
            </TEXT.default>
          </RowFixed>
        </RowBetween>
        <RowBetween style={{ marginTop: 8 }}>
          <RowFixed>
            <TEXT.default fontWeight={500} fontSize={12} color="textPrimary">
              Price Impact
            </TEXT.default>
            <QuestionHelper text="The difference between the market price and your price due to trade size." />
          </RowFixed>
          <FormattedPriceImpact priceImpact={priceImpactWithoutFee} />
        </RowBetween>
        <RowBetween style={{ marginTop: 8 }}>
          <RowFixed>
            <TEXT.default fontWeight={500} fontSize={12} color="textPrimary">
              Liquidity Provider Fee
            </TEXT.default>
            <QuestionHelper text="A portion of each trade (0.30%) goes to liquidity providers as a protocol incentive." />
          </RowFixed>
          <TEXT.default fontWeight={500} fontSize={12} color="textPrimary">
            {realizedLPFee ? realizedLPFee?.toSignificant(6) + ' ' + trade.inputAmount.currency.symbol : '-'}
          </TEXT.default>
        </RowBetween>
      </AutoColumn>

      <AutoRow>
        <ButtonError
          onClick={onConfirm}
          disabled={disabledConfirm}
          error={severity > 2}
          style={{ marginTop: 10, paddingTop: 10, paddingBottom: 10, borderRadius: '8px' }}
          id="confirm-swap-or-send"
        >
          <TEXT.default fontSize={14} fontWeight={600} color="white">
            {severity > 2 ? 'Exchange Anyway' : 'Confirm Exchange'}
          </TEXT.default>
        </ButtonError>

        {swapErrorMessage ? <SwapCallbackError error={swapErrorMessage} /> : null}
      </AutoRow>
    </>
  );
}

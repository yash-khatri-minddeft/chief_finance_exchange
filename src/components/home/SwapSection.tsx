import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CurrencyAmount, Token, TokenAmount, JSBI } from '@bidelity/sdk';
import styled from 'styled-components';
import { TEXT } from '../../theme';
import {
  useDefaultHomePageState,
  useDerivedSwapInfo,
  useSwapActionHandlers,
  useSwapState,
} from '../../state/swap/hooks';
import { useUserSlippageTolerance } from '../../state/user/hooks';
import useWrapCallback, { WrapType } from '../../hooks/useWrapCallback';
import { Field } from '../../state/swap/actions';
import { ApprovalState, useApproveCallbackFromTrade } from '../../hooks/useApproveCallback';
import { maxAmountSpend } from '../../utils/maxAmountSpend';
import CurrencyInputPanel from '../CurrencyInputPanel';
import ArrowsCellIcon from '../../assets/svg-bid/button-cell.svg';
import ArrowWhite from '../../assets/svg-bid/vector-white.svg';
import { ButtonPrimary } from '../Button';
import { useTranslation } from 'react-i18next';
import { useWalletModalToggle } from '../../state/application/hooks';
import { useActiveWeb3React } from '../../hooks';
import { useHistory } from 'react-router';
import { useCurrency } from '../../hooks/Tokens';
import { usePair } from '../../data/Reserves';
import { FIVE_PERCENTS } from '../../constants';

const Wrapper = styled.div`
  width: 100%;
  margin-top: 132px;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const TextWrapper = styled.div`
  max-width: 840px;
`;

const ButtonWrapper = styled.div`
  margin-left: 15px;
`;

const Button = styled(ButtonPrimary)`
  border-radius: 7px;
  padding: 24px 50px;
  font-size: 14px;
  max-height: 66px;
`;

const RightSection = styled.div`
  margin-top: 80px;
  width: fit-content;
  max-width: 1000px;
  display: flex;
  align-items: center;
`;

const Spacing = styled.div<{ marginTop?: string; marginLeft?: string }>`
  margin-top: ${({ marginTop }) => !!marginTop && marginTop};
  margin-left: ${({ marginLeft }) => !!marginLeft && marginLeft};
`;

const ArrowWrapper = styled.div`
  position: absolute;
  top: -15px;
  left: -15px;
  width: 30px;
  height: 30px;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: ${({ theme }) => theme.newTheme.bg2};
  border: 1px solid ${({ theme }) => theme.newTheme.primary1};
  border-radius: 5px;
  transform: rotate(90deg);
  cursor: pointer;
`;

const Icon = styled.div`
  display: inline;
  margin-left: 11px;
`;

export default function SwapSection() {
  const { account } = useActiveWeb3React();

  useDefaultHomePageState();

  const history = useHistory();

  // get custom setting values for user
  const [allowedSlippage] = useUserSlippageTolerance();

  const [isFivePercent, setIsFivePercent] = useState(false);

  // swap state
  const { independentField, typedValue } = useSwapState();
  const { v2Trade, v2UniTrade, currencyBalances, parsedAmount, currencies } = useDerivedSwapInfo();
  const { wrapType } = useWrapCallback(currencies[Field.INPUT], currencies[Field.OUTPUT], typedValue);

  const inputCurrencyName = currencies[Field.INPUT] && currencies[Field.INPUT]?.symbol;
  const outputCurrencyName = currencies[Field.OUTPUT] && currencies[Field.OUTPUT]?.symbol;

  const inputValueA =
    inputCurrencyName === 'ETH' ? currencies[Field.INPUT]?.symbol : (currencies[Field.INPUT] as Token)?.address;

  const inputValueB =
    outputCurrencyName === 'ETH' ? currencies[Field.OUTPUT]?.symbol : (currencies[Field.OUTPUT] as Token)?.address;

  const currencyA = useCurrency(inputValueA);
  const currencyB = useCurrency(inputValueB);

  const showWrap: boolean = wrapType !== WrapType.NOT_APPLICABLE;

  const trade = v2Trade && !isFivePercent ? v2Trade : v2UniTrade;

  const parsedAmounts = useMemo(() => {
    return showWrap
      ? {
          [Field.INPUT]: parsedAmount,
          [Field.OUTPUT]: parsedAmount,
        }
      : {
          [Field.INPUT]: independentField === Field.INPUT ? parsedAmount : trade?.inputAmount,
          [Field.OUTPUT]: independentField === Field.OUTPUT ? parsedAmount : trade?.outputAmount,
        };
  }, [independentField, parsedAmount, showWrap, trade?.inputAmount, trade?.outputAmount]);

  const { onSwitchTokens, onCurrencySelection, onUserInput } = useSwapActionHandlers();
  const dependentField: Field = independentField === Field.INPUT ? Field.OUTPUT : Field.INPUT;

  const formattedAmounts = useMemo(() => {
    return {
      [independentField]: typedValue,
      [dependentField]: showWrap
        ? parsedAmounts[independentField]?.toExact() ?? ''
        : parsedAmounts[dependentField]?.toSignificant(6) ?? '',
    };
  }, [dependentField, independentField, parsedAmounts, showWrap, typedValue]);

  const v2Pair = usePair(currencyA ? currencyA : undefined, currencyB ? currencyB : undefined);

  const getCurrencyPoolAmount = useCallback(
    (currencySymbol: string | undefined) => {
      if (v2Pair && v2Pair[1] && v2Pair[1]?.token0 && v2Pair[1]?.token1) {
        const token0 = v2Pair[1]?.token0;
        const token1 = v2Pair[1]?.token1;
        let amount;
        if (currencySymbol === token0.symbol) {
          amount = new TokenAmount(v2Pair[1]?.token0, v2Pair[1]?.reserve0.raw);
        } else if (currencySymbol === token1.symbol) {
          amount = new TokenAmount(v2Pair[1]?.token1, v2Pair[1]?.reserve1.raw);
        } else if (currencySymbol === 'ETH' && token0.symbol === 'WETH') {
          amount = new TokenAmount(v2Pair[1]?.token0, v2Pair[1]?.reserve0.raw);
        } else if (currencySymbol === 'ETH' && token1.symbol === 'WETH') {
          amount = new TokenAmount(v2Pair[1]?.token1, v2Pair[1]?.reserve1.raw);
        }
        return amount?.toSignificant(6);
      } else {
        return undefined;
      }
    },
    [v2Pair]
  );

  const currencyAPoolAmount = useMemo(() => {
    return getCurrencyPoolAmount(currencyA?.symbol);
  }, [getCurrencyPoolAmount, currencyA?.symbol]);

  const percents = useMemo(() => {
    return formattedAmounts[Field.INPUT] && currencyAPoolAmount
      ? (+formattedAmounts[Field.INPUT] / +currencyAPoolAmount) * 100
      : undefined;
  }, [currencyAPoolAmount, formattedAmounts]);

  const handleTypeInput = useCallback(
    (value: string) => {
      onUserInput(Field.INPUT, value);
    },
    [onUserInput]
  );
  const handleTypeOutput = useCallback(
    (value: string) => {
      onUserInput(Field.OUTPUT, value);
    },
    [onUserInput]
  );

  const userHasSpecifiedInputOutput = Boolean(
    currencies[Field.INPUT] && currencies[Field.OUTPUT] && parsedAmounts[independentField]?.greaterThan(JSBI.BigInt(0))
  );

  useEffect(() => {
    if (percents === undefined && userHasSpecifiedInputOutput) {
      localStorage.setItem('isGreater', 'true');
      setIsFivePercent(true);
    } else if (percents && percents >= FIVE_PERCENTS) {
      localStorage.setItem('isGreater', 'true');
      setIsFivePercent(true);
    } else if (percents && percents < FIVE_PERCENTS) {
      localStorage.setItem('isGreater', 'false');
      setIsFivePercent(false);
    }

    return () => localStorage.removeItem('isGreater');
  }, [percents, userHasSpecifiedInputOutput]);

  const [approval] = useApproveCallbackFromTrade(trade, allowedSlippage);

  // check if user has gone through approval process, used to show two step buttons, reset on token change
  const [approvalSubmitted, setApprovalSubmitted] = useState<boolean>(false);

  // mark when a user has submitted an approval, reset onTokenSelection for input field
  useEffect(() => {
    if (approval === ApprovalState.PENDING) {
      setApprovalSubmitted(true);
    }
  }, [approval, approvalSubmitted]);

  const maxAmountInput: CurrencyAmount | undefined = maxAmountSpend(currencyBalances[Field.INPUT]);
  const maxAmountOutput: CurrencyAmount | undefined = maxAmountSpend(currencyBalances[Field.OUTPUT]);

  const handleInputSelect = useCallback(
    (inputCurrency) => {
      setApprovalSubmitted(false); // reset 2 step UI for approvals
      onCurrencySelection(Field.INPUT, inputCurrency);
    },
    [onCurrencySelection]
  );

  const handleMaxInput = useCallback(() => {
    maxAmountInput && onUserInput(Field.INPUT, maxAmountInput.toExact());
  }, [maxAmountInput, onUserInput]);

  const handleMaxOutput = useCallback(() => {
    maxAmountOutput && onUserInput(Field.OUTPUT, maxAmountOutput.toExact());
  }, [maxAmountOutput, onUserInput]);

  const handleOutputSelect = useCallback(
    (outputCurrency) => onCurrencySelection(Field.OUTPUT, outputCurrency),
    [onCurrencySelection]
  );

  const { t } = useTranslation();

  const toggleWalletModal = useWalletModalToggle();

  const navigateToSwap = () => {
    const address1 =
      currencies[Field.INPUT]?.symbol === 'ETH'
        ? currencies[Field.INPUT]?.symbol
        : (currencies[Field.INPUT] as Token)?.address;

    const address2 =
      currencies[Field.OUTPUT]?.symbol === 'ETH'
        ? currencies[Field.OUTPUT]?.symbol
        : (currencies[Field.OUTPUT] as Token)?.address;

    if (Boolean(formattedAmounts[Field.INPUT])) {
      localStorage.setItem('inputAmount', String(formattedAmounts[Field.INPUT]));
    }
    if (Boolean(formattedAmounts[Field.OUTPUT])) {
      localStorage.setItem('outputAmount', String(formattedAmounts[Field.OUTPUT]));
    }

    history.push(`/swap?inputCurrency=${address1}&outputCurrency=${address2}`);
  };

  return (
    <Wrapper>
      <TEXT.primary fontWeight={700} fontSize={65}>
        Token swap with efficiency
      </TEXT.primary>

      <Spacing marginTop="15px">
        <TextWrapper>
          <TEXT.primary fontWeight={500} fontSize={16} lineHeight="27.2px" textAlign="center">
            At our cryptocurrency token exchange platform, we offer an easy-to-use token swap service that allows you to
            seamlessly exchange one type of token for another with maximum efficiency.
          </TEXT.primary>
        </TextWrapper>
      </Spacing>
      <RightSection>
        <div style={{ width: '369px' }}>
          <CurrencyInputPanel
            label={'From'}
            value={formattedAmounts[Field.INPUT]}
            showMaxButton={false}
            currency={currencies[Field.INPUT]}
            onUserInput={handleTypeInput}
            onMax={handleMaxInput}
            onCurrencySelect={handleInputSelect}
            otherCurrency={currencies[Field.OUTPUT]}
            id="swap-currency-input"
            showAvailableInPool={false}
            isHomePage={true}
            label2="You send"
            isFirst={true}
          />
        </div>
        <div style={{ position: 'relative', zIndex: 100 }}>
          <ArrowWrapper
            onClick={() => {
              setApprovalSubmitted(false); // reset 2 step UI for approvals
              onSwitchTokens();
            }}
          >
            <img width="20px" height="20px" src={ArrowsCellIcon} alt="arrow" />
          </ArrowWrapper>
        </div>

        <div style={{ width: '369px' }}>
          <CurrencyInputPanel
            value={formattedAmounts[Field.OUTPUT]}
            onUserInput={handleTypeOutput}
            label={'To'}
            showMaxButton={false}
            onMax={handleMaxOutput}
            currency={currencies[Field.OUTPUT]}
            onCurrencySelect={handleOutputSelect}
            otherCurrency={currencies[Field.INPUT]}
            id="swap-currency-output"
            showAvailableInPool={false}
            isHomePage={true}
            isSecond={true}
            label2="You get"
          />
        </div>
        <ButtonWrapper>
          {account === null && <Button onClick={toggleWalletModal}>{t('connect wallet')}</Button>}
          {account !== null && (
            <Button onClick={navigateToSwap}>
              <TEXT.default>Exchange</TEXT.default>
              <Icon>
                <img src={ArrowWhite} alt="icon" />
              </Icon>
            </Button>
          )}
        </ButtonWrapper>
      </RightSection>
    </Wrapper>
  );
}

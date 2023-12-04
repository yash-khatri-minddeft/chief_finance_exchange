import { CurrencyAmount, JSBI, Token, TokenAmount, Trade } from '@bidelity/sdk';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { ArrowDown } from 'react-feather';
import { useTranslation } from 'react-i18next';
import { Text } from 'rebass';
import { ThemeContext } from 'styled-components';
import AddressInputPanel from '../../components/AddressInputPanel';
import { ButtonConfirmed, ButtonError, ButtonPrimary } from '../../components/Button';
import { GreyCard } from '../../components/Card';
import Column, { AutoColumn } from '../../components/Column';
import CurrencyInputPanel from '../../components/CurrencyInputPanel';
import Loader from '../../components/Loader';
import { SwapPoolTabs } from '../../components/NavigationTabs';
import PoolsLink from '../../components/Poolslink';
import ProgressSteps from '../../components/ProgressSteps';
import QuestionHelper from '../../components/QuestionHelper';
import { AutoRow, RowBetween } from '../../components/Row';
import SettingsTab from '../../components/Settings';
import TokenWarningModal from '../../components/TokenWarningModal';
import ConfirmSwapModal from '../../components/swap/ConfirmSwapModal';
import { SuccessTransactionModal } from '../../components/swap/SuccessTransactionModal';
import SwapHeader from '../../components/swap/SwapHeader';
import confirmPriceImpactWithoutFee from '../../components/swap/confirmPriceImpactWithoutFee';
import {
  AlignCenter,
  ArrowWrapper,
  ArrowWrapperSwap,
  BottomGrouping,
  RefreshWrapper,
  SwapCallbackError,
  Wrapper,
} from '../../components/swap/styleds';
import { usePair } from '../../data/Reserves';
import { useActiveWeb3React } from '../../hooks';
import { useAllTokens, useCurrency } from '../../hooks/Tokens';
import { ApprovalState, useApproveCallbackFromTrade } from '../../hooks/useApproveCallback';
import { useSwapCallback } from '../../hooks/useSwapCallback';
import useWrapCallback, { WrapType } from '../../hooks/useWrapCallback';
import { useSuccessModalOpen, useSuccessModalToggle, useWalletModalToggle } from '../../state/application/hooks';
import { Field } from '../../state/swap/actions';
import {
  useDefaultsFromURLSearch,
  useDerivedSwapInfo,
  useSwapActionHandlers,
  useSwapState,
} from '../../state/swap/hooks';
import { useExpertModeManager, useUserSingleHopOnly, useUserSlippageTolerance } from '../../state/user/hooks';
import { LinkStyledButton, TEXT, TYPE } from '../../theme';
import { maxAmountSpend } from '../../utils/maxAmountSpend';
import { computeTradePriceBreakdown, warningSeverity } from '../../utils/prices';
import AppBody, { PageWrap } from '../AppBody';
import ArrowsCellIcon from '../../assets/svg-bid/button-cell.svg';
import RefreshIcon from '../../assets/svg-bid/refresh.svg';
import AmountTabs from '../../components/AmountTabs';
import { useDerivedMintInfo } from '../../state/mint/hooks';
import { FIVE_PERCENTS, ONE_HUNDRED } from '../../constants';
import { useSwapPercents } from '../../hooks/useSwapPercents';
import { ethers } from 'ethers';
import { BigNumber } from '@ethersproject/bignumber';

export default function Swap() {
  const loadedUrlParams = useDefaultsFromURLSearch();

  // token warning stuff
  const [loadedInputCurrency, loadedOutputCurrency] = [
    useCurrency(loadedUrlParams?.inputCurrencyId),
    useCurrency(loadedUrlParams?.outputCurrencyId),
  ];
  const [dismissTokenWarning, setDismissTokenWarning] = useState<boolean>(false);
  const urlLoadedTokens: Token[] = useMemo(
    () => [loadedInputCurrency, loadedOutputCurrency]?.filter((c): c is Token => c instanceof Token) ?? [],
    [loadedInputCurrency, loadedOutputCurrency]
  );
  const handleConfirmTokenWarning = useCallback(() => {
    setDismissTokenWarning(true);
  }, []);

  // dismiss warning if all imported tokens are in active lists
  const defaultTokens = useAllTokens();

  const swapFee = useSwapPercents();

  const importTokensNotInDefault =
    urlLoadedTokens &&
    urlLoadedTokens.filter((token: Token) => {
      return !Boolean(token.address in defaultTokens);
    });

  const { account } = useActiveWeb3React();
  const theme = useContext(ThemeContext);

  // toggle wallet when disconnected
  const toggleWalletModal = useWalletModalToggle();

  // for expert mode
  const [isExpertMode] = useExpertModeManager();

  // get custom setting values for user
  const [allowedSlippage] = useUserSlippageTolerance();

  const [showInvertedPrice, setShowInvertedPrice] = useState<boolean>(false);

  const [isFivePercent, setIsFivePercent] = useState(false);

  const invertPrice = () => setShowInvertedPrice((prev) => !prev);

  // swap state
  const { independentField, typedValue, recipient } = useSwapState();
  const {
    v2Trade,
    v2UniTrade,
    currencyBalances,
    parsedAmount,
    currencies,
    inputError: swapInputError,
  } = useDerivedSwapInfo();

  const {
    wrapType,
    execute: onWrap,
    inputError: wrapInputError,
  } = useWrapCallback(currencies[Field.INPUT], currencies[Field.OUTPUT], typedValue);

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

  const { onSwitchTokens, onCurrencySelection, onUserInput, onChangeRecipient } = useSwapActionHandlers();
  const isValid = !swapInputError;
  const dependentField: Field = independentField === Field.INPUT ? Field.OUTPUT : Field.INPUT;

  // modal and loading
  const [{ showConfirm, tradeToConfirm, swapErrorMessage, attemptingTxn, txHash }, setSwapState] = useState<{
    showConfirm: boolean;
    tradeToConfirm: Trade | undefined;
    attemptingTxn: boolean;
    swapErrorMessage: string | undefined;
    txHash: string | undefined;
  }>({
    showConfirm: false,
    tradeToConfirm: undefined,
    attemptingTxn: false,
    swapErrorMessage: undefined,
    txHash: undefined,
  });

  const formattedAmounts = useMemo(() => {
    let dependentTokenAmount = showWrap
      ? parsedAmounts[independentField]?.toExact() ?? ''
      : parsedAmounts[dependentField]?.toSignificant(6) ?? '';

    if (
      independentField === Field.OUTPUT &&
      inputCurrencyName === 'ETH' &&
      !showWrap &&
      parsedAmounts[dependentField]?.toSignificant(6)
    ) {
      const formattedInputAmount = parsedAmounts[dependentField]?.toSignificant(6);

      // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
      // @ts-ignore
      const originalAmount = ethers.utils.parseEther(formattedInputAmount);
      const formattedSwapFee = BigNumber.from(Math.ceil(swapFee * ONE_HUNDRED));
      const oneHundred = BigNumber.from(ONE_HUNDRED);
      const extraPercentAmount = originalAmount.mul(formattedSwapFee).div(oneHundred).div(oneHundred);
      const sum = originalAmount.add(extraPercentAmount);
      const sumAmountToString = BigNumber.from(sum).toString();
      dependentTokenAmount = ethers.utils.formatEther(sumAmountToString);
    }

    return {
      [independentField]: typedValue,
      [dependentField]: dependentTokenAmount,
    };
  }, [dependentField, independentField, parsedAmounts, showWrap, typedValue, inputCurrencyName, swapFee]);

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

  const currencyBPoolAmount = useMemo(() => {
    return getCurrencyPoolAmount(currencyB?.symbol);
  }, [getCurrencyPoolAmount, currencyB?.symbol]);

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

  const route = trade?.route;

  const noRoute = !route;

  // check whether the user has approved the router on the input token
  const [approval, approveCallback] = useApproveCallbackFromTrade(trade, allowedSlippage);

  // check if user has gone through approval process, used to show two-step buttons, reset on token change
  const [approvalSubmitted, setApprovalSubmitted] = useState<boolean>(false);

  // mark when a user has submitted an approval, reset onTokenSelection for input field
  useEffect(() => {
    if (approval === ApprovalState.PENDING) {
      setApprovalSubmitted(true);
    }
  }, [approval, approvalSubmitted]);

  useEffect(() => {
    const inputAmount = localStorage.getItem('inputAmount');
    const outputAmount = localStorage.getItem('outputAmount');

    if (inputAmount) {
      onUserInput(Field.INPUT, inputAmount);
    } else if (outputAmount) {
      onUserInput(Field.OUTPUT, outputAmount);
    }

    localStorage.removeItem('inputAmount');
    localStorage.removeItem('outputAmount');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const maxAmountInput: CurrencyAmount | undefined = maxAmountSpend(currencyBalances[Field.INPUT]);
  const maxAmountOutput: CurrencyAmount | undefined = maxAmountSpend(currencyBalances[Field.OUTPUT]);
  // const atMaxAmountInput = Boolean(maxAmountInput && parsedAmounts[Field.INPUT]?.equalTo(maxAmountInput));
  // const atMaxAmountOutput = Boolean(maxAmountOutput && parsedAmounts[Field.OUTPUT]?.equalTo(maxAmountOutput));

  // the callback to execute the swap
  const { callback: swapCallback, error: swapCallbackError } = useSwapCallback(
    trade,
    allowedSlippage,
    recipient,
    swapFee
  );

  const { priceImpactWithoutFee } = computeTradePriceBreakdown(trade);

  const [singleHopOnly] = useUserSingleHopOnly();

  const handleSwap = useCallback(() => {
    if (priceImpactWithoutFee && !confirmPriceImpactWithoutFee(priceImpactWithoutFee)) {
      return;
    }
    if (!swapCallback) {
      return;
    }
    setSwapState({ attemptingTxn: true, tradeToConfirm, showConfirm, swapErrorMessage: undefined, txHash: undefined });
    swapCallback()
      .then((hash) => {
        setSwapState({ attemptingTxn: false, tradeToConfirm, showConfirm, swapErrorMessage: undefined, txHash: hash });
      })
      .catch((error) => {
        setSwapState({
          attemptingTxn: false,
          tradeToConfirm,
          showConfirm,
          swapErrorMessage: error.message,
          txHash: undefined,
        });
      });
  }, [priceImpactWithoutFee, swapCallback, tradeToConfirm, showConfirm]);

  // warnings on slippage
  const priceImpactSeverity = warningSeverity(priceImpactWithoutFee);

  // show approve flow when: no error on inputs, not approved or pending, or approved in current session
  // never show if price impact is above threshold in non-expert mode
  const showApproveFlow =
    !swapInputError &&
    (approval === ApprovalState.NOT_APPROVED ||
      approval === ApprovalState.PENDING ||
      (approvalSubmitted && approval === ApprovalState.APPROVED)) &&
    !(priceImpactSeverity > 3 && !isExpertMode);

  const handleConfirmDismiss = useCallback(() => {
    setSwapState({ showConfirm: false, tradeToConfirm, attemptingTxn, swapErrorMessage, txHash });
    // if there was a tx hash, we want to clear the input
    if (txHash) {
      onUserInput(Field.INPUT, '');
    }
  }, [attemptingTxn, onUserInput, swapErrorMessage, tradeToConfirm, txHash]);

  const handleAcceptChanges = useCallback(() => {
    setSwapState({ tradeToConfirm: trade, swapErrorMessage, txHash, attemptingTxn, showConfirm });
  }, [attemptingTxn, showConfirm, swapErrorMessage, trade, txHash]);

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

  const handleInputAmount = useCallback(
    (percents: number) => {
      maxAmountInput && onUserInput(Field.INPUT, ((+maxAmountInput.toExact() * percents) / 100).toString());
    },
    [maxAmountInput, onUserInput]
  );
  const handleOutputAmount = useCallback(
    (percents: number) => {
      maxAmountOutput && onUserInput(Field.OUTPUT, ((+maxAmountOutput.toExact() * percents) / 100).toString());
    },
    [maxAmountOutput, onUserInput]
  );

  const { price } = useDerivedMintInfo(currencyA ?? undefined, currencyB ?? undefined);

  const priceValue = price && showInvertedPrice ? price?.invert()?.toSignificant(6) : price?.toSignificant(6);

  const toggleSuccessModal = useSuccessModalToggle();
  const isOpenSuccessModal = useSuccessModalOpen();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const getDisabledButton = () => {
    let bigInput;

    if (!maxAmountInput || !maxAmountOutput) {
      bigInput = true;
      return { bigInput };
    }

    bigInput = parseFloat(formattedAmounts[Field.INPUT]) > parseFloat(maxAmountInput?.toExact());

    return { bigInput };
  };

  const { bigInput } = getDisabledButton();

  return (
    <PageWrap>
      <TokenWarningModal
        isOpen={importTokensNotInDefault.length > 0 && !dismissTokenWarning}
        tokens={importTokensNotInDefault}
        onConfirm={handleConfirmTokenWarning}
        onDismiss={handleConfirmTokenWarning}
      />
      <SwapPoolTabs active={'swap'} />
      <AppBody>
        <SwapHeader />
        <Wrapper id="swap-page">
          <ConfirmSwapModal
            isOpen={showConfirm}
            trade={trade}
            originalTrade={tradeToConfirm}
            onAcceptChanges={handleAcceptChanges}
            attemptingTxn={attemptingTxn}
            txHash={txHash}
            recipient={recipient}
            allowedSlippage={allowedSlippage}
            onConfirm={handleSwap}
            swapErrorMessage={swapErrorMessage}
            onDismiss={handleConfirmDismiss}
            v2pair={v2Pair}
          />

          <SuccessTransactionModal hash={txHash} isOpen={isOpenSuccessModal} onDismiss={toggleSuccessModal} />

          <AutoColumn gap={'sm'}>
            <CurrencyInputPanel
              label={'From'}
              value={formattedAmounts[Field.INPUT]}
              showMaxButton={true}
              currency={currencies[Field.INPUT]}
              onUserInput={handleTypeInput}
              onMax={handleMaxInput}
              onCurrencySelect={handleInputSelect}
              availabilityInPool={currencyAPoolAmount}
              otherCurrency={currencies[Field.OUTPUT]}
              id="swap-currency-input"
            />
            <AmountTabs onChange={handleInputAmount} />
            <div>
              {!!maxAmountInput && !!inputCurrencyName && (
                <TEXT.default fontSize={12} fontWeight={500} color="text1">
                  Availability: {maxAmountInput.toExact()} {!!inputCurrencyName && inputCurrencyName}
                </TEXT.default>
              )}
            </div>
            <AutoColumn justify="space-between">
              <AutoRow justify={isExpertMode ? 'space-between' : 'center'} style={{ padding: '0 1rem' }}>
                <ArrowWrapperSwap
                  onClick={() => {
                    setApprovalSubmitted(false); // reset 2 step UI for approvals
                    onSwitchTokens();
                  }}
                >
                  <img width="20px" height="20px" src={ArrowsCellIcon} alt="arrow" />
                </ArrowWrapperSwap>
                {recipient === null && !showWrap && isExpertMode ? (
                  <LinkStyledButton id="add-recipient-button" onClick={() => onChangeRecipient('')}>
                    + Add a send (optional)
                  </LinkStyledButton>
                ) : null}
              </AutoRow>
            </AutoColumn>
            <CurrencyInputPanel
              value={formattedAmounts[Field.OUTPUT]}
              onUserInput={handleTypeOutput}
              label={'To'}
              showMaxButton={true}
              onMax={handleMaxOutput}
              currency={currencies[Field.OUTPUT]}
              onCurrencySelect={handleOutputSelect}
              availabilityInPool={currencyBPoolAmount}
              otherCurrency={currencies[Field.INPUT]}
              id="swap-currency-output"
            />
            <AmountTabs onChange={handleOutputAmount} />
            <div>
              {!!maxAmountOutput && !!outputCurrencyName && (
                <TEXT.default fontSize={12} fontWeight={500} color="text1">
                  Availability: {maxAmountOutput.toExact()} {!!outputCurrencyName && outputCurrencyName}
                </TEXT.default>
              )}
            </div>
            {recipient !== null && !showWrap ? (
              <>
                <AutoRow justify="space-between" style={{ padding: '0 1rem' }}>
                  <ArrowWrapper clickable={false}>
                    <ArrowDown size="16" color={theme.text2} />
                  </ArrowWrapper>
                  <LinkStyledButton id="remove-recipient-button" onClick={() => onChangeRecipient(null)}>
                    - Remove send
                  </LinkStyledButton>
                </AutoRow>
                <AddressInputPanel id="recipient" value={recipient} onChange={onChangeRecipient} />
              </>
            ) : null}
            {showWrap ? null : (
              <div>
                <AutoColumn gap="8px">
                  <RowBetween align="center">
                    <Text fontWeight={500} fontSize={14} color={theme.newTheme.primary2}>
                      Price
                    </Text>
                    <>
                      {price !== undefined ? (
                        <AlignCenter>
                          <TEXT.default fontWeight={600} fontSize={14}>
                            {priceValue}
                          </TEXT.default>
                          <div style={{ marginLeft: 4 }}>
                            {showInvertedPrice ? (
                              <TEXT.default fontWeight={500} fontSize={14}>
                                {inputCurrencyName} per {outputCurrencyName}
                              </TEXT.default>
                            ) : (
                              <TEXT.default fontWeight={500} fontSize={14}>
                                {outputCurrencyName} per {inputCurrencyName}
                              </TEXT.default>
                            )}
                          </div>
                          <RefreshWrapper onClick={invertPrice}>
                            <img src={RefreshIcon} width="18px" height="18px" alt="refresh" />
                          </RefreshWrapper>
                        </AlignCenter>
                      ) : (
                        '-'
                      )}
                    </>
                  </RowBetween>

                  <RowBetween align="center">
                    <AlignCenter>
                      <TEXT.default fontWeight={500} fontSize={14} color={theme.newTheme.primary2}>
                        Slippage Tolerance
                      </TEXT.default>
                      <div style={{ marginTop: 5 }}>
                        <QuestionHelper
                          iconSize={16}
                          text="Amet minim mollit non deserunt ullamco est sit aliqua dolor do amet sint. Velit officia consequat duis enim velit mollit. Exercitation veniam consequat sunt nostrud amet."
                        />
                      </div>

                      <div style={{ marginLeft: 0 }}>
                        <SettingsTab />
                      </div>
                    </AlignCenter>

                    <TEXT.default fontWeight={500} fontSize={14} color={theme.newTheme.primary1}>
                      {allowedSlippage / 100}%
                    </TEXT.default>
                  </RowBetween>
                </AutoColumn>
              </div>
            )}
          </AutoColumn>

          <BottomGrouping>
            {!account ? (
              <ButtonPrimary onClick={toggleWalletModal}>{t('connect wallet')}</ButtonPrimary>
            ) : showWrap ? (
              <ButtonPrimary disabled={Boolean(wrapInputError)} onClick={onWrap}>
                {wrapInputError ??
                  (wrapType === WrapType.WRAP ? 'Wrap' : wrapType === WrapType.UNWRAP ? 'Unwrap' : null)}
              </ButtonPrimary>
            ) : noRoute && userHasSpecifiedInputOutput ? (
              <GreyCard style={{ textAlign: 'center' }}>
                <TYPE.main mb="4px">Insufficient liquidity for this trade.</TYPE.main>
                {singleHopOnly && <TYPE.main mb="4px">Try enabling multi-hop trades.</TYPE.main>}
              </GreyCard>
            ) : showApproveFlow && !bigInput ? (
              <RowBetween>
                <ButtonConfirmed
                  onClick={approveCallback}
                  disabled={
                    approval !== ApprovalState.NOT_APPROVED ||
                    (approvalSubmitted && approval !== ApprovalState.NOT_APPROVED)
                  }
                  width="48%"
                  altDisabledStyle={approval === ApprovalState.PENDING} // show solid button while waiting
                  confirmed={approval === ApprovalState.APPROVED}
                >
                  {approval === ApprovalState.PENDING ? (
                    <AutoRow gap="6px" justify="center">
                      Approving <Loader stroke="white" />
                    </AutoRow>
                  ) : approvalSubmitted && approval === ApprovalState.APPROVED ? (
                    'Approved'
                  ) : (
                    'Approve ' + currencies[Field.INPUT]?.symbol
                  )}
                </ButtonConfirmed>
                <ButtonError
                  onClick={() => {
                    if (isExpertMode) {
                      handleSwap();
                    } else {
                      setSwapState({
                        tradeToConfirm: trade,
                        attemptingTxn: false,
                        swapErrorMessage: undefined,
                        showConfirm: true,
                        txHash: undefined,
                      });
                    }
                  }}
                  width="48%"
                  id="swap-button"
                  disabled={
                    !isValid || approval !== ApprovalState.APPROVED || (priceImpactSeverity > 3 && !isExpertMode)
                  }
                  error={isValid && priceImpactSeverity > 2}
                >
                  <Text fontSize={16} fontWeight={500}>
                    {priceImpactSeverity > 3 && !isExpertMode
                      ? `Price Impact High`
                      : `Swap${priceImpactSeverity > 2 ? ' Anyway' : ''}`}
                  </Text>
                </ButtonError>
              </RowBetween>
            ) : (
              <ButtonError
                onClick={() => {
                  if (isExpertMode) {
                    handleSwap();
                  } else {
                    setSwapState({
                      tradeToConfirm: trade,
                      attemptingTxn: false,
                      swapErrorMessage: undefined,
                      showConfirm: true,
                      txHash: undefined,
                    });
                  }
                }}
                id="swap-button"
                disabled={!isValid || (priceImpactSeverity > 3 && !isExpertMode) || !!swapCallbackError || bigInput}
                error={isValid && priceImpactSeverity > 2 && !swapCallbackError}
              >
                <Text fontSize={20} fontWeight={500}>
                  {bigInput
                    ? `Insufficient ${!!inputCurrencyName ? inputCurrencyName : 'input'} balance`
                    : swapInputError
                    ? swapInputError
                    : priceImpactSeverity > 3 && !isExpertMode
                    ? `Price Impact Too High`
                    : `Exchange`}
                </Text>
              </ButtonError>
            )}
            {showApproveFlow && !bigInput && (
              <Column style={{ marginTop: '1rem' }}>
                <ProgressSteps steps={[approval === ApprovalState.APPROVED]} />
              </Column>
            )}
            {isExpertMode && swapErrorMessage ? <SwapCallbackError error={swapErrorMessage} /> : null}
          </BottomGrouping>
        </Wrapper>
      </AppBody>
      <PoolsLink to="/pools" />
    </PageWrap>
  );
}

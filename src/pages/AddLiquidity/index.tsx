import { BigNumber } from '@ethersproject/bignumber';
import { TransactionResponse } from '@ethersproject/providers';
import { Currency, currencyEquals, ETHER, TokenAmount, WETH } from '@bidelity/sdk';
import React, { useCallback, useEffect, useState } from 'react';
import { RouteComponentProps } from 'react-router-dom';
import { Text } from 'rebass';
import { ButtonError, ButtonPrimary, ButtonPrimarySmallerText } from '../../components/Button';
import { AutoColumn, ColumnCenter } from '../../components/Column';
import TransactionConfirmationModal, { ConfirmationModalContent } from '../../components/TransactionConfirmationModal';
import CurrencyInputPanel from '../../components/CurrencyInputPanel';
import { RowBetween } from '../../components/Row';
import { ROUTER_ADDRESS } from '../../constants';
import { PairState, usePair } from '../../data/Reserves';
import { useActiveWeb3React } from '../../hooks';
import { useCurrency } from '../../hooks/Tokens';
import { ApprovalState, useApproveCallback } from '../../hooks/useApproveCallback';
import useTransactionDeadline from '../../hooks/useTransactionDeadline';
import {
  useApproveTokensModalOpen,
  useApproveTokensModalToggle,
  useErrorModalOpen,
  useErrorModalToggle,
  useSuccessModalOpen,
  useSuccessModalToggle,
  useWalletModalToggle,
} from '../../state/application/hooks';
import { Field } from '../../state/mint/actions';
import { useDerivedMintInfo, useMintActionHandlers, useMintState } from '../../state/mint/hooks';

import { useTransactionAdder } from '../../state/transactions/hooks';
import { useIsExpertMode, useUserSlippageTolerance } from '../../state/user/hooks';
import { TEXT, TYPE } from '../../theme';
import { calculateGasMargin, calculateSlippageAmount, getRouterContract } from '../../utils';
import { maxAmountSpend } from '../../utils/maxAmountSpend';
import { wrappedCurrency } from '../../utils/wrappedCurrency';
import AppBody, { PageWrap } from '../AppBody';
import { Dots, FlexAlign, LiquidityIconWrapper, LiquidityInfoCard, Wrapper } from '../Pool/styleds';
import { ConfirmAddModalBottom } from './ConfirmAddModalBottom';
import { currencyId } from '../../utils/currencyId';
import { PoolPriceBar } from './PoolPriceBar';
import CircleArrowIcon from '../../assets/svg-bid/circle-arrrow.svg';
import ArrowsCellIcon from '../../assets/svg-bid/button-cell.svg';
import AmountTabs from '../../components/AmountTabs';
import CurrencyLogo from '../../components/CurrencyLogo';
import { truncateString } from '../../utils/truncateString';
import { ApproveTokensModal, TransactionErrorModal } from './modals';
import { MinimalPositionCard } from '../../components/PositionCard';
import { useDerivedBurnInfo } from '../../state/burn/hooks';
import { SuccessTransactionModal } from '../../components/swap/SuccessTransactionModal';
import { useFindTokenAddress } from '../../state/swap/hooks';
import { PAIRS_LOCK_QUERY } from './query';
import { useQuery } from '@apollo/client';
import { GreyCardSecondaryLight } from '../../components/Card';
import { isPairLocked } from '../../utils/isPairLocked';
import useSetLiquidityTokensInUrl from '../../hooks/useSetLiquidityTokensInUrl';

export default function AddLiquidity({
  match: {
    params: { currencyIdA, currencyIdB },
  },
  history,
}: RouteComponentProps<{ currencyIdA?: string; currencyIdB?: string }>) {
  const { account, chainId, library } = useActiveWeb3React();

  const { data: pairsList } = useQuery(PAIRS_LOCK_QUERY, { context: { clientName: 'endpoint2' } });

  const usdtAddress = useFindTokenAddress('USDT');

  let currencyA = useCurrency(currencyIdA);
  let currencyB = useCurrency(currencyIdB);

  useSetLiquidityTokensInUrl(currencyIdA, currencyIdB, usdtAddress, history);

  const USDT = useCurrency(usdtAddress);
  const ETH = useCurrency('ETH');

  currencyA = currencyA ?? USDT;
  currencyB = currencyB ?? ETH;

  const toggleWalletModal = useWalletModalToggle(); // toggle wallet when disconnected

  const expertMode = useIsExpertMode();

  const { pair } = useDerivedBurnInfo(currencyA ?? undefined, currencyB ?? undefined);

  const oneCurrencyIsWETH = Boolean(
    chainId &&
      ((currencyA && currencyEquals(WETH[chainId], currencyA)) ||
        (currencyB && currencyEquals(WETH[chainId], currencyB)))
  );

  const isErrorModalOpen = useErrorModalOpen();
  const toggleErrorModal = useErrorModalToggle();

  const toggleSuccessModal = useSuccessModalToggle();
  const isOpenSuccessModal = useSuccessModalOpen();

  const isApproveTokensModalOpen = useApproveTokensModalOpen();
  const toggleApproveTokensModal = useApproveTokensModalToggle();

  // mint state
  const { independentField, typedValue, otherTypedValue } = useMintState();
  const {
    dependentField,
    currencies,
    pairState,
    currencyBalances,
    parsedAmounts,
    price,
    noLiquidity,
    liquidityMinted,
    poolTokenPercentage,
    error,
  } = useDerivedMintInfo(currencyA ?? undefined, currencyB ?? undefined);

  const { onFieldAInput, onFieldBInput, onSwitchMintCurrencies } = useMintActionHandlers(noLiquidity);

  useEffect(() => {
    return () => {
      onFieldAInput('');
      onFieldBInput('');
    };
  }, [onFieldBInput, onFieldAInput]);

  const isValid = !error;

  // modal and loading
  const [showConfirm, setShowConfirm] = useState<boolean>(false);
  const [attemptingTxn, setAttemptingTxn] = useState<boolean>(false); // clicked confirm

  // txn values
  const deadline = useTransactionDeadline(); // custom from users settings
  const [allowedSlippage] = useUserSlippageTolerance(); // custom from users
  const [txHash, setTxHash] = useState<string>('');

  // get formatted amounts
  const formattedAmounts = {
    [independentField]: typedValue,
    [dependentField]: noLiquidity ? otherTypedValue : parsedAmounts[dependentField]?.toSignificant(6) ?? '',
  };

  // get the max amounts user can add
  const maxAmounts: { [field in Field]?: TokenAmount } = [Field.CURRENCY_A, Field.CURRENCY_B].reduce(
    (accumulator, field) => {
      return {
        ...accumulator,
        [field]: maxAmountSpend(currencyBalances[field]),
      };
    },
    {}
  );

  const atMaxAmounts: { [field in Field]?: TokenAmount } = [Field.CURRENCY_A, Field.CURRENCY_B].reduce(
    (accumulator, field) => {
      return {
        ...accumulator,
        [field]: maxAmounts[field]?.equalTo(parsedAmounts[field] ?? '0'),
      };
    },
    {}
  );

  // check whether the user has approved the router on the tokens
  const [approvalA, approveACallback] = useApproveCallback(parsedAmounts[Field.CURRENCY_A], ROUTER_ADDRESS);
  const [approvalB, approveBCallback] = useApproveCallback(parsedAmounts[Field.CURRENCY_B], ROUTER_ADDRESS);

  const addTransaction = useTransactionAdder();

  const handleDismissConfirmation = useCallback(() => {
    setShowConfirm(false);
    // if there was a tx hash, we want to clear the input
    if (txHash) {
      onFieldAInput('');
    }
    // setTxHash('');
  }, [onFieldAInput, txHash]);

  async function onAdd() {
    if (!chainId || !library || !account) return;
    const router = getRouterContract(chainId, library, account);

    const { [Field.CURRENCY_A]: parsedAmountA, [Field.CURRENCY_B]: parsedAmountB } = parsedAmounts;
    if (!parsedAmountA || !parsedAmountB || !currencyA || !currencyB || !deadline) {
      return;
    }

    const amountsMin = {
      [Field.CURRENCY_A]: calculateSlippageAmount(parsedAmountA, noLiquidity ? 0 : allowedSlippage)[0],
      [Field.CURRENCY_B]: calculateSlippageAmount(parsedAmountB, noLiquidity ? 0 : allowedSlippage)[0],
    };

    let estimate,
      method: (...args: any) => Promise<TransactionResponse>,
      args: Array<string | string[] | number>,
      value: BigNumber | null;
    if (currencyA === ETHER || currencyB === ETHER) {
      const tokenBIsETH = currencyB === ETHER;
      estimate = router.estimateGas.addLiquidityETH;
      method = router.addLiquidityETH;
      args = [
        wrappedCurrency(tokenBIsETH ? currencyA : currencyB, chainId)?.address ?? '', // token
        (tokenBIsETH ? parsedAmountA : parsedAmountB).raw.toString(), // token desired
        amountsMin[tokenBIsETH ? Field.CURRENCY_A : Field.CURRENCY_B].toString(), // token min
        amountsMin[tokenBIsETH ? Field.CURRENCY_B : Field.CURRENCY_A].toString(), // eth min
        account,
        deadline.toHexString(),
      ];
      value = BigNumber.from((tokenBIsETH ? parsedAmountB : parsedAmountA).raw.toString());
    } else {
      estimate = router.estimateGas.addLiquidity;
      method = router.addLiquidity;
      args = [
        wrappedCurrency(currencyA, chainId)?.address ?? '',
        wrappedCurrency(currencyB, chainId)?.address ?? '',
        parsedAmountA.raw.toString(),
        parsedAmountB.raw.toString(),
        amountsMin[Field.CURRENCY_A].toString(),
        amountsMin[Field.CURRENCY_B].toString(),
        account,
        deadline.toHexString(),
      ];
      value = null;
    }

    setAttemptingTxn(true);
    await estimate(...args, value ? { value } : {})
      .then((estimatedGasLimit) =>
        method(...args, {
          ...(value ? { value } : {}),
          gasLimit: calculateGasMargin(estimatedGasLimit),
        }).then((response) => {
          setAttemptingTxn(false);

          addTransaction(response, {
            summary:
              'Add ' +
              parsedAmounts[Field.CURRENCY_A]?.toSignificant(3) +
              ' ' +
              currencies[Field.CURRENCY_A]?.symbol +
              ' and ' +
              parsedAmounts[Field.CURRENCY_B]?.toSignificant(3) +
              ' ' +
              currencies[Field.CURRENCY_B]?.symbol,
          });
          setTxHash(response.hash);
        })
      )
      .catch((error) => {
        setAttemptingTxn(false);
        handleDismissConfirmation();
        toggleErrorModal();
      });
  }

  const modalHeader = () => {
    return noLiquidity ? (
      <AutoColumn gap="6px">
        <FlexAlign>
          <TEXT.primary fontSize={12} fontWeight={500}>
            {currencies[Field.CURRENCY_A]?.symbol + ' / ' + currencies[Field.CURRENCY_B]?.symbol}
          </TEXT.primary>
          <FlexAlign style={{ marginLeft: '8px' }}>
            <CurrencyLogo currency={currencies[Field.CURRENCY_A]} />
          </FlexAlign>
          <FlexAlign style={{ marginLeft: '8px' }}>
            <CurrencyLogo currency={currencies[Field.CURRENCY_B]} />
          </FlexAlign>
        </FlexAlign>
      </AutoColumn>
    ) : (
      <AutoColumn gap="6px">
        <FlexAlign>
          <TEXT.primary fontWeight={700} fontSize={22}>
            {truncateString(liquidityMinted?.toSignificant(6), 16)}
          </TEXT.primary>
          <FlexAlign style={{ marginLeft: '8px' }}>
            <CurrencyLogo currency={currencies[Field.CURRENCY_A]} />
          </FlexAlign>
          <FlexAlign style={{ marginLeft: '8px' }}>
            <CurrencyLogo currency={currencies[Field.CURRENCY_B]} />
          </FlexAlign>
        </FlexAlign>
        <TEXT.primary fontSize={12} fontWeight={500}>
          {currencies[Field.CURRENCY_A]?.symbol + ' / ' + currencies[Field.CURRENCY_B]?.symbol + ' Pool Tokens'}
        </TEXT.primary>
      </AutoColumn>
    );
  };

  const modalBottom = () => {
    return (
      <ConfirmAddModalBottom
        price={price}
        currencies={currencies}
        parsedAmounts={parsedAmounts}
        noLiquidity={noLiquidity}
        onAdd={onAdd}
        poolTokenPercentage={poolTokenPercentage}
      />
    );
  };

  const pendingText = `Supplying ${parsedAmounts[Field.CURRENCY_A]?.toSignificant(6)} ${
    currencies[Field.CURRENCY_A]?.symbol
  } and ${parsedAmounts[Field.CURRENCY_B]?.toSignificant(6)} ${currencies[Field.CURRENCY_B]?.symbol}`;

  const pendingContent = () => {
    return (
      <TEXT.default fontWeight={600} fontSize={14} color="textPrimary" textAlign="center">
        Supplying{' '}
        <TEXT.default color="primary1" display="inline">
          {parsedAmounts[Field.CURRENCY_A]?.toSignificant(6)} {currencies[Field.CURRENCY_A]?.symbol}
        </TEXT.default>{' '}
        and{' '}
        <TEXT.default color="primary1" display="inline">
          {parsedAmounts[Field.CURRENCY_B]?.toSignificant(6)} {currencies[Field.CURRENCY_B]?.symbol}
        </TEXT.default>
      </TEXT.default>
    );
  };

  const handleCurrencyASelect = useCallback(
    (currencyA: Currency) => {
      const newCurrencyIdA = currencyId(currencyA);
      if (newCurrencyIdA === currencyIdB) {
        history.push(`/add/${currencyIdB}/${currencyIdA}`);
      } else {
        history.push(`/add/${newCurrencyIdA}/${currencyIdB}`);
      }
    },
    [currencyIdB, history, currencyIdA]
  );
  const handleCurrencyBSelect = useCallback(
    (currencyB: Currency) => {
      const newCurrencyIdB = currencyId(currencyB);
      if (currencyIdA === newCurrencyIdB) {
        if (currencyIdB) {
          history.push(`/add/${currencyIdB}/${newCurrencyIdB}`);
        } else {
          history.push(`/add/${newCurrencyIdB}`);
        }
      } else {
        history.push(`/add/${currencyIdA ? currencyIdA : 'ETH'}/${newCurrencyIdB}`);
      }
    },
    [currencyIdA, history, currencyIdB]
  );

  const handleASwitchCurrencies = () => {
    if (!currencyIdA && !currencyIdB) {
      return;
    }
    history.push(`/add/${currencyIdB}/${currencyIdA}`);
    onSwitchMintCurrencies();
  };

  const handleMaxFieldAAmount = useCallback(
    (percents: number) => {
      maxAmounts[Field.CURRENCY_A] &&
        onFieldAInput(((+maxAmounts[Field.CURRENCY_A]?.toExact()! * percents) / 100).toString());
    },
    [maxAmounts[Field.CURRENCY_A], onFieldAInput]
  );

  const handleMaxFieldBAmount = useCallback(
    (percents: number) => {
      maxAmounts[Field.CURRENCY_B] &&
        onFieldBInput(((+maxAmounts[Field.CURRENCY_B]?.toExact()! * percents) / 100).toString());
    },
    [maxAmounts[Field.CURRENCY_B], onFieldBInput]
  );

  const v2Pair = usePair(currencyA ? currencyA : undefined, currencyB ? currencyB : undefined);

  const toggleSuccess = () => {
    setTxHash('');
    setShowConfirm(false);
    toggleSuccessModal();
  };

  const isLocked = pairsList && pairsList?.pairs && pair ? isPairLocked(pairsList.pairs, pair) : false;

  return (
    <PageWrap>
      <AppBody maxHeight={714}>
        <Wrapper>
          <RowBetween>
            <TEXT.default fontWeight={600} fontSize={20} color="textPrimary" lineHeight="30px">
              Add Liquidity
            </TEXT.default>
            <LiquidityIconWrapper>
              <img src={CircleArrowIcon} alt="refresh" />
            </LiquidityIconWrapper>
          </RowBetween>
          <TEXT.default fontWeight={500} fontSize={12} color="textSecondary" marginTop="4px">
            Add liquidity to receive LP tokens
          </TEXT.default>
          <SuccessTransactionModal
            hash={txHash !== '' ? txHash : undefined}
            isOpen={isOpenSuccessModal}
            onDismiss={toggleSuccess}
          />
          <TransactionConfirmationModal
            isOpen={showConfirm}
            onDismiss={handleDismissConfirmation}
            attemptingTxn={attemptingTxn}
            hash={txHash}
            isAddLiquidityPage={true}
            pair={pair}
            v2pair={v2Pair}
            content={() => (
              <ConfirmationModalContent
                title={noLiquidity ? 'You are creating a pool' : 'You will receive'}
                onDismiss={handleDismissConfirmation}
                topContent={modalHeader}
                bottomContent={modalBottom}
              />
            )}
            pendingText={pendingText}
            pendingContent={pendingContent}
          />
          <TransactionErrorModal isOpen={isErrorModalOpen} onDismiss={toggleErrorModal} />
          <ApproveTokensModal
            isOpen={isApproveTokensModalOpen}
            onDismiss={toggleApproveTokensModal}
            pendingText={pendingText}
          />
          <AutoColumn gap="8px" style={{ marginTop: '16px' }}>
            <CurrencyInputPanel
              label={'From'}
              value={formattedAmounts[Field.CURRENCY_A]}
              onUserInput={onFieldAInput}
              onMax={() => {
                onFieldAInput(maxAmounts[Field.CURRENCY_A]?.toExact() ?? '');
              }}
              onCurrencySelect={handleCurrencyASelect}
              showMaxButton={!atMaxAmounts[Field.CURRENCY_A]}
              currency={currencies[Field.CURRENCY_A]}
              showAvailableInPool={false}
              id="add-liquidity-input-tokena"
              showCommonBases
            />
            <AmountTabs onChange={handleMaxFieldAAmount} />
            {!!maxAmounts[Field.CURRENCY_A]?.toExact() && (
              <TEXT.secondary fontWeight={600} fontSize={12}>
                Availability: {maxAmounts[Field.CURRENCY_A]?.toExact() ?? '0'}
              </TEXT.secondary>
            )}
            <ColumnCenter>
              <LiquidityIconWrapper onClick={handleASwitchCurrencies}>
                <img width="20px" height="20px" src={ArrowsCellIcon} alt="arrow" />
              </LiquidityIconWrapper>
            </ColumnCenter>
            <CurrencyInputPanel
              label={'To'}
              value={formattedAmounts[Field.CURRENCY_B]}
              onUserInput={onFieldBInput}
              onCurrencySelect={handleCurrencyBSelect}
              onMax={() => {
                onFieldBInput(maxAmounts[Field.CURRENCY_B]?.toExact() ?? '');
              }}
              showMaxButton={!atMaxAmounts[Field.CURRENCY_B]}
              currency={currencies[Field.CURRENCY_B]}
              showAvailableInPool={false}
              id="add-liquidity-input-tokenb"
              showCommonBases
            />
            <AmountTabs onChange={handleMaxFieldBAmount} />
            {!!maxAmounts[Field.CURRENCY_B]?.toExact() && (
              <TEXT.secondary fontWeight={600} fontSize={12}>
                Availability: {maxAmounts[Field.CURRENCY_B]?.toExact() ?? '0'}
              </TEXT.secondary>
            )}
            {currencies[Field.CURRENCY_A] && currencies[Field.CURRENCY_B] && pairState !== PairState.INVALID && (
              <>
                <LiquidityInfoCard>
                  <RowBetween>
                    <TEXT.primary fontSize={14} fontWeight={500}>
                      Prices and pool share:
                    </TEXT.primary>
                  </RowBetween>
                  <PoolPriceBar
                    currencies={currencies}
                    poolTokenPercentage={poolTokenPercentage}
                    noLiquidity={noLiquidity}
                    price={price}
                  />
                </LiquidityInfoCard>
              </>
            )}

            {!account ? (
              <ButtonPrimary onClick={toggleWalletModal}>Connect Wallet</ButtonPrimary>
            ) : isLocked ? (
              <GreyCardSecondaryLight style={{ textAlign: 'center' }}>
                <TYPE.main>Pair locked</TYPE.main>
              </GreyCardSecondaryLight>
            ) : (
              <AutoColumn gap={'md'}>
                {(approvalA === ApprovalState.NOT_APPROVED ||
                  approvalA === ApprovalState.PENDING ||
                  approvalB === ApprovalState.NOT_APPROVED ||
                  approvalB === ApprovalState.PENDING) &&
                  isValid && (
                    <RowBetween>
                      {approvalA !== ApprovalState.APPROVED && (
                        <ButtonPrimarySmallerText
                          onClick={approveACallback}
                          disabled={approvalA === ApprovalState.PENDING}
                          width={approvalB !== ApprovalState.APPROVED ? '48%' : '100%'}
                        >
                          {approvalA === ApprovalState.PENDING ? (
                            <Dots>Approving {currencies[Field.CURRENCY_A]?.symbol}</Dots>
                          ) : (
                            'Approve ' + currencies[Field.CURRENCY_A]?.symbol
                          )}
                        </ButtonPrimarySmallerText>
                      )}
                      {approvalB !== ApprovalState.APPROVED && (
                        <ButtonPrimarySmallerText
                          onClick={approveBCallback}
                          disabled={approvalB === ApprovalState.PENDING}
                          width={approvalA !== ApprovalState.APPROVED ? '48%' : '100%'}
                        >
                          {approvalB === ApprovalState.PENDING ? (
                            <Dots>Approving {currencies[Field.CURRENCY_B]?.symbol}</Dots>
                          ) : (
                            'Approve ' + currencies[Field.CURRENCY_B]?.symbol
                          )}
                        </ButtonPrimarySmallerText>
                      )}
                    </RowBetween>
                  )}
                <ButtonError
                  onClick={() => {
                    expertMode ? onAdd() : setShowConfirm(true);
                  }}
                  disabled={!isValid || approvalA !== ApprovalState.APPROVED || approvalB !== ApprovalState.APPROVED}
                  error={!isValid && !!parsedAmounts[Field.CURRENCY_A] && !!parsedAmounts[Field.CURRENCY_B]}
                >
                  <Text fontSize={20} fontWeight={500}>
                    {error ?? 'Supply'}
                  </Text>
                </ButtonError>
              </AutoColumn>
            )}
          </AutoColumn>
        </Wrapper>
      </AppBody>

      {pair ? (
        <AutoColumn style={{ width: '100%', maxWidth: '388px', marginTop: '24px' }}>
          <MinimalPositionCard showUnwrapped={oneCurrencyIsWETH} pair={pair} />
        </AutoColumn>
      ) : null}
    </PageWrap>
  );
}

import { splitSignature } from '@ethersproject/bytes';
import { Contract } from '@ethersproject/contracts';
import { TransactionResponse } from '@ethersproject/providers';
import { currencyEquals, ETHER, Percent, WETH } from '@bidelity/sdk';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Plus } from 'react-feather';
import { RouteComponentProps } from 'react-router';
import { Text } from 'rebass';
import { ThemeContext } from 'styled-components';
import { ButtonConfirmed, ButtonError, ButtonPrimary } from '../../components/Button';
import { AutoColumn, ColumnCenter } from '../../components/Column';
import DoubleCurrencyLogo from '../../components/DoubleLogo';
import { MinimalPositionCard } from '../../components/PositionCard';
import { RowBetween, RowFixed } from '../../components/Row';
import TransactionConfirmationModal, { ConfirmationModalContent } from '../../components/TransactionConfirmationModal';

import CurrencyLogo from '../../components/CurrencyLogo';
import Slider from '../../components/Slider';
import { LP_TOKEN_NAME, ROUTER_ADDRESS } from '../../constants';
import { useActiveWeb3React } from '../../hooks';
import { useCurrency } from '../../hooks/Tokens';
import { usePairContract } from '../../hooks/useContract';
import useIsArgentWallet from '../../hooks/useIsArgentWallet';
import useTransactionDeadline from '../../hooks/useTransactionDeadline';

import { BigNumber } from '@ethersproject/bignumber';
import ArrowInCircleIcon from '../../assets/svg-bid/arrow-down-in-circle.svg';
import AmountTabs from '../../components/AmountTabs';
import { Dots } from '../../components/swap/styleds';
import { ApprovalState, useApproveCallback } from '../../hooks/useApproveCallback';
import { useSuccessModalOpen, useSuccessModalToggle, useWalletModalToggle } from '../../state/application/hooks';
import { Field } from '../../state/burn/actions';
import { useBurnActionHandlers, useBurnState, useDerivedBurnInfo } from '../../state/burn/hooks';
import { useTransactionAdder } from '../../state/transactions/hooks';
import { useUserSlippageTolerance } from '../../state/user/hooks';
import { TEXT, TYPE } from '../../theme';
import { calculateGasMargin, calculateSlippageAmount, getRouterContract } from '../../utils';
import useDebouncedChangeHandler from '../../utils/useDebouncedChangeHandler';
import { wrappedCurrency } from '../../utils/wrappedCurrency';
import AppBody, { PageWrap } from '../AppBody';
import { ButtonOutlinedRemove, FlexAlign, InfoCard, SliderWrapper, Wrapper } from '../Pool/styleds';
import { SuccessTransactionModal } from '../../components/swap/SuccessTransactionModal';
import { useQuery } from '@apollo/client';
import { PAIRS_LOCK_QUERY } from '../AddLiquidity/query';
import { GreyCardLight } from '../../components/Card';
import { isPairLocked } from '../../utils/isPairLocked';

export default function RemoveLiquidity({
  history,
  match: {
    params: { currencyIdA, currencyIdB },
  },
}: RouteComponentProps<{ currencyIdA: string; currencyIdB: string }>) {
  const { data: pairsList } = useQuery(PAIRS_LOCK_QUERY, { context: { clientName: 'endpoint2' } });

  const [currencyA, currencyB] = [useCurrency(currencyIdA) ?? undefined, useCurrency(currencyIdB) ?? undefined];
  const { account, chainId, library } = useActiveWeb3React();
  const [tokenA, tokenB] = useMemo(
    () => [wrappedCurrency(currencyA, chainId), wrappedCurrency(currencyB, chainId)],
    [currencyA, currencyB, chainId]
  );

  const theme = useContext(ThemeContext);

  // toggle wallet when disconnected
  const toggleWalletModal = useWalletModalToggle();

  // burn state
  const { independentField, typedValue } = useBurnState();
  const { pair, parsedAmounts, error } = useDerivedBurnInfo(currencyA ?? undefined, currencyB ?? undefined);
  const { onUserInput: _onUserInput } = useBurnActionHandlers();
  const isValid = !error;

  // modal and loading
  const [showConfirm, setShowConfirm] = useState<boolean>(false);
  const [attemptingTxn, setAttemptingTxn] = useState(false); // clicked confirm

  // txn values
  const [txHash, setTxHash] = useState<string>('');
  const deadline = useTransactionDeadline();
  const [allowedSlippage] = useUserSlippageTolerance();

  const toggleSuccessModal = useSuccessModalToggle();
  const isOpenSuccessModal = useSuccessModalOpen();

  const formattedAmounts = {
    [Field.LIQUIDITY_PERCENT]: parsedAmounts[Field.LIQUIDITY_PERCENT].equalTo('0')
      ? '0'
      : parsedAmounts[Field.LIQUIDITY_PERCENT].lessThan(new Percent('1', '100'))
      ? '<1'
      : parsedAmounts[Field.LIQUIDITY_PERCENT].toFixed(0),
    [Field.LIQUIDITY]:
      independentField === Field.LIQUIDITY ? typedValue : parsedAmounts[Field.LIQUIDITY]?.toSignificant(6) ?? '',
    [Field.CURRENCY_A]:
      independentField === Field.CURRENCY_A ? typedValue : parsedAmounts[Field.CURRENCY_A]?.toSignificant(6) ?? '',
    [Field.CURRENCY_B]:
      independentField === Field.CURRENCY_B ? typedValue : parsedAmounts[Field.CURRENCY_B]?.toSignificant(6) ?? '',
  };

  // pair contract
  const pairContract: Contract | null = usePairContract(pair?.liquidityToken?.address);

  // allowance handling
  const [signatureData, setSignatureData] = useState<{ v: number; r: string; s: string; deadline: number } | null>(
    null
  );
  const [approval, approveCallback] = useApproveCallback(parsedAmounts[Field.LIQUIDITY], ROUTER_ADDRESS);

  const isArgentWallet = useIsArgentWallet();

  async function onAttemptToApprove() {
    if (!pairContract || !pair || !library || !deadline) throw new Error('missing dependencies');
    const liquidityAmount = parsedAmounts[Field.LIQUIDITY];
    if (!liquidityAmount) throw new Error('missing liquidity amount');

    if (isArgentWallet) {
      return approveCallback();
    }

    // try to gather a signature for permission
    const nonce = await pairContract.nonces(account);

    const EIP712Domain = [
      { name: 'name', type: 'string' },
      { name: 'version', type: 'string' },
      { name: 'chainId', type: 'uint256' },
      { name: 'verifyingContract', type: 'address' },
    ];
    const domain = {
      name: LP_TOKEN_NAME,
      version: '1',
      chainId: chainId,
      verifyingContract: pair.liquidityToken.address,
    };
    const Permit = [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
      { name: 'value', type: 'uint256' },
      { name: 'nonce', type: 'uint256' },
      { name: 'deadline', type: 'uint256' },
    ];
    const message = {
      owner: account,
      spender: ROUTER_ADDRESS,
      value: liquidityAmount.raw.toString(),
      nonce: nonce.toHexString(),
      deadline: deadline.toNumber(),
    };
    const data = JSON.stringify({
      types: {
        EIP712Domain,
        Permit,
      },
      domain,
      primaryType: 'Permit',
      message,
    });

    library
      .send('', [account, data])
      .then(splitSignature)
      .then((signature) => {
        setSignatureData({
          v: signature.v,
          r: signature.r,
          s: signature.s,
          deadline: deadline.toNumber(),
        });
      })
      .catch((error) => {
        // for all errors other than 4001 (EIP-1193 user rejected request), fall back to manual approve
        if (error?.code !== 4001) {
          approveCallback();
        }
      });
  }

  // wrapped onUserInput to clear signatures
  const onUserInput = useCallback(
    (field: Field, typedValue: string) => {
      setSignatureData(null);
      return _onUserInput(field, typedValue);
    },
    [_onUserInput]
  );

  // tx sending
  const addTransaction = useTransactionAdder();
  async function onRemove() {
    if (!chainId || !library || !account || !deadline) throw new Error('missing dependencies');
    const { [Field.CURRENCY_A]: currencyAmountA, [Field.CURRENCY_B]: currencyAmountB } = parsedAmounts;
    if (!currencyAmountA || !currencyAmountB) {
      throw new Error('missing currency amounts');
    }
    const router = getRouterContract(chainId, library, account);

    const amountsMin = {
      [Field.CURRENCY_A]: calculateSlippageAmount(currencyAmountA, allowedSlippage)[0],
      [Field.CURRENCY_B]: calculateSlippageAmount(currencyAmountB, allowedSlippage)[0],
    };

    if (!currencyA || !currencyB) throw new Error('missing tokens');
    const liquidityAmount = parsedAmounts[Field.LIQUIDITY];
    if (!liquidityAmount) throw new Error('missing liquidity amount');

    const currencyBIsETH = currencyB === ETHER;
    const oneCurrencyIsETH = currencyA === ETHER || currencyBIsETH;

    if (!tokenA || !tokenB) throw new Error('could not wrap');

    let methodNames: string[], args: Array<string | string[] | number | boolean>;
    // we have approval, use normal remove liquidity
    if (approval === ApprovalState.APPROVED) {
      // removeLiquidityETH
      if (oneCurrencyIsETH) {
        methodNames = ['removeLiquidityETH', 'removeLiquidityETHSupportingFeeOnTransferTokens'];
        args = [
          currencyBIsETH ? tokenA.address : tokenB.address,
          liquidityAmount.raw.toString(),
          // amountsMin[currencyBIsETH ? Field.CURRENCY_A : Field.CURRENCY_B].toString(),
          // amountsMin[currencyBIsETH ? Field.CURRENCY_B : Field.CURRENCY_A].toString(),
          '0',
          '0',
          account,
          deadline.toHexString(),
        ];
      }
      // removeLiquidity
      else {
        methodNames = ['removeLiquidity'];
        args = [
          tokenA.address,
          tokenB.address,
          liquidityAmount.raw.toString(),
          // amountsMin[Field.CURRENCY_A].toString(),
          // amountsMin[Field.CURRENCY_B].toString(),
          '0',
          '0',
          account,
          deadline.toHexString(),
        ];
      }
    }
    // we have a signataure, use permit versions of remove liquidity
    else if (signatureData !== null) {
      // removeLiquidityETHWithPermit
      if (oneCurrencyIsETH) {
        methodNames = ['removeLiquidityETHWithPermit', 'removeLiquidityETHWithPermitSupportingFeeOnTransferTokens'];
        args = [
          currencyBIsETH ? tokenA.address : tokenB.address,
          liquidityAmount.raw.toString(),
          amountsMin[currencyBIsETH ? Field.CURRENCY_A : Field.CURRENCY_B].toString(),
          amountsMin[currencyBIsETH ? Field.CURRENCY_B : Field.CURRENCY_A].toString(),
          account,
          signatureData.deadline,
          false,
          signatureData.v,
          signatureData.r,
          signatureData.s,
        ];
      }
      // removeLiquidityETHWithPermit
      else {
        methodNames = ['removeLiquidityWithPermit'];
        args = [
          tokenA.address,
          tokenB.address,
          liquidityAmount.raw.toString(),
          amountsMin[Field.CURRENCY_A].toString(),
          amountsMin[Field.CURRENCY_B].toString(),
          account,
          signatureData.deadline,
          false,
          signatureData.v,
          signatureData.r,
          signatureData.s,
        ];
      }
    } else {
      throw new Error('Attempting to confirm without approval or a signature. Please contact support.');
    }

    const safeGasEstimates: (BigNumber | undefined)[] = await Promise.all(
      methodNames.map((methodName) =>
        router.estimateGas[methodName](...args)
          .then(calculateGasMargin)
          .catch((error) => {
            console.error(`estimateGas failed`, methodName, args, error);
            return undefined;
          })
      )
    );

    const indexOfSuccessfulEstimation = safeGasEstimates.findIndex((safeGasEstimate) =>
      BigNumber.isBigNumber(safeGasEstimate)
    );

    // all estimations failed...
    if (indexOfSuccessfulEstimation === -1) {
      console.error('This transaction would fail. Please contact support.');
    } else {
      const methodName = methodNames[indexOfSuccessfulEstimation];
      const safeGasEstimate = safeGasEstimates[indexOfSuccessfulEstimation];

      setAttemptingTxn(true);
      await router[methodName](...args, {
        gasLimit: safeGasEstimate,
      })
        .then((response: TransactionResponse) => {
          setAttemptingTxn(false);

          addTransaction(response, {
            summary:
              'Remove ' +
              parsedAmounts[Field.CURRENCY_A]?.toSignificant(3) +
              ' ' +
              currencyA?.symbol +
              ' and ' +
              parsedAmounts[Field.CURRENCY_B]?.toSignificant(3) +
              ' ' +
              currencyB?.symbol,
          });

          setTxHash(response.hash);
        })
        .catch((error: Error) => {
          setAttemptingTxn(false);
          // we only care if the error is something _other_ than the user rejected the tx
          console.error(error);
        });
    }
  }

  function modalHeader() {
    return (
      <AutoColumn gap={'md'} style={{ marginTop: '20px' }}>
        <RowBetween align="flex-end">
          <Text fontSize={24} fontWeight={500}>
            {parsedAmounts[Field.CURRENCY_A]?.toSignificant(6)}
          </Text>
          <RowFixed gap="4px">
            <CurrencyLogo currency={currencyA} size={'24px'} />
            <Text fontSize={24} fontWeight={500} style={{ marginLeft: '10px' }}>
              {currencyA?.symbol}
            </Text>
          </RowFixed>
        </RowBetween>
        <RowFixed>
          <Plus size="16" color={theme.text2} />
        </RowFixed>
        <RowBetween align="flex-end">
          <Text fontSize={24} fontWeight={500}>
            {parsedAmounts[Field.CURRENCY_B]?.toSignificant(6)}
          </Text>
          <RowFixed gap="4px">
            <CurrencyLogo currency={currencyB} size={'24px'} />
            <Text fontSize={24} fontWeight={500} style={{ marginLeft: '10px' }}>
              {currencyB?.symbol}
            </Text>
          </RowFixed>
        </RowBetween>

        <TYPE.italic fontSize={12} color={theme.text2} textAlign="left" padding={'12px 0 0 0'}>
          {`Output is estimated. If the price changes by more than ${
            allowedSlippage / 100
          }% your transaction will revert.`}
        </TYPE.italic>
      </AutoColumn>
    );
  }

  function modalBottom() {
    return (
      <div style={{ overflow: 'hidden' }}>
        <RowBetween>
          <Text color={theme.text2} fontWeight={500} fontSize={16}>
            {currencyA?.symbol + '/' + currencyB?.symbol} Burned
          </Text>
          <RowFixed>
            <DoubleCurrencyLogo currency0={currencyA} currency1={currencyB} margin={true} />
            <Text fontWeight={500} fontSize={16}>
              {parsedAmounts[Field.LIQUIDITY]?.toSignificant(6)}
            </Text>
          </RowFixed>
        </RowBetween>
        {pair && (
          <>
            <RowBetween>
              <Text color={theme.text2} fontWeight={500} fontSize={16}>
                Price
              </Text>
              <Text fontWeight={500} fontSize={16} color={theme.text1}>
                1 {currencyA?.symbol} = {tokenA ? pair.priceOf(tokenA).toSignificant(6) : '-'} {currencyB?.symbol}
              </Text>
            </RowBetween>
            <RowBetween>
              <div />
              <Text fontWeight={500} fontSize={16} color={theme.text1}>
                1 {currencyB?.symbol} = {tokenB ? pair.priceOf(tokenB).toSignificant(6) : '-'} {currencyA?.symbol}
              </Text>
            </RowBetween>
          </>
        )}
        <ButtonPrimary disabled={!(approval === ApprovalState.APPROVED || signatureData !== null)} onClick={onRemove}>
          <Text fontWeight={500} fontSize={20}>
            Confirm
          </Text>
        </ButtonPrimary>
      </div>
    );
  }

  const pendingText = `Removing ${parsedAmounts[Field.CURRENCY_A]?.toSignificant(6)} ${
    currencyA?.symbol
  } and ${parsedAmounts[Field.CURRENCY_B]?.toSignificant(6)} ${currencyB?.symbol}`;

  const pendingContent = () => {
    return (
      <TEXT.default fontWeight={600} fontSize={14} color="textPrimary" textAlign="center">
        Removing{' '}
        <TEXT.default color="primary1" display="inline">
          {parsedAmounts[Field.CURRENCY_A]?.toSignificant(6)} {currencyA?.symbol}
        </TEXT.default>{' '}
        and{' '}
        <TEXT.default color="primary1" display="inline">
          {parsedAmounts[Field.CURRENCY_B]?.toSignificant(6)} {currencyB?.symbol}
        </TEXT.default>
      </TEXT.default>
    );
  };

  const liquidityPercentChangeCallback = useCallback(
    (value: number) => {
      onUserInput(Field.LIQUIDITY_PERCENT, value.toString());
    },
    [onUserInput]
  );

  const oneCurrencyIsWETH = Boolean(
    chainId &&
      ((currencyA && currencyEquals(WETH[chainId], currencyA)) ||
        (currencyB && currencyEquals(WETH[chainId], currencyB)))
  );

  const handleDismissConfirmation = useCallback(() => {
    setShowConfirm(false);
    setSignatureData(null); // important that we clear signature data to avoid bad sigs
    // if there was a tx hash, we want to clear the input
    if (txHash) {
      onUserInput(Field.LIQUIDITY_PERCENT, '0');
    }
  }, [onUserInput, txHash]);

  const [innerLiquidityPercentage, setInnerLiquidityPercentage] = useDebouncedChangeHandler(
    Number.parseInt(parsedAmounts[Field.LIQUIDITY_PERCENT].toFixed(0)),
    liquidityPercentChangeCallback
  );

  const handleAmountTabs = (percent: number) => {
    onUserInput(Field.LIQUIDITY_PERCENT, percent.toString());
  };

  const toggleSuccess = () => {
    setTxHash('');
    setShowConfirm(false);
    toggleSuccessModal();
  };

  useEffect(() => {
    return () => {
      setInnerLiquidityPercentage(0);
    };
  }, []);

  const isLocked = pairsList && pairsList?.pairs && pair ? isPairLocked(pairsList.pairs, pair) : false;

  return (
    <PageWrap>
      <AppBody maxHeight={688}>
        <Wrapper>
          <SuccessTransactionModal
            hash={txHash !== '' ? txHash : undefined}
            isOpen={isOpenSuccessModal}
            onDismiss={toggleSuccess}
          />
          <TransactionConfirmationModal
            isOpen={showConfirm}
            onDismiss={handleDismissConfirmation}
            attemptingTxn={attemptingTxn}
            hash={txHash ? txHash : ''}
            pair={pair}
            isRemove={true}
            content={() => (
              <ConfirmationModalContent
                title={'You will receive'}
                onDismiss={handleDismissConfirmation}
                topContent={modalHeader}
                bottomContent={modalBottom}
              />
            )}
            pendingText={pendingText}
            pendingContent={pendingContent}
          />
          <AutoColumn gap="16px">
            <AutoColumn gap="4px">
              <TEXT.primary fontSize={20} fontWeight={600} lineHeight="30px">
                Remove {currencyA?.symbol}/{currencyB?.symbol} Liquidity
              </TEXT.primary>
              <TEXT.secondary fontSize={12} fontWeight={500} lineHeight="20.4px">
                To Receive {currencyA?.symbol} and {currencyB?.symbol}
              </TEXT.secondary>
            </AutoColumn>

            <TEXT.primary fontSize={14} fontWeight={700} lineHeight="24px">
              Amount
            </TEXT.primary>

            <SliderWrapper gap="13px">
              <TEXT.primary fontSize={24} fontWeight={700}>
                {formattedAmounts[Field.LIQUIDITY_PERCENT]}%
              </TEXT.primary>
              <Slider value={innerLiquidityPercentage} onChange={setInnerLiquidityPercentage} />
              <AmountTabs onChange={handleAmountTabs} />
            </SliderWrapper>

            <ColumnCenter>
              <img src={ArrowInCircleIcon} alt="icon" />
            </ColumnCenter>

            <InfoCard>
              <AutoColumn gap="16px">
                <TEXT.primary fontSize={14} fontWeight={600}>
                  You will receive
                </TEXT.primary>
                <RowBetween>
                  <FlexAlign>
                    <CurrencyLogo currency={currencyA} />
                    <TEXT.primary fontSize={12} fontWeight={600} marginLeft="8px">
                      {currencyA?.symbol}
                    </TEXT.primary>
                  </FlexAlign>
                  <TEXT.primary fontSize={12} fontWeight={600}>
                    {formattedAmounts[Field.CURRENCY_A] || '-'}
                  </TEXT.primary>
                </RowBetween>
                <RowBetween>
                  <FlexAlign>
                    <CurrencyLogo currency={currencyB} />
                    <TEXT.primary fontSize={12} fontWeight={600} marginLeft="8px">
                      {currencyB?.symbol}
                    </TEXT.primary>
                  </FlexAlign>
                  <TEXT.primary fontSize={12} fontWeight={600}>
                    {formattedAmounts[Field.CURRENCY_B] || '-'}
                  </TEXT.primary>
                </RowBetween>
              </AutoColumn>
            </InfoCard>

            {pair && (
              <InfoCard>
                <AutoColumn gap="16px">
                  <TEXT.primary fontSize={14} fontWeight={600}>
                    Prices and pool share:
                  </TEXT.primary>
                  <RowBetween>
                    <TEXT.secondary fontSize={12} fontWeight={500}>
                      1 {currencyA?.symbol} =
                    </TEXT.secondary>
                    <TEXT.primary fontSize={12} fontWeight={600}>
                      {tokenA ? pair.priceOf(tokenA).toSignificant(6) : '-'} {currencyB?.symbol}
                    </TEXT.primary>
                  </RowBetween>
                  <RowBetween>
                    <TEXT.secondary fontSize={12} fontWeight={500}>
                      1 {currencyB?.symbol} =
                    </TEXT.secondary>
                    <TEXT.primary fontSize={12} fontWeight={600}>
                      {tokenB ? pair.priceOf(tokenB).toSignificant(6) : '-'} {currencyA?.symbol}
                    </TEXT.primary>
                  </RowBetween>
                </AutoColumn>
              </InfoCard>
            )}

            <div style={{ position: 'relative' }}>
              {!account ? (
                <ButtonPrimary onClick={toggleWalletModal}>Connect Wallet</ButtonPrimary>
              ) : isLocked ? (
                <GreyCardLight style={{ textAlign: 'center', padding: '12px' }}>
                  <TYPE.main>Pair locked</TYPE.main>
                </GreyCardLight>
              ) : (
                <RowBetween>
                  <ButtonConfirmed
                    onClick={onAttemptToApprove}
                    confirmed={approval === ApprovalState.APPROVED || signatureData !== null}
                    disabled={approval !== ApprovalState.NOT_APPROVED || signatureData !== null}
                    mr="0.5rem"
                    fontWeight={600}
                    fontSize={14}
                    style={{ paddingTop: '10px', paddingBottom: '10px', borderRadius: '10px' }}
                  >
                    {approval === ApprovalState.PENDING ? (
                      <Dots>Approving</Dots>
                    ) : approval === ApprovalState.APPROVED || signatureData !== null ? (
                      'Enabled'
                    ) : (
                      'Enable'
                    )}
                  </ButtonConfirmed>
                  {!isValid || (signatureData === null && approval !== ApprovalState.APPROVED) ? (
                    <ButtonError
                      onClick={() => {
                        setShowConfirm(true);
                      }}
                      disabled={!isValid || (signatureData === null && approval !== ApprovalState.APPROVED)}
                      error={!isValid && !!parsedAmounts[Field.CURRENCY_A] && !!parsedAmounts[Field.CURRENCY_B]}
                      style={{ paddingTop: '10px', paddingBottom: '10px', borderRadius: '10px' }}
                    >
                      <Text fontSize={14} fontWeight={600}>
                        {error || 'Remove'}
                      </Text>
                    </ButtonError>
                  ) : (
                    <ButtonOutlinedRemove
                      onClick={() => {
                        setShowConfirm(true);
                      }}
                    >
                      <TEXT.primary fontSize={14} fontWeight={600}>
                        Remove
                      </TEXT.primary>
                    </ButtonOutlinedRemove>
                  )}
                </RowBetween>
              )}
            </div>
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

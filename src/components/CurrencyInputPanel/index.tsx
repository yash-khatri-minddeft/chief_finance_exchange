import { Currency, Pair } from '@bidelity/sdk';
import React, { useState, useCallback } from 'react';
import styled from 'styled-components';
import CurrencySearchModal from '../SearchModal/CurrencySearchModal';
import CurrencyLogo from '../CurrencyLogo';
import DoubleCurrencyLogo from '../DoubleLogo';
import { TEXT } from '../../theme';
import { Input as NumericalInput } from '../NumericalInput';
import { darken } from 'polished';
import VectorDonIcon from '../../assets/svg-bid/vector-down.svg';
import Tooltip from '../Tooltip';

const InputRow = styled.div<{ selected: boolean; isHomePage?: boolean; isSecond?: boolean }>`
  position: relative;
  ${({ theme }) => theme.flexRowNoWrap}
  align-items: center;
  padding: ${({ selected }) => (selected ? '0.8rem 0.6rem 0.8rem 1.1rem' : '0.8rem 0.8rem 0.8rem 1.1rem')};
  padding-top: ${({ isHomePage }) => (isHomePage ? '28px' : '')};
  padding-left: ${({ isHomePage, isSecond }) => (isHomePage ? (isSecond ? '30px' : '15px') : '')};
  width: 100%;
  max-width: 255px;
  background-color: ${({ theme }) => theme.newTheme.white};
  border-radius: ${({ isHomePage }) => (isHomePage ? '' : '10px')};
`;

const CurrencySelect = styled.button<{ isHomePage?: boolean; isFirst?: boolean }>`
  align-items: center;
  border: none;
  background-color: ${({ theme, isHomePage }) => (isHomePage ? theme.newTheme.teal : theme.newTheme.bg2)};
  color: ${({ theme }) => theme.text1};
  border-radius: ${({ isHomePage }) => (isHomePage ? '' : '12px')};
  outline: none;
  cursor: pointer;
  user-select: none;
  transition: 0.2s;
  display: flex;
  justify-content: space-between;
  flex: 30;
  padding-right: ${({ isHomePage, isFirst }) => (isHomePage && isFirst ? '30px' : '0.75rem')};

  :focus,
  :hover {
    background-color: ${({ theme, isHomePage }) =>
      isHomePage ? darken(0.1, theme.newTheme.teal) : darken(0.03, theme.newTheme.bg2)};
  }
`;

const FlexedBlock = styled.div`
  display: flex;
`;

const Aligner = styled.span`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  margin-left: 6px;
`;

const InputPanel = styled.div<{ hideInput?: boolean; isHomePage?: boolean }>`
  ${({ theme }) => theme.flexColumnNoWrap}
  position: relative;
  border-radius: 14px;
  background-color: ${({ theme }) => theme.newTheme.bg2};
  border: ${({ isHomePage, theme }) => (isHomePage ? `1px solid ${theme.newTheme.primary1}` : '')};
  z-index: 1;
  padding: ${({ isHomePage }) => (isHomePage ? '' : '8px 10px 7px 0')};
  overflow: hidden;
`;

const Container = styled.div<{ hideInput: boolean }>`
  border-radius: ${({ hideInput }) => (hideInput ? '8px' : '20px')};
  display: flex;
  justify-content: space-between;
`;

const StyledTokenName = styled.span`
  font-size: 14px;
  font-weight: 600;
  margin-top: 4px;
`;

const StyledBalanceMax = styled.span`
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  color: ${({ theme }) => theme.newTheme.primary1};
`;

const AvailabilityRow = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 0.3rem;
`;

const InputLabel = styled.span<{ isSecond?: boolean }>`
  position: absolute;
  top: 10px;
  left: ${({ isSecond }) => (isSecond ? '30px' : '15px')};
  font-weight: 500;
  font-size: 12px;
  color: #8192aa;
`;

interface CurrencyInputPanelProps {
  value: string;
  onUserInput: (value: string) => void;
  onMax?: () => void;
  showMaxButton: boolean;
  label?: string;
  onCurrencySelect?: (currency: Currency) => void;
  currency?: Currency | null;
  disableCurrencySelect?: boolean;
  hideBalance?: boolean;
  pair?: Pair | null;
  hideInput?: boolean;
  otherCurrency?: Currency | null;
  id: string;
  showCommonBases?: boolean;
  customBalanceText?: string;
  showAvailableInPool?: boolean;
  availabilityInPool?: string | undefined;
  showBorder?: boolean;
  isHomePage?: boolean;
  label2?: string;
  isFirst?: boolean;
  isSecond?: boolean;
}

export default function CurrencyInputPanel({
  value,
  onUserInput,
  onMax,
  showMaxButton,
  label = 'Input',
  onCurrencySelect,
  currency,
  disableCurrencySelect = false,
  pair = null, // used for double token logo
  hideInput = false,
  otherCurrency,
  id,
  showCommonBases,
  showAvailableInPool = false,
  availabilityInPool,
  showBorder = false,
  isHomePage = false,
  label2,
  isFirst = false,
  isSecond,
}: CurrencyInputPanelProps) {
  const [modalOpen, setModalOpen] = useState(false);

  const [showTooltip, setShowTooltip] = useState<boolean>(false);

  const openTooltip = useCallback(() => setShowTooltip(true), [Tooltip]);
  const closeTooltip = useCallback(() => setShowTooltip(false), [Tooltip]);

  const currencyName =
    currency && currency.symbol && currency.symbol.length > 20
      ? currency.symbol.slice(0, 4) + '...' + currency.symbol.slice(currency.symbol.length - 5, currency.symbol.length)
      : currency?.symbol;

  const handleDismissSearch = useCallback(() => {
    setModalOpen(false);
  }, [setModalOpen]);

  const shortName = currency?.name?.split(' ')[0];

  return (
    <InputPanel id={id} isHomePage={isHomePage}>
      <Container hideInput={hideInput}>
        {!isHomePage && (
          <CurrencySelect
            className="open-currency-select-button"
            onClick={() => {
              if (!disableCurrencySelect) {
                setModalOpen(true);
              }
            }}
          >
            <FlexedBlock>
              {pair ? (
                <DoubleCurrencyLogo currency0={pair.token0} currency1={pair.token1} size={26} margin={true} />
              ) : currency ? (
                <CurrencyLogo currency={currency} size={'26px'} />
              ) : null}

              {currencyName !== undefined ? (
                <Aligner>
                  {!hideInput && (
                    <span>
                      <TEXT.default color="textSecondary" fontWeight={600} fontSize={10}>
                        {label}
                      </TEXT.default>
                    </span>
                  )}
                  {pair ? (
                    <StyledTokenName className="pair-name-container">
                      {pair?.token0.symbol}:{pair?.token1.symbol}
                    </StyledTokenName>
                  ) : (
                    <StyledTokenName className="token-symbol-container">{currencyName}</StyledTokenName>
                  )}
                </Aligner>
              ) : (
                <TEXT.default color="textSecondary" fontWeight={600} fontSize={12} textAlign="left">
                  Select a currency
                </TEXT.default>
              )}
            </FlexedBlock>
            {!disableCurrencySelect && <img src={VectorDonIcon} alt="img" />}
          </CurrencySelect>
        )}
        <InputRow
          isSecond={isSecond}
          isHomePage={isHomePage}
          style={hideInput ? { padding: '0', borderRadius: '8px' } : {}}
          selected={disableCurrencySelect}
        >
          <InputLabel isSecond={isSecond}>{label2}</InputLabel>
          {!hideInput && (
            <>
              <NumericalInput
                fontSize={isHomePage ? '20px' : undefined}
                className="token-amount-input"
                value={value}
                onUserInput={(val) => {
                  onUserInput(val);
                }}
              />
              {showMaxButton && <StyledBalanceMax onClick={onMax}>MAX</StyledBalanceMax>}
            </>
          )}
        </InputRow>
        {isHomePage && (
          <CurrencySelect
            isHomePage={isHomePage}
            isFirst={isFirst}
            className="open-currency-select-button"
            onClick={() => {
              if (!disableCurrencySelect) {
                setModalOpen(true);
              }
            }}
          >
            <FlexedBlock style={isFirst ? { marginRight: '20px' } : {}}>
              {pair ? (
                <DoubleCurrencyLogo currency0={pair.token0} currency1={pair.token1} size={26} margin={true} />
              ) : currency ? (
                <CurrencyLogo currency={currency} size={'26px'} />
              ) : null}

              {currencyName !== undefined ? (
                <Aligner>
                  {!hideInput && (
                    <span>
                      <Tooltip text={currency?.name || ''} show={showTooltip} placement="bottom-start">
                        <TEXT.default
                          color="textSecondary"
                          fontWeight={600}
                          fontSize={10}
                          onMouseEnter={openTooltip}
                          onMouseLeave={closeTooltip}
                        >
                          {shortName}
                        </TEXT.default>
                      </Tooltip>
                    </span>
                  )}
                  {pair ? (
                    <StyledTokenName className="pair-name-container">
                      {pair?.token0.symbol}:{pair?.token1.symbol}
                    </StyledTokenName>
                  ) : (
                    <StyledTokenName className="token-symbol-container">{currencyName}</StyledTokenName>
                  )}
                </Aligner>
              ) : (
                <TEXT.default color="textSecondary" fontWeight={600} fontSize={12} textAlign="left">
                  Select a currency
                </TEXT.default>
              )}
            </FlexedBlock>
            {!disableCurrencySelect && <img src={VectorDonIcon} alt="img" />}
          </CurrencySelect>
        )}
      </Container>
      {!disableCurrencySelect && onCurrencySelect && (
        <CurrencySearchModal
          isOpen={modalOpen}
          onDismiss={handleDismissSearch}
          onCurrencySelect={onCurrencySelect}
          selectedCurrency={currency}
          otherSelectedCurrency={otherCurrency}
          showCommonBases={showCommonBases}
        />
      )}
      {showAvailableInPool && (
        <AvailabilityRow>
          <TEXT.default color="textSecondary" fontWeight={500} fontSize={10}>
            Availability In Pool: {availabilityInPool ? availabilityInPool : '-'} {currencyName}
          </TEXT.default>
        </AvailabilityRow>
      )}
    </InputPanel>
  );
}

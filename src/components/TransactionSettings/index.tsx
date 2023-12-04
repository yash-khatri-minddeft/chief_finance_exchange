import React, { useState, useRef } from 'react';
import styled from 'styled-components';

import QuestionHelper from '../QuestionHelper';
import { TEXT } from '../../theme';
import { AutoColumn } from '../Column';
import { RowBetween } from '../Row';

import { darken } from 'polished';

enum SlippageError {
  InvalidInput = 'InvalidInput',
  RiskyLow = 'RiskyLow',
  RiskyHigh = 'RiskyHigh',
}

const FancyButton = styled.button`
  color: ${({ theme }) => theme.text1};
  align-items: center;
  height: 2rem;
  border-radius: 6px;
  font-size: 1rem;
  width: auto;
  min-width: 3.5rem;
  border: 1px solid ${({ theme }) => theme.bg3};
  outline: none;
  background: transparent;
`;

const Option = styled(FancyButton)<{ active: boolean }>`
  margin-right: 8px;
  background-color: ${({ active, theme }) => active && theme.newTheme.white};
  color: ${({ active, theme }) => (active ? theme.newTheme.black : theme.newTheme.textSecondary)};
  border: 1px solid ${({ active, theme }) => (active ? theme.newTheme.primary1 : theme.newTheme.border3)};

  :hover {
    cursor: pointer;
    border: 1px solid ${({ active, theme }) => (active ? darken(0.1, theme.newTheme.primary1) : theme.newTheme.border4)};
  }
`;

const Input = styled.input`
  background: ${({ theme }) => theme.bg1};
  font-size: 16px;
  width: auto;
  outline: none;
  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
  }
  color: ${({ theme, color }) => (color === 'red' ? theme.red1 : theme.text1)};
  text-align: right;
`;

const OptionCustom = styled(FancyButton)<{ active?: boolean; warning?: boolean }>`
  height: 2rem;
  position: relative;
  padding: 0 0.75rem;
  flex: 1;
  border: ${({ theme, active, warning }) =>
    active && `1px solid ${warning ? theme.newTheme.error : theme.newTheme.primary1}`};

  :hover {
    border: ${({ theme, active, warning }) =>
      active
        ? `1px solid ${warning ? darken(0.1, theme.newTheme.error) : darken(0.1, theme.newTheme.primary1)}`
        : `1px solid ${theme.newTheme.border4}`};
  }

  input {
    width: 100%;
    height: 100%;
    border: 0;
    border-radius: 2rem;
  }
`;

const SlippageEmojiContainer = styled.span`
  color: #f3841e;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    display: none;  
  `}
`;

const TextRow = styled.div`
  display: flex;
  align-items: center;
`;

const OptionsWrapper = styled(RowBetween)`
  margin-top: 18px;
`;

export interface SlippageTabsProps {
  rawSlippage: number;
  setRawSlippage: (rawSlippage: number) => void;
}

export default function SlippageTabs({ rawSlippage, setRawSlippage }: SlippageTabsProps) {
  const inputRef = useRef<HTMLInputElement>();

  const [slippageInput, setSlippageInput] = useState('');

  const slippageInputIsValid =
    slippageInput === '' || (rawSlippage / 100).toFixed(2) === Number.parseFloat(slippageInput).toFixed(2);

  let slippageError: SlippageError | undefined;
  if (slippageInput !== '' && !slippageInputIsValid) {
    slippageError = SlippageError.InvalidInput;
  } else if (slippageInputIsValid && rawSlippage < 50) {
    slippageError = SlippageError.RiskyLow;
  } else if (slippageInputIsValid && rawSlippage > 500) {
    slippageError = SlippageError.RiskyHigh;
  } else {
    slippageError = undefined;
  }

  function parseCustomSlippage(value: string) {
    setSlippageInput(value);

    try {
      const valueAsIntFromRoundedFloat = Number.parseInt((Number.parseFloat(value) * 100).toString());
      if (!Number.isNaN(valueAsIntFromRoundedFloat) && valueAsIntFromRoundedFloat < 5000) {
        setRawSlippage(valueAsIntFromRoundedFloat);
      }
    } catch {}
  }

  return (
    <AutoColumn gap="md">
      <AutoColumn gap="sm">
        <TextRow>
          <TEXT.default fontWeight={500} fontSize={12} color="textSecondary">
            Slippage tolerance
          </TEXT.default>
          <div style={{ marginTop: 2 }}>
            <QuestionHelper text="Your transaction will revert if the price changes unfavorably by more than this percentage." />
          </div>
        </TextRow>
        <OptionsWrapper>
          <Option
            onClick={() => {
              setSlippageInput('');
              setRawSlippage(10);
            }}
            active={rawSlippage === 10}
          >
            0.1%
          </Option>
          <Option
            onClick={() => {
              setSlippageInput('');
              setRawSlippage(50);
            }}
            active={rawSlippage === 50}
          >
            0.5%
          </Option>
          <Option
            onClick={() => {
              setSlippageInput('');
              setRawSlippage(100);
            }}
            active={rawSlippage === 100}
          >
            1%
          </Option>
          <OptionCustom active={![10, 50, 100].includes(rawSlippage)} warning={!slippageInputIsValid} tabIndex={-1}>
            <RowBetween>
              {!!slippageInput &&
              (slippageError === SlippageError.RiskyLow || slippageError === SlippageError.RiskyHigh) ? (
                <SlippageEmojiContainer>
                  <span role="img" aria-label="warning">
                    ⚠️
                  </span>
                </SlippageEmojiContainer>
              ) : null}
              {/* https://github.com/DefinitelyTyped/DefinitelyTyped/issues/30451 */}
              <Input
                ref={inputRef as any}
                placeholder={(rawSlippage / 100).toFixed(2)}
                value={slippageInput}
                onBlur={() => {
                  parseCustomSlippage((rawSlippage / 100).toFixed(2));
                }}
                onChange={(e) => parseCustomSlippage(e.target.value)}
                color={!slippageInputIsValid ? 'red' : ''}
              />
            </RowBetween>
          </OptionCustom>
          <span style={{ marginLeft: '4px' }}>%</span>
        </OptionsWrapper>
        {!!slippageError && (
          <RowBetween
            style={{
              paddingTop: '7px',
            }}
          >
            <TEXT.default fontSize={14} color={'red'}>
              {slippageError === SlippageError.InvalidInput
                ? 'Enter a valid slippage percentage'
                : slippageError === SlippageError.RiskyLow
                ? 'Your transaction may fail'
                : 'Your transaction may be frontrun'}
            </TEXT.default>
          </RowBetween>
        )}
      </AutoColumn>
    </AutoColumn>
  );
}

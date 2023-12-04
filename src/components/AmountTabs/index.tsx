import React, { useState } from 'react';
import styled from 'styled-components';
import { TEXT } from '../../theme';

interface Props {
  onChange: (value: number) => void;
}
interface TabProps {
  value: number;
  onClick: (value: number) => void;
  current: number;
}

const StyledTab = styled.button<{ isActive: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 25%;
  padding: 10px 0;
  outline: none;
  border: none;
  cursor: pointer;
  text-decoration: none;
  border-radius: 5px;
  color: ${({ theme, isActive }) => (isActive ? theme.newTheme.white : theme.newTheme.text1)};
  background-color: ${({ theme, isActive }) => (isActive ? theme.newTheme.primary1 : 'transparent')};
`;

const TabsWrapper = styled.div`
  position: relative;
  display: flex;
  max-width: 436px;
  width: 100%;
  padding: 2px;
  border: 1px solid ${({ theme }) => theme.newTheme.bg2};
  border-radius: 5px;
  background: ${({ theme }) => theme.newTheme.white};

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    width: 90%;
  `}
`;

const tabValues = [25, 50, 75, 100];
export default function AmountTabs({ onChange }: Props) {
  const [current, setCurrent] = useState(25);

  const onClick = (value: number) => {
    onChange(value);
    setCurrent(value);
  };

  return (
    <TabsWrapper>
      {tabValues.map((value) => (
        <Tab value={value} onClick={onClick} current={current} key={value} />
      ))}
    </TabsWrapper>
  );
}
const Tab = ({ current, value, onClick }: TabProps) => {
  const isActive = current === value;
  const changeValue = () => onClick(value);

  return (
    <StyledTab isActive={isActive} onClick={changeValue}>
      <TEXT.default fontWeight={600} fontSize={12}>
        {value}%
      </TEXT.default>
    </StyledTab>
  );
};

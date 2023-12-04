import React from 'react';
import styled from 'styled-components';
import { ExternalLink, TEXT } from '../../theme';
import { darken } from 'polished';

const InfoCard = styled.div`
  outline: none;
  border: none;
  padding: 0;
  background-color: transparent;
  border-radius: 12px;
  cursor: pointer;
  width: 100% !important;
`;

const OptionCard = styled(InfoCard as any)`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
`;

const OptionCardLeft = styled.div`
  ${({ theme }) => theme.flexColumnNoWrap};
  justify-content: center;
  height: 100%;
`;

const OptionCardClickable = styled(OptionCard as any)<{ clickable?: boolean }>`
  margin-top: 0;
  background-color: ${({ theme }) => theme.newTheme.bg2};
  border: none;
  flex-direction: column;
  align-items: flex-start;
  padding: 16px;
  &:hover {
    background-color: ${({ theme }) => darken(0.02, theme.newTheme.bg2)};
  }
`;

const HeaderText = styled.div`
  ${({ theme }) => theme.flexRowNoWrap};
  color: ${(props) => (props.color === 'blue' ? ({ theme }) => theme.primary1 : ({ theme }) => theme.text1)};
  font-size: 1rem;
  font-weight: 500;
`;

const IconWrapper = styled.div<{ size?: number | null }>`
  ${({ theme }) => theme.flexColumnNoWrap};
  width: 40px;
  height: 40px;
  align-items: center;
  justify-content: center;
  background-color: ${({ theme }) => theme.newTheme.white};
  border-radius: 50%;
  & > img,
  span {
    height: ${({ size }) => (size ? size + 'px' : '20px')};
    width: ${({ size }) => (size ? size + 'px' : '20px')};
  }
`;

const DescriptionTextWrapper = styled.div`
  width: 80%;
  margin-top: 12px;
`;

export default function Option({
  link = null,
  size,
  onClick = null,
  color,
  header,
  icon,
  id,
  description,
}: {
  link?: string | null;
  clickable?: boolean;
  size?: number | null;
  onClick?: null | (() => void);
  color: string;
  header: React.ReactNode;
  icon: string;
  active?: boolean;
  id: string;
  description?: string[];
}) {
  const content = (
    <OptionCardClickable id={id} onClick={onClick}>
      <OptionCard>
        <OptionCardLeft>
          <HeaderText color={color}>{header}</HeaderText>
        </OptionCardLeft>
        <IconWrapper size={size}>
          <img src={icon} alt={'Icon'} />
        </IconWrapper>
      </OptionCard>
      <DescriptionTextWrapper>
        {description !== undefined &&
          description.map((value, index) => (
            <TEXT.default
              fontSize={12}
              fontWeight={500}
              color="textSecondary"
              textAlign="left"
              key={index}
              marginTop={index !== 0 ? '8px' : ''}
            >
              {value}
            </TEXT.default>
          ))}
      </DescriptionTextWrapper>
    </OptionCardClickable>
  );
  if (link) {
    return <ExternalLink href={link}>{content}</ExternalLink>;
  }

  return content;
}

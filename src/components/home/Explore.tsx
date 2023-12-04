import React from 'react';
import styled from 'styled-components';
import { TEXT } from '../../theme';
import { AutoColumn } from '../Column';
import { StyledHomePageLink } from './styled';

const Wrapper = styled.div`
  width: 100%;
  margin-top: 294px;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const ButtonSection = styled.div`
  display: flex;
  justify-content: center;
`;

const InfoSection = styled.div`
  display: flex;
  flex-wrap: wrap;
`;

const InfoItem = styled.div`
  width: 205px;
  margin-left: 15px;
  margin-top: 15px;
  padding: 24px 32px 32px;
  background-color: ${({ theme }) => theme.newTheme.bg8};
`;

const TextSection = styled(AutoColumn)`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const renderInfo: { title: string; percentage: string }[] = [
  { title: 'CFNC-USDT', percentage: '4.552.383%' },
  { title: 'CFNC-ETH', percentage: '2.956.383%' },
  { title: 'CFNC-BTC', percentage: '0.022.383%' },
  { title: 'DAI-USDT', percentage: '4.552.383%' },
  { title: 'DIVI-USDT', percentage: '4.552.383%' },
];

export default function Explore() {
  return (
    <Wrapper>
      <AutoColumn gap="45px">
        <TextSection gap="25px">
          <TEXT.primary fontSize={65} fontWeight={700} lineHeight="78px" maxWidth="670px" textAlign="center">
            Earn passive income with crypto
          </TEXT.primary>
          <TEXT.primary fontSize={16} fontWeight={500} textAlign="center">
            Chief Finance make it easy to make your crypto work for you.
          </TEXT.primary>
        </TextSection>
        <InfoSection>
          {renderInfo.map(({ title, percentage }) => (
            <InfoBlock key={title} title={title} percentage={percentage} />
          ))}
        </InfoSection>
        <ButtonSection>
          <StyledHomePageLink to="/pool">Explore</StyledHomePageLink>
        </ButtonSection>
      </AutoColumn>
    </Wrapper>
  );
}

interface Props {
  title: string;
  percentage: string;
}

const InfoBlock = ({ title, percentage }: Props) => {
  return (
    <InfoItem>
      <AutoColumn gap="10px">
        <TEXT.default fontWeight={600} fontSize={16} color="primary1">
          {title}
        </TEXT.default>
        <TEXT.text4 fontWeight={500} fontSize={28}>
          {percentage}
        </TEXT.text4>
        <TEXT.secondary fontWeight={600} fontSize={16}>
          APR
        </TEXT.secondary>
      </AutoColumn>
    </InfoItem>
  );
};

import React from 'react';
import styled from 'styled-components';
import { TEXT } from '../../theme';
import { AutoColumn } from '../Column';
import { StyledHomePageLink } from './styled';
import { CFC_TOKEN_ADDRESS } from '../../constants';

const Wrapper = styled.div`
  width: 100%;
  margin-top: 197px;
  display: flex;
  justify-content: center;
`;

const BodyWrapper = styled(AutoColumn)`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

export default function StartInSeconds() {
  return (
    <Wrapper>
      <BodyWrapper gap="25px">
        <TEXT.primary fontSize={65} fontWeight={700}>
          Start in seconds
        </TEXT.primary>
        <div>
          <TEXT.primary fontSize={16} fontWeight={500} lineHeight="27.2px">
            Connect your crypto wallet to start using in seconds.{' '}
          </TEXT.primary>
          <TEXT.default
            fontSize={16}
            fontWeight={600}
            color="black"
            opacity={0.8}
            textAlign="center"
            lineHeight="27.2px"
          >
            No registration needed.
          </TEXT.default>
        </div>

        <StyledHomePageLink to={`/swap?inputCurrency=ETH&outputCurrency=${CFC_TOKEN_ADDRESS}`}>
          Buy CFNC
        </StyledHomePageLink>
      </BodyWrapper>
    </Wrapper>
  );
}

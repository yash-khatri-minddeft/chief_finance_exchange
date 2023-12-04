import React from 'react';
import styled from 'styled-components';
import { TEXT } from '../../theme';
import { GraphComponent } from './GraphComponent';
import TokensIcon from '../../assets/svg-bid/tokens-row.svg';
import { useHistory } from 'react-router';

const Wrapper = styled.div`
  width: 100%;
  margin-top: 144px;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const GraphSection = styled.div`
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  max-width: 1000px;
`;

const Bottom = styled.div`
  width: 100%;
  margin-top: 20px;
  display: flex;
  justify-content: center;
  padding: 10px;
`;

const BottomSection = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  max-width: 627px;
  border-radius: 45px;
  padding: 10px 0;
  margin-left: 15px;
  cursor: pointer;
  background-color: ${({ theme }) => theme.newTheme.bg8}};
`;

export default function PopularPairs() {
  const history = useHistory();
  const navigateToSwap = () => history.push('/swap');
  return (
    <Wrapper>
      <div>
        <TEXT.default fontWeight={600} fontSize={25} color="black" textAlign="center">
          Popular exchange pairs
        </TEXT.default>
      </div>
      <GraphSection>
        <GraphComponent currency1="USDC" currency2="ETH" />
        <GraphComponent currency1="WBTC" currency2="ETH" />
        <GraphComponent currency1="DAI" currency2="USDC" />
        <GraphComponent currency1="USDT" currency2="ETH" />
        <GraphComponent currency1="USDC" currency2="USDT" />
      </GraphSection>
      <Bottom>
        <BottomSection onClick={navigateToSwap}>
          <div>
            <img src={TokensIcon} alt="tokens" />
          </div>
          <div style={{ marginLeft: '10px' }}>
            <TEXT.text4 fontWeight={600} fontSize={14} lineHeight="24px">
              Explore multiple other assets
            </TEXT.text4>
            <TEXT.text4 fontWeight={400} fontSize={12} lineHeight="24px" opacity={0.7}>
              New assets are specially selected and added regularly.
            </TEXT.text4>
          </div>
        </BottomSection>
      </Bottom>
    </Wrapper>
  );
}

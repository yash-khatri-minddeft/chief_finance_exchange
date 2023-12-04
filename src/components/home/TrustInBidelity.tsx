import React from 'react';
import styled from 'styled-components';
import { TEXT } from '../../theme';
import LogoIcon from '../../assets/Pngs/logo-white.png';
import { StyledHomePageLink } from './styled';
import { CFC_TOKEN_ADDRESS } from '../../constants';

const Wrapper = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;
  margin-top: 165px;
`;

const BodyWrapper = styled.div`
  width: 100%;
  max-width: 948px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const LeftSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  max-width: 500px;
`;

const RightSection = styled.div`
  width: 300px;
  height: 300px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${({ theme }) => theme.newTheme.primary1};

  img {
    width: 210px;
  }
`;

const StyledExternalLink = styled.a`
  text-decoration: none;
  font-weight: 600;
  font-size: 18px;
  color: ${({ theme }) => theme.newTheme.primary1};
  cursor: pointer;
`;

const Spacing = styled.div<{ marginTop?: string; marginLeft?: string }>`
  margin-top: ${({ marginTop }) => !!marginTop && marginTop};
  margin-left: ${({ marginLeft }) => !!marginLeft && marginLeft};
`;

const LinksWapper = styled.div`
  display: flex;
  align-items: center;
`;

export default function TrustInBidelity() {
  return (
    <Wrapper>
      <BodyWrapper>
        <LeftSection>
          <Spacing marginTop="25px">
            <TEXT.primary fontWeight={700} fontSize={65}>
              Trust in Chief Finance
            </TEXT.primary>
          </Spacing>
          <Spacing marginTop="10px">
            <TEXT.primary fontWeight={500} fontSize={16} lineHeight="170%">
              With its innovative features and unparalleled security measures, Chief Finance is the ultimate choice for
              anyone seeking a reliable and efficient cryptocurrency.
            </TEXT.primary>
          </Spacing>
          <Spacing marginTop="35px">
            <LinksWapper>
              <StyledHomePageLink to={`/swap?inputCurrency=ETH&outputCurrency=${CFC_TOKEN_ADDRESS}`}>
                Buy CFNC
              </StyledHomePageLink>
              <Spacing marginLeft="45px">
                <StyledExternalLink href={`https://goerli.etherscan.io/token/${CFC_TOKEN_ADDRESS}`} target="_blank">
                  Learn
                </StyledExternalLink>
              </Spacing>
            </LinksWapper>
          </Spacing>
        </LeftSection>
        <RightSection>
          <img src={LogoIcon} alt="logo" />
        </RightSection>
      </BodyWrapper>
    </Wrapper>
  );
}

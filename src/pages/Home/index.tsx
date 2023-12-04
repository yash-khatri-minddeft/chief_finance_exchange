import React from 'react';
import styled from 'styled-components';
import StartInSeconds from '../../components/home/StartInSeconds';
import Footer from '../../components/Footer';
import Header from '../../components/Header';
import Explore from '../../components/home/Explore';
import TrustInBidelity from '../../components/home/TrustInBidelity';
import SwapSection from '../../components/home/SwapSection';
import PopularPairs from '../../components/home/PopularPairs';

const PageWrapper = styled.div`
  width: 100vw;
  display: flex;
  flex-direction: column;
`;

const PageBody = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  width: 100%;
  padding: 0 134px 355px;
  background-color: ${({ theme }) => theme.newTheme.white};
`;

const HeaderWrapper = styled.div`
  ${({ theme }) => theme.flexRowNoWrap}
  width: 100%;
  justify-content: space-between;
`;

export default function Home() {
  return (
    <PageWrapper>
      <HeaderWrapper>
        <Header showTop={true} isHome={true} />
      </HeaderWrapper>
      <PageBody>
        <SwapSection />
        <PopularPairs />
        <TrustInBidelity />
        <StartInSeconds />
        <Explore />
      </PageBody>
      <Footer />
    </PageWrapper>
  );
}

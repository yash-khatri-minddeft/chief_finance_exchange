import React from 'react';
import styled from 'styled-components';

export const BodyWrapper = styled.div<{ maxHeight: number }>`
  position: relative;
  max-width: 436px;
  max-height: ${({ maxHeight }) => maxHeight + 'px' || '606px'};
  width: 100%;
  padding: 24px;
  border-radius: 20px;
  background: ${({ theme }) => theme.newTheme.white};

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    width: 90%;
  `}
`;

export const PageWrap = styled.div`
  min-height: calc(100vh - 338px);
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 60px;
`;

export default function AppBody({ children, maxHeight = 606 }: { children: React.ReactNode; maxHeight?: number }) {
  return <BodyWrapper maxHeight={maxHeight}>{children}</BodyWrapper>;
}

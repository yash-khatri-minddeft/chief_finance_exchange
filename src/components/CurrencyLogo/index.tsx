import { Currency, ETHER, Token } from '@bidelity/sdk';
import React, { useMemo } from 'react';
import styled from 'styled-components';

import { getAddress } from 'ethers/lib/utils';
import EthereumLogo from '../../assets/images/ethereum-logo.png';
import BidelityLogo from '../../assets/Pngs/logo-green.png';
import { TOKENS } from '../../constants/tokens';
import useHttpLocations from '../../hooks/useHttpLocations';
import { WrappedTokenInfo } from '../../state/lists/hooks';
import Logo from '../Logo';

const getTokenLogoURL = (address: string) =>
  `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/${address}/logo.png`;

const StyledEthereumLogo = styled.img<{ size: string }>`
  width: ${({ size }) => size};
  height: ${({ size }) => size};
  box-shadow: 0px 6px 10px rgba(0, 0, 0, 0.075);
  border-radius: 24px;
`;

const StyledLogo = styled(Logo)<{ size: string }>`
  width: ${({ size }) => size};
  height: ${({ size }) => size};
  border-radius: ${({ size }) => size};
  box-shadow: 0px 6px 10px rgba(0, 0, 0, 0.075);
  background-color: ${({ theme }) => theme.white};
`;

export default function CurrencyLogo({
  currency,
  size = '24px',
  style,
  address,
}: {
  currency?: Currency;
  size?: string;
  style?: React.CSSProperties;
  address?: string;
}) {
  const uriLocations = useHttpLocations(currency instanceof WrappedTokenInfo ? currency.logoURI : undefined);

  const token = TOKENS.find((t) => t.symbol === currency?.symbol);
  const srcs: string[] = useMemo(() => {
    if (currency === ETHER) return [];

    if (currency instanceof Token) {
      if (currency instanceof WrappedTokenInfo) {
        return [...uriLocations, getTokenLogoURL(currency.address)];
      }

      return [getTokenLogoURL(currency.address)];
    }
    if (address) {
      return [getTokenLogoURL(getAddress(address))];
    }
    return [];
  }, [currency, uriLocations, address]);

  if (currency?.symbol === 'BDLTY' || currency?.symbol === 'CFNC') {
    return <StyledEthereumLogo src={BidelityLogo} size={size} style={style} />;
  }

  if (currency === ETHER) {
    return <StyledEthereumLogo src={EthereumLogo} size={size} style={style} />;
  }

  if (token) {
    return <StyledLogo size={size} srcs={[token.logoURI]} alt={`${currency?.symbol ?? 'token'} logo`} style={style} />;
  }

  return <StyledLogo size={size} srcs={srcs} alt={`${currency?.symbol ?? 'token'} logo`} style={style} />;
}

import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { TEXT } from '../../theme';
import axios from 'axios';

interface TokenProps {
  name: string;
  price: number;
  change: number;
  borderRight: boolean;
}

interface TokenPrices {
  [key: string]: {
    usd: number;
    usd_24h_change: number;
  };
}

const Wrapper = styled.div`
  width: 100%;
  display: flex;
  justify-content: space-between;
`;

const TokenItemWrapper = styled.div<{ borderRight: string }>`
  padding: 0 10px;
  display: flex;
  border-left: 0.5px solid ${({ theme }) => theme.newTheme.white};
  border-right: ${({ theme, borderRight }) => (borderRight === 'true' ? `0.5px solid ${theme.newTheme.white}` : '')}};
`;

const PriceItem = styled.div`
  margin-left: 5px;
`;

const tokens =
  'ethereum,wrapped-bitcoin,usd-coin,shiba-inu,tether,coinbase-wrapped-staked-eth,matic-network,uniswap,dai,binance-usd,hex,yearn-finance,quant-network,gnosis,maker';

const url = `https://api.coingecko.com/api/v3/simple/price?ids=${tokens}&vs_currencies=usd&include_24hr_change=true`;

const TOKEN_NAMES = {
  ethereum: 'ETH',
  'wrapped-bitcoin': 'WBTC',
  'usd-coin': 'USDC',
  'shiba-inu': 'SHIB',
  tether: 'USDT',
  'coinbase-wrapped-staked-eth': 'WETH',
  'matic-network': 'MATIC',
  uniswap: 'UNI',
  dai: 'DAI',
  'binance-usd': 'BUSD',
  hex: 'HEX',
  'yearn-finance': 'YFI',
  'quant-network': 'QNT',
  gnosis: 'GNO',
  maker: 'MKR',
};

type TockensIds =
  | 'ethereum'
  | 'wrapped-bitcoin'
  | 'usd-coin'
  | 'shiba-inu'
  | 'tether'
  | 'coinbase-wrapped-staked-eth'
  | 'matic-network'
  | 'uniswap'
  | 'dai'
  | 'binance-usd'
  | 'hex'
  | 'yearn-finance'
  | 'quant-network'
  | 'gnosis'
  | 'maker';

export default function PricesRow() {
  const [tokensPrices, setTokenPrices] = useState<TokenPrices | null>(null);

  let keys: TockensIds[] = [];
  const fetchPrices = async () => {
    const { data } = await axios.get<TokenPrices>(url);
    setTokenPrices(data);
  };

  useEffect(() => {
    fetchPrices();
  }, []);

  if (tokensPrices) {
    keys = Object.keys(tokensPrices) as TockensIds[];
  }

  return (
    <Wrapper>
      {tokensPrices !== null &&
        keys.length !== 0 &&
        keys.map((key, index) => (
          <TokenItem
            key={key}
            name={TOKEN_NAMES[key]}
            price={tokensPrices[key].usd}
            change={tokensPrices[key].usd_24h_change}
            borderRight={index === keys.length - 1}
          />
        ))}
    </Wrapper>
  );
}

const TokenItem = ({ name, price, change, borderRight }: TokenProps) => {
  const isRed = change.toString().includes('-');

  return (
    <TokenItemWrapper borderRight={String(borderRight)}>
      <TEXT.default color="white" fontWeight={600} fontSize={12}>
        {name}
      </TEXT.default>
      <PriceItem>
        <TEXT.default fontWeight={600} fontSize={12} color={isRed ? 'error' : 'primary1'}>
          ${price}
        </TEXT.default>
      </PriceItem>
    </TokenItemWrapper>
  );
};

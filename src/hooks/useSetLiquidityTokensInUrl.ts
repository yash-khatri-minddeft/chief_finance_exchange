import { useEffect } from 'react';

export default function useSetLiquidityTokensInUrl(
  currencyIdA: string | undefined,
  currencyIdB: string | undefined,
  usdtAddress: string,
  history: any
) {
  useEffect(() => {
    const noCurrencyAId = currencyIdA === undefined || currencyIdA === 'undefined';
    const noCurrencyBId = currencyIdB === undefined || currencyIdB === 'undefined';
    const onlyAIdExists = currencyIdA && currencyIdA !== 'undefined' && noCurrencyBId;
    const onlyBIdExists = currencyIdB && currencyIdB !== 'undefined' && noCurrencyAId;

    if (noCurrencyAId && noCurrencyBId) {
      history?.push(`/add/${usdtAddress}/ETH`);
    } else if (onlyAIdExists) {
      history?.push(`/add/${currencyIdA}/ETH`);
    } else if (onlyBIdExists) {
      history?.push(`/add/${usdtAddress}/${currencyIdB}`);
    }
  }, []);
}

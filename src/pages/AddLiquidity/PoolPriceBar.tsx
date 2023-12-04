import { Currency, Percent, Price } from '@bidelity/sdk';
import React from 'react';
import { AutoColumn } from '../../components/Column';
import { RowBetween } from '../../components/Row';
import { ONE_BIPS } from '../../constants';
import { Field } from '../../state/mint/actions';
import { TEXT } from '../../theme';

export function PoolPriceBar({
  currencies,
  noLiquidity,
  poolTokenPercentage,
  price,
}: {
  currencies: { [field in Field]?: Currency };
  noLiquidity?: boolean;
  poolTokenPercentage?: Percent;
  price?: Price;
}) {
  return (
    <AutoColumn gap="md" style={{ marginTop: '16px' }}>
      <RowBetween>
        <TEXT.secondary fontWeight={500} fontSize={12}>
          {currencies[Field.CURRENCY_B]?.symbol} per {currencies[Field.CURRENCY_A]?.symbol}
        </TEXT.secondary>
        <TEXT.primary fontWeight={600} fontSize={12}>
          {price?.toSignificant(6) ?? '-'}
        </TEXT.primary>
      </RowBetween>

      <RowBetween>
        <TEXT.secondary fontWeight={500} fontSize={12}>
          {currencies[Field.CURRENCY_A]?.symbol} per {currencies[Field.CURRENCY_B]?.symbol}
        </TEXT.secondary>
        <TEXT.primary fontWeight={600} fontSize={12}>
          {price?.invert()?.toSignificant(6) ?? '-'}
        </TEXT.primary>
      </RowBetween>

      <RowBetween>
        <TEXT.secondary fontWeight={500} fontSize={12}>
          Share of Pool
        </TEXT.secondary>
        <TEXT.primary fontWeight={600} fontSize={12}>
          {noLiquidity && price
            ? '100'
            : (poolTokenPercentage?.lessThan(ONE_BIPS) ? '<0.01' : poolTokenPercentage?.toFixed(2)) ?? '0'}
          %
        </TEXT.primary>
      </RowBetween>
    </AutoColumn>
  );
}

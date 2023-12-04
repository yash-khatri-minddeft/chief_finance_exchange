import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { TEXT } from '../../../theme';
import ArrowRightGrey from '../../../assets/svg-bid/arrow-right-grey.svg';
import CurrencyLogo from '../../CurrencyLogo';
import axios from 'axios';
import { createChart, LineData, Time } from 'lightweight-charts';
import { useCurrency } from '../../../hooks/Tokens';
import { useHistory } from 'react-router';
import { chartOptions, setAreaOptions } from './chart-config';
import { useFindTokenAddress } from '../../../state/swap/hooks';

const Wrapper = styled.div<{ growth: boolean }>`
  width: 300px;
  height: auto;
  padding: 32px;
  background-color: ${({ theme }) => theme.newTheme.bg8};
  border-radius: 20px;
  margin-left: 15px;
  margin-top: 15px;
  cursor: pointer;
`;

const RowItem = styled.div`
  display: flex;
`;

const Spacing = styled.div<{ ml: number }>`
  margin-left: ${({ ml }) => ml && ml + 'px'};
`;

const GraphContainer = styled.div`
  width: 100%;
  height: 80px;
  margin-top: 15px;
`;

interface DataType {
  time: number;
  high: number;
  low: number;
  open: number;
  volumefrom: number;
  volumeto: number;
  close: number;
  conversionType: string;
  conversionSymbol: string;
}

interface Data {
  TimeFrom: number;
  TimeTo: number;
  Aggregated: boolean;
  Data: DataType[];
}

interface Response2 {
  Response: string;
  Message: string;
  HasWarning: boolean;
  Type: number;
  Data: Data;
}

interface Props {
  currency1: string;
  currency2: string;
}

const width = 240;
const height = 80;

export function GraphComponent({ currency1, currency2 }: Props) {
  const container = useRef<HTMLDivElement | null>(null);
  const canFetch = useRef<boolean>(true);
  const chartWasCreated = useRef<boolean>(false);

  const [dailyData, setDailyData] = useState<LineData[]>([]);
  const [currencyPrice, setCurrencyPrice] = useState<number>(0);
  const [hasGrown, setHasGrown] = useState<boolean>(false);

  const address1 = useFindTokenAddress(currency1);
  const address2 = useFindTokenAddress(currency2);

  const addressOrEth1 = currency1 !== 'ETH' ? address1 : 'ETH';
  const addressOrEth2 = currency2 !== 'ETH' ? address2 : 'ETH';

  const currencyA = useCurrency(addressOrEth1);
  const currencyB = useCurrency(addressOrEth2);

  const history = useHistory();

  const fetchDailyData = async () => {
    if (!canFetch.current) {
      return;
    }
    try {
      const { data } = await axios.get<Response2>(
        `https://min-api.cryptocompare.com/data/v2/histoday?fsym=${currency1.toUpperCase()}&tsym=${currency2.toUpperCase()}&limit=20`
      );
      const result: LineData[] = data.Data.Data.map((item) => ({ time: item.time as Time, value: item.open }));
      setDailyData(result);
      canFetch.current = false;
      if (result.length) {
        const isGrowth = result[0].value < result[result.length - 1].value;
        setHasGrown(isGrowth);
      }
    } catch (err) {
      console.debug('Fetch daily data', err);
    }
  };

  const fetchPrice = async () => {
    try {
      const { data } = await axios.get(
        `https://min-api.cryptocompare.com/data/price?fsym=${currency1.toUpperCase()}&tsyms=${currency2.toUpperCase()}`
      );
      setCurrencyPrice(data[currency2]);
    } catch (err) {
      console.debug('Fetch token price for graph', err);
    }
  };

  const navigateToSwap = () => {
    history.push(`/swap?inputCurrency=${addressOrEth1}&outputCurrency=${addressOrEth2}`);
  };

  useEffect(() => {
    fetchDailyData();
    fetchPrice();
  }, []);

  if (!dailyData || dailyData.length === 0) {
    return null;
  }

  if (container.current && !chartWasCreated.current) {
    const chart = createChart(container.current, chartOptions);
    chart.resize(width, height);
    const lineSeries = chart.addAreaSeries(setAreaOptions(hasGrown));
    lineSeries.setData(dailyData);
    chart.timeScale().fitContent();
    chartWasCreated.current = true;
  }

  const growth = ((dailyData[dailyData.length - 1].value - dailyData[0].value) / dailyData[0].value) * 100;

  return (
    <Wrapper growth={hasGrown} onClick={navigateToSwap}>
      <RowItem>
        <CurrencyLogo currency={currencyA ? currencyA : undefined} />
        <Spacing ml={10}>
          <TEXT.text4 fontWeight={700} fontSize={20}>
            {currency1}
          </TEXT.text4>
        </Spacing>
        <Spacing ml={15}>
          <img src={ArrowRightGrey} alt="arrow" />
        </Spacing>
        <Spacing ml={15}>
          <CurrencyLogo currency={currencyB ? currencyB : undefined} />
        </Spacing>
        <Spacing ml={10}>
          <TEXT.text4 fontWeight={700} fontSize={20}>
            {currency2}
          </TEXT.text4>
        </Spacing>
      </RowItem>
      <RowItem>
        <div style={{ marginTop: 6 }}>
          <TEXT.default fontWeight={600} fontSize={12} color="text5">
            1 {currency1} = {currencyPrice} {currency2}
          </TEXT.default>
        </div>
      </RowItem>
      <GraphContainer ref={container}></GraphContainer>
      <RowItem style={{ marginTop: '15px' }}>
        <TEXT.default fontWeight={400} fontSize={12} color={hasGrown ? 'primary1' : '#E63449'}>
          {growth.toFixed(2)}%
        </TEXT.default>
        <TEXT.default fontWeight={400} fontSize={12} color="#707070" marginLeft="4px">
          24-hour statistics
        </TEXT.default>
      </RowItem>
    </Wrapper>
  );
}

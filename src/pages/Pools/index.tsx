import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import FindIcon from '../../assets/svg-bid/search-normal.svg';
import { SearchInput } from '../../components/SearchModal/styleds';
import PoolsList from '../../components/pools/PoolsList';
import { PageWrap } from '../AppBody';
import { apiService } from '../../api/service';

const Wrapper = styled.div`
  position: relative;
  max-width: 436px;
  width: 100%;

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    width: 90%;
  `}
`;

const FlexAlign = styled.div`
  display: flex;
  align-items: center;
`;

const Icon = styled(FlexAlign)`
  justify-content: center;
  cursor: pointer;
  margin-right: 8px;
`;

const CommonInputSection = styled.div`
  display: flex;
  background-color: ${({ theme }) => theme.newTheme.white};
  border: 1px solid ${({ theme }) => theme.newTheme.border3};
  border-radius: 12px;
`;

const InputSection = styled(CommonInputSection)`
  justify-content: center;
  align-items: center;
  width: 100%;
  padding: 10px;
`;

const Input = styled(SearchInput)`
  font-weight: 500;
  font-size: 14px;
`;

export interface HiddenPairsType {
  createdAt: string;
  id: string;
  isHide: boolean;
  token0: string;
  token1: string;
  updatedAt: string;
}

export default function Pools() {
  const [search, setSearch] = useState<string>('');
  const [hiddenPairs, setHiddenPairs] = useState<HiddenPairsType[]>([]);

  // const currencies = usePools();

  // const memoCurrencies = useMemo(() => {
  //   return currencies.filter(
  //     (currency) =>
  //       currency.symbol0?.toLowerCase().includes(search.toLowerCase()) ||
  //       currency.symbol1?.toLowerCase().includes(search.toLowerCase())
  //   );
  // }, [currencies, search]);

  const getPairs = async () => {
    const resp = await apiService.getListOfHiddenPairs();
    if (resp?.data) {
      setHiddenPairs(resp?.data);
    }
  };

  useEffect(() => {
    getPairs();
  }, []);

  return (
    <PageWrap>
      <Wrapper>
        <InputSection>
          <FlexAlign>
            <Icon>
              <img src={FindIcon} alt="find" />
            </Icon>
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              type="text"
              placeholder="Search by Token"
            />
          </FlexAlign>
        </InputSection>
        <PoolsList search={search} hiddenPairs={hiddenPairs} />
      </Wrapper>
    </PageWrap>
  );
}

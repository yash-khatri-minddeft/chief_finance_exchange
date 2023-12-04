import { Currency, ETHER, Token } from '@bidelity/sdk';
import React, { KeyboardEvent, RefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FixedSizeList } from 'react-window';
import { useAllTokens, useToken, useIsUserAddedToken, useFoundOnInactiveList } from '../../hooks/Tokens';
import { TYPE, ButtonText, TEXT } from '../../theme';
import { isAddress } from '../../utils';
import Column from '../Column';
import Row, { RowBetween, RowFixed } from '../Row';
import CurrencyList from './CurrencyList';
import { filterTokens } from './filtering';
import { useTokenComparator } from './sorting';
import { PaddedColumn, SearchInput } from './styleds';
import styled from 'styled-components';
import useToggle from 'hooks/useToggle';
import { useOnClickOutside } from 'hooks/useOnClickOutside';
import useTheme from 'hooks/useTheme';
import ImportRow from './ImportRow';
import { ButtonPrimary } from 'components/Button';
import CloseSvgIcon from '../../assets/svg-bid/close-small.svg';
import SearchIcon from '../../assets/svg-bid/search-normal.svg';
import { apiService } from '../../api/service';

const ContentWrapper = styled(Column)`
  width: 100%;
  position: relative;
`;

const Footer = styled.div`
  position: absolute;
  bottom: 0;
  width: 100%;
  padding: 16px;
  margin-top: 10px;
  background-color: ${({ theme }) => theme.newTheme.white}; ;
`;

const CloseIcon = styled.div`
  position: absolute;
  right: 0;

  &:hover {
    cursor: pointer;
    opacity: 0.5;
  }
`;

const HeaderSection = styled(RowBetween)`
  position: relative;
  justify-content: center;
`;

const SearchSection = styled.div`
  display: flex;
  align-items: center;
  padding: 12px 12px;
  border-radius: 12px;
  border: 1px solid ${({ theme }) => theme.newTheme.border3};
`;

const Icon = styled.img`
  width: 16px;
  height: 16px;
  margin-right: 10px;
`;

interface CurrencySearchProps {
  isOpen: boolean;
  onDismiss: () => void;
  selectedCurrency?: Currency | null;
  onCurrencySelect: (currency: Currency) => void;
  otherSelectedCurrency?: Currency | null;
  showCommonBases?: boolean;
  showManageView: () => void;
  showImportView: () => void;
  setImportToken: (token: Token) => void;
}

interface TokenFromInactiveList {
  address: string;
  createdAt: string;
  decimal: number;
  id: string;
  isActive: boolean;
  name: string;
  symbol: string;
  updatedAt: string;
}

const IRRELEVANT_ID = '05031f15-32f1-402d-9e85-e61028cd864c';

export function CurrencySearch({
  selectedCurrency,
  onCurrencySelect,
  otherSelectedCurrency,
  showCommonBases,
  onDismiss,
  isOpen,
  showManageView,
  showImportView,
  setImportToken,
}: CurrencySearchProps) {
  const theme = useTheme();

  // refs for fixed size lists
  const fixedList = useRef<FixedSizeList>();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [invertSearchOrder] = useState<boolean>(false);

  const [listHeight, setListHeight] = useState<number>(448);

  const [inactiveTokensList, setInactiveTokensList] = useState<TokenFromInactiveList[]>([]);

  const allTokens = useAllTokens();
  // const inactiveTokens: Token[] | undefined = useFoundOnInactiveList(searchQuery)

  // if they input an address, use it
  const searchToken = useToken(searchQuery);
  const searchTokenIsAdded = useIsUserAddedToken(searchToken);

  const showETH: boolean = useMemo(() => {
    const s = searchQuery.toLowerCase().trim();
    return s === '' || s === 'e' || s === 'et' || s === 'eth';
  }, [searchQuery]);

  const tokenComparator = useTokenComparator(invertSearchOrder);

  const filteredTokens: Token[] = useMemo(() => {
    const initiallyFilteredTokens = filterTokens(Object.values(allTokens), searchQuery);
    const inactiveAddressArray: string[] = inactiveTokensList
      .filter((t) => t.id !== IRRELEVANT_ID)
      .map((token) => token.address.toUpperCase());
    return initiallyFilteredTokens.filter((token) => !inactiveAddressArray.includes(token?.address.toUpperCase()));
  }, [allTokens, searchQuery, inactiveTokensList]);

  const filteredSortedTokens: Token[] = useMemo(() => {
    const sorted = filteredTokens.sort(tokenComparator);
    const symbolMatch = searchQuery
      .toLowerCase()
      .split(/\s+/)
      .filter((s) => s.length > 0);

    if (symbolMatch.length > 1) {
      return sorted;
    }

    return [
      // sort any exact symbol matches first
      ...sorted.filter((token) => token.symbol?.toLowerCase() === symbolMatch[0]),

      // sort by tokens whos symbols start with search substrng
      ...sorted.filter(
        (token) =>
          token.symbol?.toLowerCase().startsWith(searchQuery.toLowerCase().trim()) &&
          token.symbol?.toLowerCase() !== symbolMatch[0]
      ),

      // rest that dont match upove
      ...sorted.filter(
        (token) =>
          !token.symbol?.toLowerCase().startsWith(searchQuery.toLowerCase().trim()) &&
          token.symbol?.toLowerCase() !== symbolMatch[0]
      ),
    ];
  }, [filteredTokens, searchQuery, tokenComparator]);

  const handleCurrencySelect = useCallback(
    (currency: Currency) => {
      onCurrencySelect(currency);
      onDismiss();
    },
    [onDismiss, onCurrencySelect]
  );

  const getInactiveTokensList = async () => {
    const response = await apiService.getListOfInactiveTokens();
    setInactiveTokensList(response?.data);
  };

  useEffect(() => {
    getInactiveTokensList();
  }, []);

  // clear the input on open
  useEffect(() => {
    if (isOpen) setSearchQuery('');
  }, [isOpen]);

  // manage focus on modal show
  const inputRef = useRef<HTMLInputElement>();
  const handleInput = useCallback((event) => {
    const input = event.target.value;
    const checksummedInput = isAddress(input);
    setSearchQuery(checksummedInput || input);
    fixedList.current?.scrollTo(0);
  }, []);

  const handleEnter = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        const s = searchQuery.toLowerCase().trim();
        if (s === 'eth') {
          handleCurrencySelect(ETHER);
        } else if (filteredSortedTokens.length > 0) {
          if (
            filteredSortedTokens[0].symbol?.toLowerCase() === searchQuery.trim().toLowerCase() ||
            filteredSortedTokens.length === 1
          ) {
            handleCurrencySelect(filteredSortedTokens[0]);
          }
        }
      }
    },
    [filteredSortedTokens, handleCurrencySelect, searchQuery]
  );

  // menu ui
  const [open, toggle] = useToggle(false);
  const node = useRef<HTMLDivElement>();
  useOnClickOutside(node, open ? toggle : undefined);

  // if no results on main list, show option to expand into inactive
  const [showExpanded, setShowExpanded] = useState(false);
  const inactiveTokens = useFoundOnInactiveList(searchQuery);

  // reset expanded results on query reset
  useEffect(() => {
    if (searchQuery === '') {
      setShowExpanded(false);
    }
  }, [setShowExpanded, searchQuery]);

  const callbackRef = (element: HTMLDivElement) => {
    if (!element) return;

    const modalHeight = element?.getBoundingClientRect().height;

    if (modalHeight >= 576) {
      setListHeight(448);
    } else if (modalHeight >= 513) {
      setListHeight(392);
    } else {
      setListHeight(336);
    }
  };

  return (
    <ContentWrapper ref={callbackRef}>
      <PaddedColumn gap="16px">
        <HeaderSection>
          <TEXT.primary fontWeight={600} fontSize={20}>
            Select a token
          </TEXT.primary>
          <CloseIcon onClick={onDismiss}>
            <img src={CloseSvgIcon} alt="close" />
          </CloseIcon>
        </HeaderSection>
        <SearchSection>
          <Icon src={SearchIcon} alt="search" />
          <SearchInput
            type="text"
            id="token-search-input"
            placeholder="Search by Token"
            autoComplete="off"
            value={searchQuery}
            ref={inputRef as RefObject<HTMLInputElement>}
            onChange={handleInput}
            onKeyDown={handleEnter}
          />
        </SearchSection>
      </PaddedColumn>
      {searchToken && !searchTokenIsAdded ? (
        <Column style={{ padding: '20px 0', height: '100%' }}>
          <ImportRow token={searchToken} showImportView={showImportView} setImportToken={setImportToken} />
        </Column>
      ) : filteredSortedTokens?.length > 0 || (showExpanded && inactiveTokens && inactiveTokens.length > 0) ? (
        <div>
          <CurrencyList
            height={listHeight}
            showETH={showETH}
            currencies={
              showExpanded && inactiveTokens ? filteredSortedTokens.concat(inactiveTokens) : filteredSortedTokens
            }
            onCurrencySelect={handleCurrencySelect}
            otherCurrency={otherSelectedCurrency}
            selectedCurrency={selectedCurrency}
            fixedListRef={fixedList}
            showImportView={showImportView}
            setImportToken={setImportToken}
          />
        </div>
      ) : (
        <Column style={{ padding: '20px 20px 40px', height: `${listHeight}px` }}>
          <TYPE.main color={theme.text3} textAlign="center" mb="20px">
            No results found.
          </TYPE.main>
          {inactiveTokens &&
            inactiveTokens.length > 0 &&
            !(searchToken && !searchTokenIsAdded) &&
            searchQuery.length > 1 &&
            filteredSortedTokens?.length === 0 && (
              // expand button in line with no results
              <Row align="center" width="100%" justify="center">
                <ButtonPrimary
                  width="fit-content"
                  borderRadius="12px"
                  padding="8px 12px"
                  onClick={() => setShowExpanded(!showExpanded)}
                >
                  {!showExpanded
                    ? `Show ${inactiveTokens.length} more inactive ${inactiveTokens.length === 1 ? 'token' : 'tokens'}`
                    : 'Hide expanded search'}
                </ButtonPrimary>
              </Row>
            )}
        </Column>
      )}

      {inactiveTokens &&
        inactiveTokens.length > 0 &&
        !(searchToken && !searchTokenIsAdded) &&
        (searchQuery.length > 1 || showExpanded) &&
        (filteredSortedTokens?.length !== 0 || showExpanded) && (
          // button fixed to bottom
          <Row align="center" width="100%" justify="center" style={{ position: 'absolute', bottom: '80px', left: 0 }}>
            <ButtonPrimary
              width="fit-content"
              borderRadius="12px"
              padding="8px 12px"
              onClick={() => setShowExpanded(!showExpanded)}
            >
              {!showExpanded
                ? `Show ${inactiveTokens.length} more inactive ${inactiveTokens.length === 1 ? 'token' : 'tokens'}`
                : 'Hide expanded search'}
            </ButtonPrimary>
          </Row>
        )}
      <Footer>
        <Row justify="center">
          <ButtonText onClick={showManageView} color={theme.blue1} className="list-token-manage-button">
            <RowFixed>
              <TEXT.default color="primary1" fontSize={14} fontWeight={600}>
                Manage Tokens
              </TEXT.default>
            </RowFixed>
          </ButtonText>
        </Row>
      </Footer>
    </ContentWrapper>
  );
}

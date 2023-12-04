import React, { useRef, RefObject, useCallback, useState } from 'react';
import { TEXT } from 'theme';
import { useToken } from 'hooks/Tokens';
import styled from 'styled-components';
import { Token } from '@bidelity/sdk';
import { isAddress } from 'utils';
import ImportRow from './ImportRow';
import { CurrencyModalView } from './CurrencySearchModal';

const AddTokenSection = styled.div`
  margin-top: 8px;
  border-radius: 14px;
  padding: 8px 6px;
  background-color: ${({ theme }) => theme.newTheme.bg2};
`;

const AddTokenInputSection = styled.div`
  border-radius: 10px;
  padding: 20px 12px;
  background-color: ${({ theme }) => theme.newTheme.white};
`;

const Input = styled.input`
  width: 100%;
  border: none;
  outline: none;
  color: ${({ theme }) => theme.newTheme.blue};
  font-size: 12px;
  font-weight: 600;
  padding: 2px 0;
`;

const SpacingTop = styled.div`
  margin-top: 8px;
`;

export default function ManageTokens({
  setModalView,
  setImportToken,
}: {
  setModalView: (view: CurrencyModalView) => void;
  setImportToken: (token: Token) => void;
}) {
  const [searchQuery, setSearchQuery] = useState<string>('');

  // manage focus on modal show
  const inputRef = useRef<HTMLInputElement>();
  const handleInput = useCallback((event) => {
    const input = event.target.value;
    const checksummedInput = isAddress(input);
    setSearchQuery(checksummedInput || input);
  }, []);

  // if they input an address, use it
  const isAddressSearch = isAddress(searchQuery);
  const searchToken = useToken(searchQuery);

  return (
    <div>
      <TEXT.secondary fontWeight={600} fontSize={10}>
        Add your token address
      </TEXT.secondary>
      <AddTokenSection>
        <AddTokenInputSection>
          <Input
            type="text"
            id="token-search-input"
            placeholder={'0x0000'}
            value={searchQuery}
            autoComplete="off"
            ref={inputRef as RefObject<HTMLInputElement>}
            onChange={handleInput}
          />
        </AddTokenInputSection>
      </AddTokenSection>
      {searchQuery !== '' && !isAddressSearch && (
        <TEXT.default fontSize={12} fontWeight={600} color="error">
          Enter valid token address
        </TEXT.default>
      )}
      {searchToken && (
        <SpacingTop>
          <ImportRow
            token={searchToken}
            showImportView={() => setModalView(CurrencyModalView.importToken)}
            setImportToken={setImportToken}
          />
        </SpacingTop>
      )}
    </div>
  );
}

import React, { useState } from 'react';
import { RowBetween } from 'components/Row';
import { Text } from 'rebass';
import styled from 'styled-components';
import { Token } from '@bidelity/sdk';
import { TokenList } from '@uniswap/token-lists';
import { CurrencyModalView } from './CurrencySearchModal';
import CloseIcon from '../../assets/svg-bid/close-small.svg';
import ArrowLeftIcon from '../../assets/svg-bid/arrow-left-grey.svg';
import PlusIcon from '../../assets/svg-bid/plus.svg';
import { ButtonPrimary } from '../Button';
import { AutoColumn } from '../Column';
import { TEXT } from '../../theme';
import ManageTokens from './ManageTokens';

const Wrapper = styled.div`
  width: 100%;
  position: relative;
  padding: 16px;
`;

const Icon = styled.div`
  display: flex;
  align-items: center;
  cursor: pointer;

  img {
    width: 24px;
    height: 24px;
  }
`;

const Button = styled(ButtonPrimary)`
  padding-top: 9px;
  padding-bottom: 9px;
  border-radius: 10px;
  font-weight: 600;
  font-size: 14px;
`;

export default function Manage({
  onDismiss,
  setModalView,
  setImportToken,
}: {
  onDismiss: () => void;
  setModalView: (view: CurrencyModalView) => void;
  setImportToken: (token: Token) => void;
  setImportList: (list: TokenList) => void;
  setListUrl: (url: string) => void;
}) {
  const [showAddToken, setShowAddToken] = useState(false);

  return (
    <Wrapper>
      <AutoColumn gap="xl">
        <RowBetween style={{ alignItems: 'center' }}>
          <Icon onClick={() => setModalView(CurrencyModalView.search)}>
            <img src={ArrowLeftIcon} alt="back" />
          </Icon>
          <Text fontWeight={500} fontSize={20}>
            Manage
          </Text>
          <Icon onClick={onDismiss}>
            <img src={CloseIcon} alt="close" />
          </Icon>
        </RowBetween>
        {!showAddToken && (
          <Button onClick={() => setShowAddToken(true)}>
            <img src={PlusIcon} alt="close" />
            <TEXT.white marginLeft="8px">Add Your Token</TEXT.white>
          </Button>
        )}
        {showAddToken && <ManageTokens setModalView={setModalView} setImportToken={setImportToken} />}
      </AutoColumn>
    </Wrapper>
  );
}

import React, { useRef, useState } from 'react';

import styled from 'styled-components';
import { useOnClickOutside } from '../../hooks/useOnClickOutside';
import { ApplicationModal } from '../../state/application/actions';
import { useModalOpen, useToggleSettingsMenu } from '../../state/application/hooks';
import { useUserSlippageTolerance } from '../../state/user/hooks';
import { TEXT } from '../../theme';
import { AutoColumn } from '../Column';
import Modal from '../Modal';
import TransactionSettings from '../TransactionSettings';
import SettingsIcon from '../../assets/svg-bid/setting.svg';
import CloseSvgIcon from '../../assets/svg-bid/close-small.svg';
import { ButtonPrimary } from '../Button';

const StyledMenuButton = styled.button`
  display: flex;
  align-items: center;
  position: relative;
  border: none;
  background-color: transparent;
  margin-top: 2px;

  :hover,
  :focus {
    cursor: pointer;
    outline: none;
  }
`;

const StyledMenu = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  border: none;
  text-align: left;
`;

const ButtonsSection = styled.div`
  display: flex;
  align-items: center;
`;

const MenuFlyout = styled.span`
  position: relative;
  width: 100%;
  max-width: 345px;
  background-color: ${({ theme }) => theme.newTheme.white};
  border-radius: 14px;
  display: flex;
  flex-direction: column;
  font-size: 1rem;
  z-index: 100;

  ${({ theme }) => theme.mediaWidth.upToMedium`
    min-width: 18.125rem;
  `};
`;

const CloseIcon = styled.div`
  position: absolute;
  right: 16px;
  top: 20px;

  &:hover {
    cursor: pointer;
    opacity: 0.5;
  }
`;

const HeaderSection = styled.div`
  display: flex;
  justify-content: center;
`;

const ButtonWithColor = styled(ButtonPrimary)`
  width: 50%;
  padding: 10px 0;
  color: ${({ theme }) => theme.newTheme.white};
  border: 1px solid ${({ theme }) => theme.newTheme.primary1};
  border-radius: 14px;
  margin-left: 15px;

  font-size: 14px;
  font-weight: 600;
`;

const ButtonTransparent = styled(ButtonWithColor)`
  color: ${({ theme }) => theme.newTheme.black};
  background-color: transparent;
  border: 1px solid ${({ theme }) => theme.newTheme.border4};
  margin-left: 0;

  :hover,
  :focus {
    background-color: transparent;
    border: 1px solid ${({ theme }) => theme.newTheme.black};
    opacity: 0.6;
  }
`;

export default function SettingsTab() {
  const node = useRef<HTMLDivElement>();
  const open = useModalOpen(ApplicationModal.SETTINGS);
  const toggle = useToggleSettingsMenu();

  const [userSlippageTolerance, setUserslippageTolerance] = useUserSlippageTolerance();

  const [localUserSlippageTolerance, setLocalUserSlippageTolerance] = useState(userSlippageTolerance);

  const [isModalOpen, setIsModalOpen] = useState(false);

  const toggleModal = () => setIsModalOpen((prev) => !prev);

  useOnClickOutside(node, open ? toggle : undefined);

  const onSave = () => {
    setUserslippageTolerance(localUserSlippageTolerance);
    setIsModalOpen(false);
  };

  return (
    <StyledMenu ref={node as any}>
      <StyledMenuButton onClick={toggleModal} id="open-settings-dialog-button">
        <img src={SettingsIcon} width="16px" height="16px" alt="settings" />
      </StyledMenuButton>
      <Modal isOpen={isModalOpen} onDismiss={toggleModal} maxWidth={345}>
        <MenuFlyout>
          <AutoColumn gap="xl" style={{ padding: '16px' }}>
            <HeaderSection>
              <TEXT.default fontWeight={600} fontSize={20} color="textPrimary" lineHeight="150%">
                Settings
              </TEXT.default>
              <CloseIcon onClick={toggleModal}>
                <img src={CloseSvgIcon} alt="close" />
              </CloseIcon>
            </HeaderSection>
            <TEXT.default fontWeight={600} fontSize={14} color="textPrimary">
              Exchange & Liquidity
            </TEXT.default>
            <TransactionSettings
              rawSlippage={localUserSlippageTolerance}
              setRawSlippage={setLocalUserSlippageTolerance}
            />
            <ButtonsSection>
              <ButtonTransparent onClick={toggleModal}>Cancel</ButtonTransparent>
              <ButtonWithColor onClick={onSave}>Save</ButtonWithColor>
            </ButtonsSection>
          </AutoColumn>
        </MenuFlyout>
      </Modal>
    </StyledMenu>
  );
}

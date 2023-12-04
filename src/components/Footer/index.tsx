import React, { useCallback, useState } from 'react';
import styled from 'styled-components';

import { Link } from 'react-router-dom';
import DiscordIcon from '../../assets/svg-bid/discord.svg';
import FacebookIcon from '../../assets/svg-bid/facebook.svg';
import LogoBig from '../../assets/Pngs/logo-white.png';
import TelegramIcon from '../../assets/svg-bid/telegram.svg';
import TwitterIcon from '../../assets/svg-bid/twitter.svg';
import { TEXT } from '../../theme';
import Tooltip from '../Tooltip';
interface SpacedBlockProps {
  marginLeft?: string;
  marginTop?: string;
  marginRight?: string;
  marginBottom?: string;
}

interface IconLinProps {
  text: string;
  url: string;
  icon: typeof FacebookIcon;
}

const FooterFrame = styled.div`
  position: relative;
  width: 100vw;
  display: flex;
  z-index: 2;
  flex-direction: column;
  background-color: ${({ theme }) => theme.newTheme.primary2};
`;

const FooterLinks = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  margin-left: 2.5rem;
`;

const FooterRow = styled.div`
  display: flex;
  align-items: center;
`;

const TopSection = styled.div`
  padding: 40px 8.5rem 1.5rem;
`;

const BottomSection = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1.5rem 0;
  border-top: 1px solid ${({ theme }) => theme.newTheme.border};
`;

const SpacedBlock = styled.div<SpacedBlockProps>`
  margin-left: ${({ marginLeft }) => marginLeft && marginLeft};
  margin-top: ${({ marginTop }) => marginTop && marginTop};
  margin-right: ${({ marginRight }) => marginRight && marginRight};
  margin-bottom: ${({ marginBottom }) => marginBottom && marginBottom};
`;

const Title = styled.a`
  display: flex;
  align-items: center;
  pointer-events: auto;
  justify-self: flex-start;
  margin-right: 12px;
  text-decoration: none;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    justify-self: center;
  `};
  :hover {
    cursor: pointer;
  }
`;

const ExternalLink = styled.a`
  text-decoration: none;
  :hover {
    opacity: 0.7;
  }
`;

const links: IconLinProps[] = [
  // { text: 'Facebook', url: '/', icon: FacebookIcon },
  {
    text: 'Twitter',
    url: 'https://twitter.com/chieffinan82039?s=11&t=bD2REFNYmq5tVkqeo75TMQ',
    icon: TwitterIcon,
  },
  { text: 'Discord', url: 'https://discord.com/invite/Kk4hSNxnjN', icon: DiscordIcon },
  { text: 'Telegram', url: 'https://t.me/+BOy8uCAeY6RhOWJh', icon: TelegramIcon },
];

export default function Footer() {
  return (
    <FooterFrame>
      <TopSection>
        <FooterRow>
          <Title href="/">
            <img width="33px" height="33px" src={LogoBig} alt="logo" />
            <SpacedBlock marginLeft={'8px'}>
              <TEXT.white fontWeight={800} fontSize={14}>
                Chief Finance
              </TEXT.white>
            </SpacedBlock>
          </Title>

          <FooterLinks>
            {links.map(({ text, icon, url }, index) => (
              <SpacedBlock key={text} marginLeft={index !== 0 ? '1rem' : ''}>
                <IconLink text={text} url={url} icon={icon} />
              </SpacedBlock>
            ))}
          </FooterLinks>
        </FooterRow>

        <SpacedBlock marginTop={'32px'}>
          <FooterRow>
            <ExternalLink as={Link} to="/service">
              <TEXT.footerText>Terms of Service</TEXT.footerText>
            </ExternalLink>
            {/*<SpacedBlock marginLeft={'1.5rem'}>*/}
            {/*  <ExternalLink as={Link} to="/privacy">*/}
            {/*    <TEXT.footerText>Privacy Police</TEXT.footerText>*/}
            {/*  </ExternalLink>*/}
            {/*</SpacedBlock>*/}
            <SpacedBlock marginLeft={'1.5rem'}>
              <ExternalLink href="mailto:bidelity@yahoo.com">
                <TEXT.footerText>Support</TEXT.footerText>
              </ExternalLink>
            </SpacedBlock>
            <SpacedBlock marginLeft={'1.5rem'}>
              <ExternalLink as={Link} to="/faq">
                <TEXT.footerText>FAQ</TEXT.footerText>
              </ExternalLink>
            </SpacedBlock>
          </FooterRow>
        </SpacedBlock>
      </TopSection>

      <BottomSection>
        <TEXT.footerTextSmall>© Copyright 2023</TEXT.footerTextSmall>
        <SpacedBlock marginLeft={'0.5rem'} marginRight={'0.5rem'}>
          <TEXT.footerTextSmall>|</TEXT.footerTextSmall>
        </SpacedBlock>
        <TEXT.footerTextSmall>Chief Finance</TEXT.footerTextSmall>
        <SpacedBlock marginLeft={'0.5rem'} marginRight={'0.5rem'}>
          <TEXT.footerTextSmall>|</TEXT.footerTextSmall>
        </SpacedBlock>
        <TEXT.footerTextSmall>All Rights Reserved</TEXT.footerTextSmall>
      </BottomSection>
    </FooterFrame>
  );
}

const IconLink = ({ text, icon, url }: IconLinProps) => {
  const [show, setShow] = useState<boolean>(false);

  const open = useCallback(() => setShow(true), [setShow]);
  const close = useCallback(() => setShow(false), [setShow]);
  return (
    <SpacedBlock>
      <Tooltip show={show} text={text} placement="bottom-start">
        <ExternalLink target="_blank" href={url} onMouseEnter={open} onMouseLeave={close}>
          <img width="34px" height="34px" src={icon} alt={text} />
        </ExternalLink>
      </Tooltip>
    </SpacedBlock>
  );
};

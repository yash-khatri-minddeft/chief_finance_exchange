import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { darken } from 'polished';

export const StyledHomePageLink = styled(Link)`
  text-decoration: none;
  max-width: 166px;
  font-weight: 600;
  font-size: 18px;
  line-height: 150%;
  text-align: center;
  border: none;
  border-radius: 14px;
  outline: none;
  padding: 14px 35px;
  color: ${({ theme }) => theme.newTheme.white};
  background-color: ${({ theme }) => theme.newTheme.primary1};
  cursor: pointer;

  &:hover {
    background-color: ${({ theme }) => darken(0.05, theme.newTheme.primary1)};
  }
`;

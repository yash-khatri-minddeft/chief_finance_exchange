import { Currency, Token } from '@bidelity/sdk';
import { ChainId } from '../constants';
/**
 * Represents an ERC20 token with a unique address and some metadata.
 */
/**
 * Compares two currencies for equality
 */
export declare function currencyEquals(currencyA: Currency, currencyB: Currency): boolean;
export declare const WETH: {
    1: Token;
    3: Token;
    4: Token;
    5: Token;
    42: Token;
};

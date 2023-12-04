import { UnsupportedChainIdError } from '@web3-react/core';
import { isMobile } from 'react-device-detect';
import { NETWORK_CHAIN_ID, REACT_APP_CHAIN_NAME, REACT_APP_NETWORK_URL } from '../connectors';

async function addNetwork() {
  if (!window.ethereum) {
    console.error("Couldn't find wallet");
  }
  // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
  // @ts-ignore
  await window.ethereum?.request({
    method: 'wallet_addEthereumChain',
    params: [
      {
        chainId: '0x' + NETWORK_CHAIN_ID.toString(),
        chainName: REACT_APP_CHAIN_NAME,
        rpcUrls: [REACT_APP_NETWORK_URL],
        nativeCurrency: {
          name: 'ethereum',
          symbol: 'ETH',
          decimals: 18,
        },
      },
    ],
  });
}

export async function switchNetwork() {
  if (!window.ethereum) {
    console.error("Couldn't find wallet");
    isMobile && alert('Change network in your application');
  }
  try {
    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    await window.ethereum?.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: '0x' + NETWORK_CHAIN_ID.toString() }],
    });
  } catch (error) {
    if (error instanceof UnsupportedChainIdError || error.code === 4902 || error.code === -32603) await addNetwork();
    console.error('error while switching networks');
  }
}

import Web3 from 'web3'
import type { Address, Network } from './types'

const EMPTY_ADDRESS: Address = "0x0000000000000000000000000000000000000000"

const web3 = new Web3(
  typeof window !== "undefined"
    ? (
      "ethereum" in window
        // @ts-ignore
        ? window.ethereum
        : "Web3" in window
          // @ts-ignore
          ? window.Web3.currentProvider
          : Web3.givenProvider
    )
    // @todo : Set up local provider when not running in a browser.
    : Web3.givenProvider
)

const getAccount = async (): Promise<Address> => web3.eth.getAccounts().then(accs => accs && accs[0] && accs[0].toLowerCase())

const connect = async (): Promise<Address> =>
  typeof web3.eth.requestAccounts === "function"
    ? web3.eth.requestAccounts().catch(() => ['']).then(accs => accs && accs[0] && accs[0].toLowerCase())
    : getAccount()

// Initial enable.
// connect()

const getNetwork = async (): Promise<Network> => {
  if (!web3 || !web3.currentProvider)
    throw new Error("Web3 is missing.")
  const chainId = await web3.eth.getChainId()
  if (!chainId)
    throw new Error("Web3 network not found.")
  switch (chainId) {
    case 1: return 'mainnet'
    case 2: return 'morden'
    case 3: return 'ropsten'
    case 4: return 'rinkeby'
    case 5: return 'goerli'
    case 42: return 'kovan'
    case 100: return 'xdai'
    case 1337: return 'dev'
    case 5777: return 'truffle'
    case 1001: return 'organigr.am'
    default: return 'private'
  }
}

// @todo : Merge with Network object.
const getNetworkName = (network: Network) => {
  switch (network) {
    case 'rinkeby': return "Rinkeby Ethereum Test Network"
    case 'mainnet': return "Ethereum Main Network"
    case 'morden': return "Morden Ethereum Test Network"
    case 'ropsten': return "Ropsten Ethereum Test Network"
    case 'kovan': return "Kovan Ethereum Test Network"
    case 'goerli': return "Görli Ethereum Test Network"
    case 'organigr.am': return "Organigr.am Network"
    case 'dev': return "Dev Network"
    case 'truffle': return "a local Ethereum Network"
    case 'private': return "a private Ethereum Network"
    default: return "a blockchain"
  }
}

// Inspired by @truffle/contract
// https://github.com/trufflesuite/truffle/blob/c9b9756b91a8f86c821a54d3437bf9e3894c79ec/packages/contract/lib/utils/index.js#L124
const _linkBytecode = async (bytecode: string, links: { library: string, address: Address }[]): Promise<string> => {
  links.forEach(({ library, address }) => {
    const regex = new RegExp(`__${library}_+`, "g")
    bytecode = bytecode.replace(regex, address.replace("0x", ""))
  })
  return bytecode
}

const sign = async (message: string, password: string = ""): Promise<string | null> => {
  const account = await getAccount()
  return account && web3 && web3.eth && web3.eth.personal && web3.eth.personal.sign
    ? web3.eth.personal.sign(message, account, password)
    : null
}

const ecRecover = async (message: string, signature: string): Promise<Address | null> => {
  return web3 && web3.eth && web3.eth.personal && web3.eth.personal.ecRecover
    ? web3.eth.personal.ecRecover(message, signature).then(a => a.toLowerCase())
    : null
}

export {
  Web3,
  web3,
  EMPTY_ADDRESS,
  sign,
  ecRecover,
  connect,
  getAccount,
  getNetwork,
  getNetworkName,
  _linkBytecode
}
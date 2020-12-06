import Web3 from 'web3'

export const web3 = new Web3(
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

export const EMPTY_ADDRESS: Address = "0x0000000000000000000000000000000000000000"

// @ts-ignore
export const enable = async (): Promise<void> => typeof web3 !== "undefined" && typeof web3.currentProvider !== "undefined" && typeof web3.currentProvider === "function" && web3.currentProvider.enable()

// Initial enable.
enable()

export const getAccount = async (): Promise<string> => web3.eth.getAccounts().then(accs => accs && accs[0]).catch(() => "")
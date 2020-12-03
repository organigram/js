import Web3 from 'web3'

// @todo : Use Metamask as provider.

export const web3 = new Web3(Web3.givenProvider)
web3.eth.getAccounts().then(accounts => {
    web3.eth.defaultAccount = accounts[0]
})
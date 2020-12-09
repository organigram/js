import Web3 from 'web3'

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

// @ts-ignore
const enable = async (): Promise<void> =>
    typeof web3 !== "undefined"
    && typeof web3.currentProvider !== "undefined"
    // @ts-ignore
    && typeof web3.currentProvider.enable === "function"
    // @ts-ignore
    && web3.currentProvider.enable()

// Initial enable.
enable()

const EMPTY_ADDRESS: Address = "0x0000000000000000000000000000000000000000"

const getAccount = async (): Promise<Address> => web3.eth.getAccounts().then(accs => accs && accs[0])

const getNetwork = async (): Promise<Network> => {
    if (!web3 || !web3.currentProvider)
        throw new Error("Web3 is missing.")
    // @ts-ignore
    if (typeof web3.currentProvider.networkVersion === "undefined")
        throw new Error("Missing networkVersion web3 API.")
    // @ts-ignore
    switch (web3.currentProvider.networkVersion) {
        case "1":   return 'mainnet'
        case "2":   return 'morden'
        case "3":   return 'ropsten'
        case "4":   return 'rinkeby'
        case "42":  return 'kovan'
        case "1337":return 'dev'
        case "1001":return 'organigr.am'
        default:    return 'private'
    }
}

const getLocalLibraries = async (): Promise<Libraries> => {
    if (typeof window === "undefined" || !window.localStorage)
        throw new Error("Cannot query local libraries outside a browser.")
    let libraries:any = await window.localStorage.getItem('organigram-libraries')
    libraries = JSON.parse(libraries) || libraries
    return !libraries
        ? { organ: [], procedure: [], voteProposition: [] }
        : {
            organ: libraries.organ.map((l:any) => ({ network: l.network || "", address: l.address || "" })),
            procedure: libraries.procedure.map((l:any) => ({ network: l.network || "", address: l.address || "" })),
            voteProposition: libraries.voteProposition.map((l:any) => ({ network: l.network || "", address: l.address || "" })),
        }
}

const getLibraries = async (network?: Network): Promise<Libraries> => {
    // Default deployed contracts.
    let libraries = {
        organ: [
            { network: 'rinkeby', address: '0x0C80740ce3efB987345c851E6E95508f3f900cD0'}
        ],
        procedure: [
            { network: 'rinkeby', address: '0x3749f184af336dBBd819E5C4425E1BDB97DeD01a'}
        ],
        voteProposition: [
            { network: 'rinkeby', address: '0x69F246Cfe4D41496CD83C075147Ae3F88A6a7Ff6'}
        ]
    }
    // Merge with local libraries.
    const localLibraries = await getLocalLibraries()
    libraries = {
        organ: [...libraries.organ, ...localLibraries.organ],
        procedure: [...libraries.procedure, ...localLibraries.procedure],
        voteProposition: [...libraries.voteProposition, ...localLibraries.voteProposition],
    }
    // Eventually filter on network.
    return !network
        ? libraries
        : {
            organ: libraries.organ.filter(l => l.network === network),
            procedure: libraries.procedure.filter(l => l.network === network),
            voteProposition: libraries.voteProposition.filter(l => l.network === network)
        }
}

const _saveLocalLibrary = async (key: LibraryKey, network: Network, address: Address): Promise<Libraries> => {
    if (typeof window === "undefined" || !window.localStorage)
        throw new Error("Cannot query local libraries outside a browser.")
    let libraries = await getLocalLibraries()
    if (libraries[key].find((l:any) => l.network === network))
        libraries[key].map((l:any) => l.network === network ? { ...l, address } : l)
    else
        libraries[key].push({ network, address })
    window.localStorage.setItem('organigram-libraries', JSON.stringify(libraries))
    return libraries
}

const getLibraryArtefact = async (key: string): Promise<any> => {
    switch (key) {
        case 'organ': 
            return import('@organigram/contracts/build/contracts/OrganLibrary.json')
        case 'procedure': 
            return import('@organigram/contracts/build/contracts/ProcedureLibrary.json')
        case 'voteProposition': 
            return import('@organigram/contracts/build/contracts/VotePropositionLibrary.json')
        default :
            throw new Error("Wrong library key.")
    }
}

const deployMissingLibraries = async (): Promise<Libraries> => {
    if (!web3)
        throw new Error("Web3 is missing.")
    const network:Network = await getNetwork()
    const from = await getAccount()
    let libraries: Libraries = await getLibraries(network)
    const keys: LibraryKey[] = ["organ", "procedure", "voteProposition"]
    for await (var key of keys) {
        console.log("Deploying", key)
        if (!libraries[key].find(l => l.network === network && !!l.address)) {
            // If library not found, deploy it.
            const libraryArtefact = await getLibraryArtefact(key)
            const libraryContract = new web3.eth.Contract(libraryArtefact.abi)
            console.log("libraryContract", libraryContract)
            const libraryInstance = await libraryContract.deploy({ data: libraryArtefact.bytecode })
            .send({ from })
            .catch(error => {
                console.error("Error while deploying missing library.", key, error.message)
            })
            if (libraryInstance && libraryInstance.options && libraryInstance.options.address) {
                // Save deployment info for re-use.
                await _saveLocalLibrary(key, network, libraryInstance.options.address)
                .then(console.log)
            }
        }
    }
    return await getLibraries(network).then(data => { console.info(data); return data })
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

const hasLibraries = async (): Promise<boolean> => {
    try {
        const network:Network = await getNetwork()
        const libraries:Libraries = await getLibraries(network)
        const keys:LibraryKey[] = ['organ', 'procedure', 'voteProposition']
        return keys.map(key => {
            const link = libraries[key].find(l => l.network === network && l.address)
            return !!link && !!link.address
        }).reduce((prev, current) => prev && current, true)
    }
    catch (error) {
        return false
    }
}

export {
    web3,
    EMPTY_ADDRESS,
    enable,
    getAccount,
    getNetwork,
    getLocalLibraries,
    getLibraries,
    getLibraryArtefact,
    deployMissingLibraries,
    hasLibraries,
    _saveLocalLibrary,
    _linkBytecode
}
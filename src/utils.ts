import deployedAddresses from '@organigram/protocol/deployments.json'
import sha3 from 'js-sha3'

export { deployedAddresses }

export const EMPTY_ADDRESS = '0x0000000000000000000000000000000000000000'

// Organ permissions granted to procedures
export const PERMISSIONS = {
  ADMIN: 0xffff,
  ALL: 0x07ff,
  ALL_PROCEDURES: 0x0003,
  ALL_ENTRIES: 0x000c,
  ADD_PROCEDURES: 0x0001,
  REMOVE_PROCEDURES: 0x0002,
  ADD_ENTRIES: 0x0004,
  REMOVE_ENTRIES: 0x0008,
  UPDATE_METADATA: 0x0010,
  DEPOSIT_ETHER: 0x0020,
  WITHDRAW_ETHER: 0x0040,
  DEPOSIT_COINS: 0x0080,
  WITHDRAW_COINS: 0x0100,
  DEPOSIT_COLLECTIBLES: 0x0200,
  WITHDRAW_COLLECTIBLES: 0x0400
}

export const getPermissionsSet = (permissions: number): string[] =>
  Object.entries(PERMISSIONS)
    .filter(
      (permission: [string, number]) =>
        (permissions & permission[1]) === permission[1]
    )
    .map((permission: [string, number]) => permission[0])

const PROXY_START = '0x3d602d80600a3d3981f3363d3d373d3d3d363d73'
const PROXY_END = '5af43d82803e903d91602b57fd5bf3'

export function predictDeterministicAddress(
  implementation: string,
  salt: string,
  deployer: string,
  virtualMachine: string = 'EVM'
) {
  const creationCode =
    PROXY_START + removeHexStart(implementation).toLowerCase() + PROXY_END
  const bytecode = keccak256(creationCode)
  const vm = getVM(virtualMachine)

  return toChecksumAddress(
    `0x${keccak256(`0x${[vm, deployer, salt, bytecode].map(removeHexStart).join('')}`).slice(-40)}`
  )
}

function getVM(vm: string | undefined) {
  if (!vm || vm === 'EVM') return 'ff' // Ethereum
  // Note: Disabled for now, checksum address needs to be compatible with Tron
  // if (vm === 'TVM') return '41' // Tron
  throw new Error('Invalid virtual machine code')
}

function keccak256(value: string): string {
  value = removeHexStart(value)
  return sha3.keccak_256(hexToInts(value))
}

function removeHexStart(value: string): string {
  if (value[0] === '0' && value[1] === 'x') return value.slice(2)
  return value
}

function toChecksumAddress(address: string): string {
  if (typeof address !== 'string') {
    throw new Error('Invalid address: ' + address)
  }

  if (!/^(0x)?[0-9a-f]{40}$/i.test(address)) {
    throw new Error('Invalid address: ' + address)
  }

  const addr = removeHexStart(address).toLowerCase()
  const hash = sha3.keccak_256(addr)
  let checksum = '0x'

  for (let i = 0; i < addr.length; i++) {
    // If ith character is 8 to f then make it uppercase
    const shouldUpperCase = parseInt(hash[i], 16) > 7

    checksum += shouldUpperCase ? addr[i].toUpperCase() : addr[i]
  }

  return checksum
}

// function intsToHex(ints: Uint8Array<ArrayBufferLike>): string {
//   let hex = ''
//   for (const int of ints) hex += toHex(int)
//   return hex
// }

function hexToInts(hex: string) {
  const ints = new Uint8Array(hex.length / 2)
  let count = 0

  for (let i = 0; i < ints.length; i++) {
    ints[i] = fromHex(hex.substr(count, 2))
    count += 2
  }

  return ints
}

// function toHex(int: number): string {
//   return ('0' + int.toString(16)).slice(-2)
// }

function fromHex(byte: string): number {
  return parseInt(byte, 16)
}

import Organ from './organ'
import { Key } from './vault'
import type { Address } from './types'
import { ethers } from 'ethers'
declare class Keyserver extends Organ {
    static load (address: Address, signer: ethers.Signer): Promise<Keyserver>
    hasKey (account?: Address | null): Promise<boolean>
    loadKey (account?: Address | null): Promise<Key>
    uploadKey (key: Key, account?: Address | null): Promise<Organ>
}
export default Keyserver

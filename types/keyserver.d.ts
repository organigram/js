import Organ from './organ';
import { Key } from './vault';
import type { Address } from './types';
export default class Keyserver extends Organ {
    static load(address: Address): Promise<Keyserver>;
    hasKey(account?: Address | null): Promise<boolean>;
    loadKey(account?: Address | null): Promise<Key>;
    uploadKey(key: Key, account?: Address | null): Promise<Organ>;
}

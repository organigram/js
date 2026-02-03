import { ethers } from 'ethers'
import NominationProcedureContractABI from '@organigram/protocol/artifacts/contracts/procedures/Nomination.sol/NominationProcedure.json'

import { Procedure, type ProcedureProposal } from '.'
import { TransactionOptions } from '../organigramClient'
import { formatSalt, predictContractAddress } from '../utils'

export class NominationProcedure extends Procedure {
  static INTERFACE = '0xc5f28e49' // nominate() signature.
  contract: ethers.Contract

  // Constructor needs to call Procedure constructor.
  constructor(
    cid: string,
    address: string,
    chainId: string,
    signerOrProvider: ethers.Signer | ethers.Provider,
    metadata: unknown,
    proposers: string,
    moderators: string,
    deciders: string,
    withModeration: boolean,
    forwarder: string,
    proposals: ProcedureProposal[],
    isDeployed: boolean,
    salt?: string
  ) {
    super(
      cid,
      address,
      chainId,
      signerOrProvider,
      metadata,
      proposers,
      moderators,
      deciders,
      withModeration,
      forwarder,
      proposals,
      isDeployed,
      salt
    )
    this.salt = salt || isDeployed ? undefined : formatSalt()
    this.address =
      address ??
      predictContractAddress({
        type: 'NominationProcedure',
        chainId,
        salt: this.salt as string
      })
    this.contract = new ethers.Contract(
      address,
      NominationProcedureContractABI.abi,
      signerOrProvider
    )
  }

  // _populateInitialize() overrides Procedure _populateInitialize.
  static async _populateInitialize(
    type: string,
    options: { signer: ethers.Signer } & TransactionOptions,
    cid: string,
    proposers: string,
    moderators: string,
    deciders: string,
    _withModeration: Boolean,
    forwarder: string,
    ..._args: any[]
  ): Promise<ethers.ContractTransaction> {
    if (options.signer == null) {
      throw new Error('Not connected.')
    }
    const contract = new ethers.Contract(
      type,
      NominationProcedureContractABI.abi,
      options.signer
    )
    return await contract.initialize.populateTransaction(
      cid,
      proposers,
      moderators,
      deciders,
      false,
      forwarder
    )
  }

  static async load(
    address: string,
    signerOrProvider: ethers.Signer | ethers.Provider
  ): Promise<NominationProcedure> {
    const procedure = await Procedure.load(address, signerOrProvider)
    if (!procedure) throw new Error('Not a valid procedure.')
    // const contract = new ethers.Contract(
    //   address,
    //   NominationProcedureContractABI,
    //   signerOrProvider
    // )
    return new NominationProcedure(
      procedure.cid,
      procedure.address,
      procedure.chainId,
      signerOrProvider,
      procedure.metadata,
      procedure.proposers,
      procedure.moderators,
      procedure.deciders,
      procedure.withModeration,
      procedure.forwarder,
      procedure.proposals,
      true,
      procedure.salt
    )
  }

  async nominate(
    proposalKey: string,
    options?: TransactionOptions
  ): Promise<boolean> {
    // @todo Check gasLimit amount
    const tx = await this.contract.nominate(proposalKey, {
      gasLimit: '1000000'
    })
    if (options?.onTransaction != null) {
      options.onTransaction(tx, 'Initialize Nomination procedure.')
    }
    const receipt = await tx.wait()
    return receipt.status === 1
  }
}

import { ethers } from 'ethers'
import NominationProcedureContractABI from '@organigram/protocol/artifacts/contracts/procedures/Nomination.sol/NominationProcedure.json'

import { Procedure, ProcedureInput } from '.'
import { TransactionOptions } from '../organigramClient'

export class NominationProcedure extends Procedure {
  static INTERFACE = '0xc5f28e49' // nominate() signature.
  contract: ethers.Contract

  // Constructor needs to call Procedure constructor.
  constructor({
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
    salt,
    contract,
    sourceOrgans,
    targetOrgans
  }: ProcedureInput & { contract?: ethers.Contract }) {
    super({
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
      salt,
      sourceOrgans,
      targetOrgans
    })
    this.contract =
      contract ??
      new ethers.Contract(
        this.address,
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
    const chainId =
      (await signerOrProvider.provider?.getNetwork().then(n => n.chainId)) ??
      (await (signerOrProvider as ethers.Provider)
        .getNetwork()
        .then(n => n.chainId))
    const contract = new ethers.Contract(
      address,
      NominationProcedureContractABI.abi,
      signerOrProvider
    )
    return new NominationProcedure({
      cid: procedure.cid,
      address: procedure.address,
      chainId: chainId?.toString()!,
      signerOrProvider,
      metadata: procedure.metadata,
      proposers: procedure.proposers,
      moderators: procedure.moderators,
      deciders: procedure.deciders,
      withModeration: procedure.withModeration,
      forwarder: procedure.forwarder,
      proposals: procedure.proposals,
      isDeployed: true,
      salt: procedure.salt,
      contract
    })
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

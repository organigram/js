declare module 'predict-deterministic-address' {
  function predictDeterministicAddress(
    implementation: string,
    salt: string,
    deployer: string,
    virtualMachine?: string
  ): Promise<string>
}

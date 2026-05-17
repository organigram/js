# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.]

## [0.1.3](https://github.com/organigram/organigram/compare/v0.1.2...v0.1.3) (2026-05-04)

- Multi-network tests
- Remove unused dependencies

## [0.1.2](https://github.com/organigram/organigram/compare/v0.1.1...v0.1.2) (2026-04-20)

- New organ capabilities:
    - Verify EIP-712 signatures for gasless transactions
    - executeWhitelisted() to execute arbitrary transaction
- Performance improvements:
    - Reduce RPC chatter with cached signer and client state.
    - switched from ethers to viem
- updated package readmes

## [0.1.1](https://github.com/organigram/organigram/compare/v0.1.0...v0.1.1) (2026-03-15)

- Cache more onchain data to avoid redundant RPC calls.

## [0.1.0](https://github.com/organigram/organigram/compare/v0.0.1...v0.1.0) (2026-03-05)

- Single-transaction deployments
- Deterministic addresses
- Updated packages structure
- Reduced testing time by 90%
- Updated all dependencies
- Reduced overall complexity and bundle size.

## 0.0.1 (2021-08-29)

- JS SDK for organs, procedures, voting, deployments, and file utilities.
- Provide the core helpers consumed by the app and React layer.

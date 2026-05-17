import {
  createFileVersionManifest,
  createPublicFileVersionManifest,
  createScopeEnvelopeCheckpoint,
  createScopeEnvelopeItem,
  computeScopeEnvelopeRoot,
  createScopeEnvelopeSignatureMessage,
  formatCidRef,
  isCidRef,
  parseCidRef
} from '../src/ipfs/scopeEnvelope'
import {
  isEncryptedCidManifest,
  isFileVersionManifest
} from '../src/ipfs/manifest'
import {
  ENCRYPTION_ALGORITHM,
  FILE_VERSION_MANIFEST_KIND
} from '../src/ipfs/constants'

describe('scope envelope helpers', () => {
  it('produces a stable root regardless of item order', async () => {
    const itemA = createScopeEnvelopeItem({
      logicalKey: 'entry:a',
      currentManifestCid: 'bafybeia',
      contentType: 'entry'
    })
    const itemB = createScopeEnvelopeItem({
      logicalKey: 'proposal:b',
      currentManifestCid: 'bafybeib',
      contentType: 'proposal',
      retentionState: 'superseded'
    })

    const rootA = await computeScopeEnvelopeRoot({
      'proposal:b': itemB,
      'entry:a': itemA
    })
    const rootB = await computeScopeEnvelopeRoot({
      'entry:a': itemA,
      'proposal:b': itemB
    })

    expect(rootA).toBe(rootB)
  })

  it('creates a file version manifest that is still recognized as encrypted IPFS data', () => {
    const manifest = createFileVersionManifest({
      contentType: 'entry',
      scopeRef: { scopeType: 'workspace', scopeId: 'workspace-1' },
      logicalKey: 'entry:workspace-1',
      encryptedCid: 'bafybeicid',
      encryptedContentIv: 'iv',
      encryptedContentSize: 123,
      wrappedContentKey: {
        algorithm: ENCRYPTION_ALGORITHM,
        iv: 'wrapped-iv',
        ciphertext: 'wrapped-ciphertext'
      },
      scopeEnvelope: createScopeEnvelopeCheckpoint({
        epoch: 1,
        membershipHash: 'membership-hash',
        rootHash: 'root-hash'
      }),
      signature: 'signature',
      signedByAddress: '0xabc'
    })

    expect(manifest.kind).toBe(FILE_VERSION_MANIFEST_KIND)
    expect(isEncryptedCidManifest(manifest)).toBe(true)
  })

  it('creates a public file version manifest for stable logical content refs', () => {
    const manifest = createPublicFileVersionManifest({
      contentType: 'file',
      scopeRef: { scopeType: 'workspace', scopeId: 'workspace-1' },
      logicalKey: 'file:proposal-1',
      publicCid: 'bafybeipayload',
      publicContentSize: 42,
      mime: 'text/plain',
      name: 'note.txt'
    })

    expect(isFileVersionManifest(manifest)).toBe(true)
    expect(isEncryptedCidManifest(manifest)).toBe(false)
    expect(manifest.publicContent.cid).toBe('bafybeipayload')
  })

  it('formats and parses logical cid refs', () => {
    const cid = formatCidRef(
      { scopeType: 'workspace', scopeId: 'workspace-1' },
      'entry:alpha/file'
    )

    expect(isCidRef(cid)).toBe(true)
    expect(parseCidRef(cid)).toEqual({
      scopeRef: { scopeType: 'workspace', scopeId: 'workspace-1' },
      logicalKey: 'entry:alpha/file'
    })
  })

  it('serializes the scope envelope checkpoint into a deterministic signature message', () => {
    const checkpoint = createScopeEnvelopeCheckpoint({
      epoch: 3,
      membershipHash: 'membership-hash',
      rootHash: 'root-hash'
    })
    const item = createScopeEnvelopeItem({
      logicalKey: 'entry:a',
      currentManifestCid: 'bafybeia',
      contentType: 'entry'
    })

    const message = createScopeEnvelopeSignatureMessage({
      scopeRef: { scopeType: 'workspace', scopeId: 'workspace-1' },
      checkpoint,
      items: { 'entry:a': item },
      previousEnvelopeCid: 'bafybeiprevious'
    })

    expect(message).toContain('scopeType: workspace')
    expect(message).toContain('epoch: 3')
    expect(message).toContain('previousEnvelopeCid: bafybeiprevious')
  })
})

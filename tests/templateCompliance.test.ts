import {
  getTemplate,
} from '../src/template'

describe('commercial template compliance', () => {
  it.each(['sas', 'sasu', 'sa', 'sarl'] as const)('identifies %s and keeps its template version', templateName => {
    const template = getTemplate(templateName, '31337')

    expect(template.organs.length).toBeGreaterThan(0)
    expect(template.procedures.length).toBeGreaterThan(0)
  })

  it.each([
    ['sas', 'Chairman'],
    ['sasu', 'President'],
    ['sa', 'Executive management'],
    ['sarl', 'Managers']
  ] as const)(
    'separates signed minutes from assembly resolutions for %s',
    (templateName, chairName) => {
      const template = getTemplate(templateName, '31337')
      const minutes = template.organs.find(
        organ => organ.name === 'Procès-verbaux d’assemblée générale'
      )!
      const resolutions = template.organs.find(
        organ => organ.name === 'Résolutions de l’assemblée générale'
      )!
      const archiveProcedure = template.procedures.find(
        procedure => procedure.name === 'Archive meeting minutes'
      )!
      const chair = template.organs.find(organ => organ.name === chairName)!

      expect(minutes.name).toBe('Procès-verbaux d’assemblée générale')
      expect(resolutions.name).toBe('Résolutions de l’assemblée générale')
      expect(minutes.permissions).toEqual([
        expect.objectContaining({ permissionAddress: archiveProcedure.address })
      ])
      expect(archiveProcedure.proposers).toBe(chair.address)
      expect(archiveProcedure.deciders).toBe(chair.address)
    }
  )
})

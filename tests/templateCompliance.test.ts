import {
  getTemplate,
} from '../src/template'
import { PERMISSIONS } from '../src/utils'

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
      expect(minutes.permissions).toEqual(expect.arrayContaining([
        expect.objectContaining({ permissionAddress: archiveProcedure.address })
      ]))
      expect(archiveProcedure.proposers).toBe(chair.address)
      expect(archiveProcedure.deciders).toBe(chair.address)
    }
  )

  it.each([
    ['sas', ['Chairman', 'Bylaws', 'Résolutions de l’assemblée générale', 'Procès-verbaux d’assemblée générale', 'Financial statements', 'Payments']],
    ['sasu', ['President', 'Bylaws', 'Résolutions de l’assemblée générale', 'Procès-verbaux d’assemblée générale', 'Financial statements', 'Payments']],
    ['sarl', ['Managers', 'Bylaws', 'Résolutions de l’assemblée générale', 'Procès-verbaux d’assemblée générale', 'Financial statements', 'Payments']]
  ] as const)(
    'gives the constitutional procedure permission to edit every required %s component',
    (templateName, requiredOrganNames) => {
      const template = getTemplate(templateName, '31337')
      const constitutionalProcedure = template.procedures.find(
        procedure => procedure.name === 'Amend bylaws'
      )!

      for (const organName of requiredOrganNames) {
        const permission = template.organs.find(
          organ => organ.name === organName
        )?.permissions?.find(
          candidate =>
            candidate.permissionAddress === constitutionalProcedure.address
        )
        expect(
          (permission?.permissionValue ?? 0) & PERMISSIONS.ALL_PERMISSIONS
        ).toBe(PERMISSIONS.ALL_PERMISSIONS)
      }
    }
  )
})

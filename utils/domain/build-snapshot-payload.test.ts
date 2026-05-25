import { buildSnapshotPayloadOnTemplateSwitch } from './build-snapshot-payload'

const TEMPLATES = [
  { _id: 'tpl-it', name: 'IT' },
  { _id: 'tpl-com', name: 'Комунальні' },
  { _id: 'tpl-school', name: 'Школа' },
]

describe('buildSnapshotPayloadOnTemplateSwitch', () => {
  // Regression: snapshot must describe the OLD template, not the one the user
  // just picked. The Form.Item binding updates form state before our handler
  // runs, so the bug was reading the new templateId out of the form.
  it('writes previous templateId/templateName into payload (not the new one)', () => {
    const payload = buildSnapshotPayloadOnTemplateSwitch({
      previousTemplateId: 'tpl-it',
      templates: TEMPLATES,
      currentGroups: [{ groupName: 'IT-послуги', services: ['s1', 's2'] }],
    })
    expect(payload.templateId).toBe('tpl-it')
    expect(payload.templateName).toBe('IT')
  })

  it('does not leak the destination template name into the snapshot', () => {
    // Simulating: user was on IT, clicks Communal. previous is still IT.
    const payload = buildSnapshotPayloadOnTemplateSwitch({
      previousTemplateId: 'tpl-it',
      templates: TEMPLATES,
      currentGroups: [{ groupName: 'G', services: ['s1'] }],
    })
    expect(payload.templateName).not.toBe('Комунальні')
    expect(payload.templateName).toBe('IT')
  })

  it('returns null name when previous templateId is unknown', () => {
    const payload = buildSnapshotPayloadOnTemplateSwitch({
      previousTemplateId: 'tpl-archived',
      templates: TEMPLATES,
      currentGroups: [{ groupName: 'G', services: [] }],
    })
    expect(payload.templateId).toBe('tpl-archived')
    expect(payload.templateName).toBeNull()
  })

  it('returns nulls when previous templateId is null', () => {
    const payload = buildSnapshotPayloadOnTemplateSwitch({
      previousTemplateId: null,
      templates: TEMPLATES,
      currentGroups: [{ groupName: 'G', services: ['s1'] }],
    })
    expect(payload.templateId).toBeNull()
    expect(payload.templateName).toBeNull()
  })

  it('coerces non-string service ids to strings', () => {
    const payload = buildSnapshotPayloadOnTemplateSwitch({
      previousTemplateId: 'tpl-it',
      templates: TEMPLATES,
      currentGroups: [
        { groupName: 'G', services: [123, 'abc', { toString: () => 'x' }] },
      ],
    })
    expect(payload.groups[0].services).toEqual(['123', 'abc', 'x'])
  })

  it('handles missing groupName/services fields defensively', () => {
    const payload = buildSnapshotPayloadOnTemplateSwitch({
      previousTemplateId: 'tpl-it',
      templates: TEMPLATES,
      currentGroups: [{}, { groupName: 'X' }, { services: ['s1'] }],
    })
    expect(payload.groups).toEqual([
      { groupName: '', services: [] },
      { groupName: 'X', services: [] },
      { groupName: '', services: ['s1'] },
    ])
  })

  it('preserves multiple groups in order', () => {
    const payload = buildSnapshotPayloadOnTemplateSwitch({
      previousTemplateId: 'tpl-school',
      templates: TEMPLATES,
      currentGroups: [
        { groupName: 'A', services: ['s1'] },
        { groupName: 'B', services: ['s2', 's3'] },
        { groupName: 'C', services: [] },
      ],
    })
    expect(payload.groups.map((g) => g.groupName)).toEqual(['A', 'B', 'C'])
    expect(payload.groups[1].services).toEqual(['s2', 's3'])
  })

  it('empty templates list still returns correct templateId, name=null', () => {
    const payload = buildSnapshotPayloadOnTemplateSwitch({
      previousTemplateId: 'tpl-it',
      templates: [],
      currentGroups: [{ groupName: 'G', services: ['s1'] }],
    })
    expect(payload.templateId).toBe('tpl-it')
    expect(payload.templateName).toBeNull()
  })
})

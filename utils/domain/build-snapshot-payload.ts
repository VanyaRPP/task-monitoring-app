export interface ITemplateLite {
  _id: string
  name: string
}

export interface ISnapshotGroupInput {
  groupName?: string
  services?: unknown[]
}

export interface ISnapshotPayload {
  templateId: string | null
  templateName: string | null
  groups: { groupName: string; services: string[] }[]
  disabledServiceIds: string[]
}

export function buildSnapshotPayloadOnTemplateSwitch(args: {
  previousTemplateId: string | null
  templates: ITemplateLite[]
  currentGroups: ISnapshotGroupInput[]
  currentDisabledServiceIds?: unknown[]
}): ISnapshotPayload {
  const {
    previousTemplateId,
    templates,
    currentGroups,
    currentDisabledServiceIds,
  } = args
  const previousTemplate = previousTemplateId
    ? templates.find((t) => t._id === previousTemplateId)
    : undefined
  return {
    templateId: previousTemplateId,
    templateName: previousTemplate?.name ?? null,
    groups: currentGroups.map((g) => ({
      groupName: g.groupName ?? '',
      services: Array.isArray(g.services)
        ? g.services.map((id) => String(id))
        : [],
    })),
    disabledServiceIds: (currentDisabledServiceIds ?? []).map((id) =>
      String(id)
    ),
  }
}

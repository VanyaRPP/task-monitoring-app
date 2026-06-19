interface DescriptionOverrides {
  providerDescription?: string
  receiverDescription?: string
}

/**
 * Merge a custom template's provider/receiver description overrides into the
 * payment data so layout components that read `data.provider.description` /
 * `data.reciever.description` (e.g. classic) reflect the chosen template.
 * Shared by the live preview and the headless/PDF renderer.
 */
export function applyDescriptionOverrides<T extends Record<string, any> | null>(
  data: T,
  descriptionOverrides?: DescriptionOverrides
): T {
  if (!data) return data
  return {
    ...data,
    provider: {
      ...data.provider,
      description:
        descriptionOverrides?.providerDescription !== undefined
          ? descriptionOverrides.providerDescription
          : data?.provider?.description,
    },
    reciever: {
      ...data.reciever,
      description:
        descriptionOverrides?.receiverDescription !== undefined
          ? descriptionOverrides.receiverDescription
          : data?.reciever?.description,
    },
  }
}

import { useGetFeatureFlagByNameQuery } from '@common/api/featureFlagsApi/featureFlag.api'

export const useFeatureFlag = (name: string): boolean => {
  const { data } = useGetFeatureFlagByNameQuery(name)
  return data ?? false
}

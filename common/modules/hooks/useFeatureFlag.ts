import { useGetFeatureFlagsQuery } from '@common/api/featureFlagsApi/featureFlag.api'

export const useFeatureFlag = (name: string): boolean => {
	const {data} = useGetFeatureFlagsQuery()
	return data?.find((flag) => flag.name === name)?.isEnables ?? false

}
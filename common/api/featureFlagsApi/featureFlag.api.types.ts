import { IFeatureFlag } from '@modules/models/FeatureFlag'
export type { IFeatureFlag } from '@modules/models/FeatureFlag'

export interface AllFeatureFlagsQuery {
	success: boolean
	data: IFeatureFlag[]
}

export interface BaseQuery {
	success: boolean
	data: IFeatureFlag
}

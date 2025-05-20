import FeatureFlags from '@modules/models/FeatureFlag'

export default async function handler(req, res) {

  const {
    query: { name },
    method,
  } = req

  if (method !== 'GET') {
    return res
      .status(405)
      .json({ success: false, message: 'Method Not Allowed' })
  }

  try {
    const flag = await FeatureFlags.findOne({ name })
    if (!flag) {
      return res
        .status(404)
        .json({ success: false, message: 'Feature flag not found' })
    }

    return res.status(200).json({ success: true, data: flag })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}

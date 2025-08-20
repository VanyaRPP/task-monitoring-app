import dayjs from 'dayjs'
import 'dayjs/locale/uk'
import localizedFormat from 'dayjs/plugin/localizedFormat'

    dayjs.extend(localizedFormat)
    dayjs.locale('uk')

export default dayjs

import { useFeatureFlag } from '@modules/hooks/useFeatureFlag'
import { BuiltInProviderType } from 'next-auth/providers'
import { LiteralUnion, ClientSafeProvider } from 'next-auth/react'
import { FC } from 'react'
import SignInForm from '@components/Forms/AddSingInForm'
import { SignInButton } from '@components/UI/Buttons'
import { Divider, Typography } from 'antd'
import { GlassCard } from '@components/UI/GlassUI'
import s from './style.module.scss'

type PropsType = {
  providers: Record<
    LiteralUnion<BuiltInProviderType, string>,
    ClientSafeProvider
  > | null
  csrfToken: string | undefined
}

const SignInPage: FC<PropsType> = ({ providers, csrfToken }) => {
  // const { error } = useRouter().query
  // const [customError, setCustomError] = useState('')

  const enabledLoginFormFeather = useFeatureFlag('StagingLogInForm')

  const stg = process.env.NEXT_PUBLIC_ENVIRONMENT === 'staging'

  const shouldShowLoginForm =
    process.env.NODE_ENV === 'development' || enabledLoginFormFeather

  // useEffect(() => {
  //   setCustomError(error && (errors[`${error}`] ?? errors.default))
  // }, [error])

  return (
    <div className={s.pageWrapper}>
      <GlassCard className={s.signInCard}>
        <Typography.Title>Увійти</Typography.Title>
        <Divider />
        {shouldShowLoginForm && <SignInForm csrfToken={csrfToken} />}
        {stg && <SignInForm csrfToken={csrfToken} />}
        <div className={s.Container}>
          {Object.values(providers)?.map((provider: any) => {
            const name = provider?.name
            if (
              (process.env.NODE_ENV === 'development' && name === 'GitHub') ||
              (process.env.NODE_ENV !== 'development' && name === 'Google')
            ) {
              return <SignInButton key={name} provider={provider} />
            }
            return null
          })}
        </div>
      </GlassCard>
    </div>
  )
}

export default SignInPage

import { useFeatureFlag } from '@modules/hooks/useFeatureFlag'
import { BuiltInProviderType } from 'next-auth/providers/index'
import { ClientSafeProvider, LiteralUnion } from 'next-auth/react'
import { FC } from 'react'
import SignInForm from '@components/Forms/AddSingInForm'
import { SignInButton } from '@components/UI/Buttons'
import { GlassCard } from '@components/UI/GlassUI'
import LottieAnimation from '@components/UI/LottieAnimation'
import { isDev, isStaging } from '@utils/env'
import s from './style.module.scss'

type PropsType = {
  providers: Record<
    LiteralUnion<BuiltInProviderType, string>,
    ClientSafeProvider
  > | null
  csrfToken: string | undefined
}

const SignInPage: FC<PropsType> = ({ providers, csrfToken }) => {
  const enabledLoginFormFeather = useFeatureFlag('StagingLogInForm')

  const providerList: ClientSafeProvider[] = providers
    ? Object.values(providers)
    : []
  const hasCredentialsProvider = providerList.some(
    (p) => p.id === 'credentials'
  )
  const oauthProviders = providerList.filter((p) => p.id !== 'credentials')

  const showLoginForm =
    hasCredentialsProvider && (isDev || isStaging || enabledLoginFormFeather)

  return (
    <div className={s.pageWrapper}>
      <LottieAnimation
        src="/animations/WaveForBG.json"
        loop
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: 'auto',
          height: '100%',
          objectFit: 'cover',
          transform: 'rotate(180deg)',
        }}
      />
      <GlassCard className={s.signInCard}>
        {showLoginForm && <SignInForm csrfToken={csrfToken} />}
        <div className={s.Container}>
          {oauthProviders.map((provider) => (
            <SignInButton key={provider.id} provider={provider} />
          ))}
        </div>
      </GlassCard>
    </div>
  )
}

export default SignInPage

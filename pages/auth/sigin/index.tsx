
import { useEffect } from "react"
import { providers, getSession, getProviders } from 'next-auth/react'
import Router from 'next/router'
import { signIn } from "next-auth/react"
import { Button } from "antd"
import SinginBtn from "../../../components/SinginBtn"

const SiginPage = ({ providers, session }) => {

  useEffect(() => {
    if (session) return Router.push('/');
  }, [session])

  if (session) return null;

  return (
    <div>
      {Object.values(providers).map((provider) => (
        <div key={provider?.name}>
          <SinginBtn provider={provider} />
        </div>
      ))}
    </div>
  )
}

export async function getServerSideProps(context) {
  const providers = await getProviders()
  return {
    props: { providers },
  }
}

export default SiginPage

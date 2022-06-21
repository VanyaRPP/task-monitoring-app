import { FC } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import s from './style.module.scss'

interface Props {
  children: React.ReactNode;
  href: string;
}

const NavBarItem: FC<Props> = ({ children, href }) => {
  const router = useRouter();

  return (
    <Link
      href={href}
      className={router.asPath === href ? s.Item : s.ItemActive}>
      {children}
    </Link>
  );
};

export default NavBarItem;

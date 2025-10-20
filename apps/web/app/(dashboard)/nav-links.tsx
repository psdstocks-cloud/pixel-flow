'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export type DashboardNavLink = {
  href: string
  label: string
  soon?: boolean
}

function normalize(path: string) {
  if (path.length > 1 && path.endsWith('/')) {
    return path.slice(0, -1)
  }
  return path
}

export default function DashboardNav({ links }: { links: DashboardNavLink[] }) {
  const pathname = normalize(usePathname())

  return (
    <nav className="dashboard-nav">
      <ul className="dashboard-nav-list">
        {links.map((link) => {
          const normalizedHref = normalize(link.href)
          const isActive = pathname === normalizedHref || pathname.startsWith(`${normalizedHref}/`)
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                className={`dashboard-nav-link${isActive ? ' active' : ''}${link.soon ? ' soon' : ''}`}
                aria-current={isActive ? 'page' : undefined}
              >
                <span>{link.label}</span>
                {link.soon ? <span className="nav-pill">Soon</span> : null}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

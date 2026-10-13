'use client';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {businessMenu,businessPlan,PLAN_DETAILS} from '../../../lib/business-plan';

export function BusinessSidebar({businessName,plan:rawPlan}:{businessName:string;plan:unknown}) {
  const pathname=usePathname();
  const plan=businessPlan(rawPlan);
  const menu=businessMenu(plan);
  const links=<nav aria-label="Menú del negocio">{menu.map(item=><Link key={item.href} href={item.href} aria-current={pathname===item.href?'page':undefined}>{item.label}</Link>)}</nav>;
  return <>
    <aside className="businessSidebar">
      <Link className="businessBrand" href="/panel" aria-label="nival, ir a Inicio"><span className="nivalLogo">nival</span><span className="businessName">{businessName}</span></Link>
      <span className="businessPlanLabel">Plan {PLAN_DETAILS[plan].label}</span>
      {links}
    </aside>
    <details className="mobileBusinessMenu"><summary><span className="nivalLogo">nival</span><span className="mobileBusinessName">{businessName}</span><span className="menuToggle">Menú</span></summary><div className="mobileBusinessMenuContent"><span className="businessPlanLabel">Plan {PLAN_DETAILS[plan].label}</span>{links}</div></details>
  </>;
}

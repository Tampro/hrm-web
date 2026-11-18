import { LogOut } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { NavLink, Outlet, useLocation } from 'react-router'

import { Button } from '~/components/ui/button'
import { Separator } from '~/components/ui/separator'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger
} from '~/components/ui/sidebar'
import { layoutHelper } from '~/helpers/layout.helper'
import { useMeApi } from '~/hooks/apis/use-auth-api'
import { useLogout } from '~/hooks/use-auth'
import { ROUTES } from '~/shared/constants/routes.constant'

export default function DashboardLayout() {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const { data: me } = useMeApi()
  const { mutate: logout, isPending } = useLogout()
  const items = layoutHelper.getSidebarItems(t, me)

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className='px-4 py-3 text-base font-semibold'>SPECOM HRM</SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {items.map((item) => (
                  <SidebarMenuItem key={item.route}>
                    <SidebarMenuButton
                      isActive={
                        item.route === ROUTES.DASHBOARD ? pathname === item.route : pathname.startsWith(item.route)
                      }
                      render={<NavLink to={item.route} />}
                    >
                      <item.icon />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <header className='bg-background flex h-14 items-center gap-2 border-b px-4'>
          <SidebarTrigger aria-label={t('sidebar.toggle')} />
          <Separator orientation='vertical' className='h-5' />
          <div className='ml-auto flex items-center gap-3'>
            <span className='text-muted-foreground text-sm'>{me?.username ?? '-'}</span>
            <Button variant='outline' className='h-[38px]' onClick={() => logout()} disabled={isPending}>
              <LogOut />
              {t('auth.logout')}
            </Button>
          </div>
        </header>
        <main className='bg-muted/40 flex-1 p-4 md:p-6'>
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}

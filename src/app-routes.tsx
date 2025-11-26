import { useRoutes } from 'react-router'
import { lazy } from 'react'

const VestingsolFeature = lazy(() => import('@/features/vestingsol/vestingsol-feature'))

export function AppRoutes() {
  return useRoutes([
    { path: '*', element: <VestingsolFeature /> },
  ])
}

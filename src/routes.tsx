import { createBrowserRouter, Navigate } from 'react-router'
import Layout from './components/Layout'
import Landing from './screens/Landing'
import Dashboard from './screens/Dashboard'
import MembershipRegister from './screens/MembershipRegister'
import DayBook from './screens/DayBook'
import LoanRegister from './screens/LoanRegister'
import ShareLedger from './screens/ShareLedger'
import ProjectRegister from './screens/ProjectRegister'
import StockRegister from './screens/StockRegister'
import AssetRegister from './screens/AssetRegister'
import HistoricalMigration from './screens/HistoricalMigration'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Landing /> },
      { path: 'dashboard', element: <Dashboard /> },
      { path: 'members', element: <MembershipRegister /> },
      { path: 'daybook', element: <DayBook /> },
      { path: 'migration', element: <HistoricalMigration /> },
      { path: 'loans', element: <LoanRegister /> },
      { path: 'shares', element: <ShareLedger /> },
      { path: 'projects', element: <ProjectRegister /> },
      { path: 'stock', element: <StockRegister /> },
      { path: 'assets', element: <AssetRegister /> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])

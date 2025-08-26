'use client'

import AdminLayout from '../../components/admin/AdminLayout'
import OrdersManager from '../../components/admin/OrdersManager'

export default function AdminOrders() {
  return (
    <AdminLayout>
      <OrdersManager />
    </AdminLayout>
  )
}
import React, { useState, useEffect } from 'react'
import api from '../../api/axios'
import './AdminUsers.css'

const AdminUsers = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await api.get('/admin/users')
      setUsers(response.data)
    } catch (err) {
      setError('Failed to fetch users')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="loading-state">Loading users...</div>
  if (error) return <div className="error-state">{error}</div>

  return (
    <div className="admin-users">
      <h1>👥 All Users</h1>
      <div className="users-table">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Role</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.fullName}</td>
                <td>{user.email}</td>
                <td>{user.phoneNumber}</td>
                <td><span className={`badge ${user.role === 'ADMIN' ? 'badge-danger' : user.role === 'RECYCLER' ? 'badge-info' : 'badge-success'}`}>{user.role}</span></td>
                <td><span className={`badge ${user.enabled ? 'badge-success' : 'badge-danger'}`}>{user.enabled ? 'Active' : 'Inactive'}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default AdminUsers

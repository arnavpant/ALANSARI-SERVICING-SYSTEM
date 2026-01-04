import { useState } from 'react'
import { supabase } from './supabase'
import { X, UserPlus, Eye, EyeOff } from 'lucide-react'
import { toast } from 'react-hot-toast'

export default function CreateUserModal({ isOpen, onClose, onUserCreated }) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    role: '',
    engineerName: '',
    engineerPhone: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      let engineerId = null

      // Step 1: If role is Engineer, create engineer entry first
      if (formData.role === 'Engineer') {
        // Generate engineer ID (e.g., ENG5, ENG6, etc.)
        const { data: existingEngineers } = await supabase
          .from('engineers')
          .select('id')
          .order('id', { ascending: false })
          .limit(1)

        // Extract number from last ID (e.g., "ENG4" -> 4)
        let nextNum = 1
        if (existingEngineers && existingEngineers.length > 0) {
          const lastId = existingEngineers[0].id
          const match = lastId.match(/\d+/)
          if (match) {
            nextNum = parseInt(match[0]) + 1
          }
        }

        engineerId = `ENG${nextNum}`

        // Create engineer in engineers table
        const { error: engError } = await supabase
          .from('engineers')
          .insert([{
            id: engineerId,
            name: formData.engineerName,
            email: formData.email,
            phone: formData.engineerPhone || null,
            status: 'active'
          }])

        if (engError) {
          toast.error(`Failed to create engineer: ${engError.message}`)
          setLoading(false)
          return
        }
      }

      // Step 2: Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: formData.email,
        password: formData.password,
        email_confirm: true
      })

      if (authError) {
        toast.error(`Auth Error: ${authError.message}`)
        setLoading(false)
        return
      }

      // Step 3: Insert user into public.users table
      const { error: dbError } = await supabase
        .from('users')
        .insert([{
          id: authData.user.id,
          email: formData.email,
          full_name: formData.fullName,
          role: formData.role,
          linked_engineer_id: engineerId
        }])

      if (dbError) {
        toast.error(`Database Error: ${dbError.message}`)
        setLoading(false)
        return
      }

      toast.success(`User ${formData.email} created successfully!`)
      onUserCreated()
      resetForm()
      onClose()
    } catch (error) {
      toast.error('Failed to create user')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      fullName: '',
      role: '',
      engineerName: '',
      engineerPhone: ''
    })
    setShowPassword(false)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <UserPlus className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">Create New User</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="user@alansari.om"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password *
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Minimum 6 characters"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="John Doe"
            />
          </div>

          {/* Role Dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role *
            </label>
            <select
              required
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select Role</option>
              <option value="Admin">Admin</option>
              <option value="Front Desk">Front Desk</option>
              <option value="Engineer">Engineer</option>
            </select>
          </div>

          {/* Engineer Details (Conditional) */}
          {formData.role === 'Engineer' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Engineer Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.engineerName}
                  onChange={(e) => setFormData({ ...formData, engineerName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., John Doe"
                />
                <p className="text-xs text-gray-500 mt-1">
                  This will create a new engineer profile
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.engineerPhone}
                  onChange={(e) => setFormData({ ...formData, engineerPhone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="+968 XXXX XXXX"
                />
              </div>
            </>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

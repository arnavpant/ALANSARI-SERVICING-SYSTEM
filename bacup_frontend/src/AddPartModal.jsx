import { useState } from 'react'
import { supabase } from './supabase'
import { X, Package, Plus } from 'lucide-react'
import { toast } from 'react-hot-toast'

export default function AddPartModal({ job, onClose, onSave }) {
  const [formData, setFormData] = useState({
    part_name: '',
    part_number: '',
    tracking_number: '',
    vendor_invoice_no: '',
    cost_price: '',
    is_returnable: true,
    notes: ''
  })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.part_name.trim()) {
      toast.error('Part name is required')
      return
    }

    setSaving(true)

    try {
      // Insert new part
      const { error: partError } = await supabase
        .from('parts')
        .insert({
          job_id: job.id,
          part_name: formData.part_name,
          part_number: formData.part_number || null,
          tracking_number: formData.tracking_number || null,
          vendor_invoice_no: formData.vendor_invoice_no || null,
          cost_price: formData.cost_price ? parseFloat(formData.cost_price) : null,
          is_returnable: formData.is_returnable,
          notes: formData.notes || null,
          status: 'ORDERED'
        })

      if (partError) {
        console.error('Error adding part:', partError)
        toast.error('Failed to add part')
        setSaving(false)
        return
      }

      // Update job status to WAITING_FOR_PARTS (auto-status update)
      const { error: jobError } = await supabase
        .from('jobs')
        .update({ status: 'WAITING_FOR_PARTS' })
        .eq('id', job.id)

      if (jobError) {
        console.error('Error updating job status:', jobError)
      }

      toast.success('Part added successfully')
      onSave()
      onClose()
    } catch (err) {
      console.error('Unexpected error:', err)
      toast.error('An error occurred')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Package className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">Add Part</h2>
              <p className="text-sm text-gray-600">{job.smart_job_id} - {job.brand} {job.device_type}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Part Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Part Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.part_name}
              onChange={(e) => setFormData({ ...formData, part_name: e.target.value })}
              placeholder="e.g., LCD Screen, Battery, Keyboard"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          {/* Part Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Part Number (P/N)
            </label>
            <input
              type="text"
              value={formData.part_number}
              onChange={(e) => setFormData({ ...formData, part_number: e.target.value })}
              placeholder="e.g., L20247-001, 5B10W13963"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Row: Tracking Number + Invoice */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tracking Number
              </label>
              <input
                type="text"
                value={formData.tracking_number}
                onChange={(e) => setFormData({ ...formData, tracking_number: e.target.value })}
                placeholder="e.g., 1Z999AA10123456784"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vendor Invoice No.
              </label>
              <input
                type="text"
                value={formData.vendor_invoice_no}
                onChange={(e) => setFormData({ ...formData, vendor_invoice_no: e.target.value })}
                placeholder="e.g., INV-2024-12345"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Row: Cost + Returnable */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cost Price (OMR)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.cost_price}
                onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                placeholder="0.00"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Returnable to Vendor?
              </label>
              <select
                value={formData.is_returnable}
                onChange={(e) => setFormData({ ...formData, is_returnable: e.target.value === 'true' })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="true">Yes (RMA Eligible)</option>
                <option value="false">No (Scrap Only)</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes about this part order..."
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Information Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <span className="font-medium">Note:</span> After adding this part, the job status will automatically change to <span className="font-semibold">WAITING_FOR_PARTS</span>.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition font-medium"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Adding...
                </>
              ) : (
                <>
                  <Plus size={18} />
                  Add Part
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { supabase } from './supabase'
import { X, AlertCircle, FileText, Save } from 'lucide-react'
import { toast } from 'react-hot-toast'

export default function DiagnosisForm({ job, onClose, onSave }) {
  const [formData, setFormData] = useState({
    fault_details: job.fault_details || '',
    technical_notes: job.technical_notes || '',
  })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.fault_details.trim()) {
      toast.error('Fault details are required')
      return
    }

    setSaving(true)

    try {
      const { error } = await supabase
        .from('jobs')
        .update({
          fault_details: formData.fault_details,
          technical_notes: formData.technical_notes,
          status: 'IN_DIAGNOSIS',
          diagnosis_date: new Date().toISOString()
        })
        .eq('id', job.id)

      if (error) {
        console.error('Error saving diagnosis:', error)
        toast.error('Failed to save diagnosis')
      } else {
        toast.success('Diagnosis saved successfully')
        onSave()
        onClose()
      }
    } catch (err) {
      console.error('Unexpected error:', err)
      toast.error('An error occurred')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">Diagnosis & Technical Notes</h2>
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
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Job Summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-600">Serial Number:</span>
                <span className="ml-2 font-medium text-gray-900">{job.serial_number || 'N/A'}</span>
              </div>
              <div>
                <span className="text-gray-600">Shelf Location:</span>
                <span className="ml-2 font-medium text-gray-900">{job.shelf_location || 'Not Set'}</span>
              </div>
              <div>
                <span className="text-gray-600">Warranty:</span>
                <span className="ml-2 font-medium text-gray-900">{job.warranty_status || 'Unknown'}</span>
              </div>
              <div>
                <span className="text-gray-600">Current Status:</span>
                <span className="ml-2 font-medium text-blue-700">{job.status?.replace(/_/g, ' ')}</span>
              </div>
            </div>
          </div>

          {/* Original Customer Report */}
          {job.fault_details && job.status === 'ASSIGNED' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-yellow-800 mb-1">Customer Reported Issue:</p>
                  <p className="text-sm text-yellow-700">{job.fault_details}</p>
                </div>
              </div>
            </div>
          )}

          {/* Fault Details */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fault Details <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.fault_details}
              onChange={(e) => setFormData({ ...formData, fault_details: e.target.value })}
              placeholder="Describe the issue in detail (e.g., 'Screen shows vertical lines on left side, LCD backlight flickering')"
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              Update or confirm the fault description after physical inspection
            </p>
          </div>

          {/* Technical Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Technical Notes
            </label>
            <textarea
              value={formData.technical_notes}
              onChange={(e) => setFormData({ ...formData, technical_notes: e.target.value })}
              placeholder="Internal technical observations (e.g., 'Liquid damage detected near USB port, corrosion on motherboard connector J3')"
              rows={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              Document diagnostic findings, test results, voltage measurements, etc.
            </p>
          </div>

          {/* Information Banner */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1 text-sm text-gray-600">
                <p className="font-medium mb-1">After saving:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Job status will change to <span className="font-medium">IN_DIAGNOSIS</span></li>
                  <li>Diagnosis timestamp will be recorded</li>
                  <li>You can add required parts in the next step</li>
                </ul>
              </div>
            </div>
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
                  Saving...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Save Diagnosis
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

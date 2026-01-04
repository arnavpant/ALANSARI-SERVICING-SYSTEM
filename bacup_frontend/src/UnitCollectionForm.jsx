import { useState } from 'react'
import { X, Save } from 'lucide-react'

export default function UnitCollectionForm({ job, onClose, onSave }) {
  // 1. Initialize State 
  const [formData, setFormData] = useState({
    retailer_ref: job.retailer_ref || '',
    retailer_name: job.retailer_name || '',
    warranty_status: job.warranty_status || 'In Warranty',
    service_type: job.service_type || 'Depot',
    device_type: job.device_type || 'Laptop',
    brand: job.brand || '',
    serial_number: job.serial_number || '',
    shelf_location: job.shelf_location || '',
    fault_details: job.fault_details || job.email_subject || '',
    sender_email: job.sender_email || '' 
  })

  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!formData.retailer_name || formData.retailer_name.trim() === '') {
      setError('Retailer / Customer name is required.');
      return;
    }
    setError('');

    const sanitizedFormData = {
      ...formData,
      serial_number: formData.serial_number ? formData.serial_number : null,
      retailer_ref: formData.retailer_ref ? formData.retailer_ref : null
    };

    onSave(job.id || null, sanitizedFormData)
  }

  const isManual = !job.id;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className={`p-6 flex justify-between items-start text-white ${isManual ? 'bg-green-600' : 'bg-blue-600'}`}>
          <div>
            <h2 className="text-xl font-bold">
              {isManual ? 'New Walk-in Job' : 'Unit Collection Form'}
            </h2>
            <p className={`${isManual ? 'text-green-100' : 'text-blue-100'} text-sm mt-1`}>
              {isManual 
                ? 'Enter details for a new device intake.' 
                : <span>Processing Draft from: <span className="font-semibold">{job.sender_email}</span></span>
              }
            </p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition">
            <X size={24} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 grid grid-cols-2 gap-6">
          {error && (
            <div className="col-span-2 mb-2">
              <div className="bg-red-100 text-red-700 px-4 py-2 rounded-lg text-sm font-semibold">{error}</div>
            </div>
          )}
          
          {/* LEFT COLUMN: Device Details */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider border-b pb-2">Device Details</h3>

            {/* Retailer / Customer Info */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer / Retailer <span className="text-red-500">*</span></label>
              <input
                name="retailer_name"
                value={formData.retailer_name}
                onChange={handleChange}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="e.g. John Doe or Lulu Hypermarket"
                required
              />
            </div>

            {/* Manual Email */}
            {isManual && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Customer Email</label>
                <input
                  name="sender_email"
                  value={formData.sender_email}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g. customer@example.com"
                />
              </div>
            )}
            
            {/* Service Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Service Type <span className="text-red-500">*</span></label>
              <select
                name="service_type"
                value={formData.service_type}
                onChange={handleChange}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                required
              >
                <option value="Depot">Depot (Service Center)</option>
                <option value="Field Service">Field Service (Off-Site)</option>
              </select>
            </div>

            {/* CONDITIONAL BRAND INPUT */}
            {formData.service_type === 'Depot' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Brand <span className="text-red-500">*</span></label>
                <select
                  name="brand"
                  value={formData.brand}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  required
                >
                  <option value="">Select Brand</option>
                  <option value="HP">HP</option>
                  <option value="Lenovo">Lenovo</option>
                  <option value="Dell">Dell</option>
                  <option value="Other">Other</option>
                </select>
                {formData.brand === 'Other' && (
                  <input
                    name="brand_other"
                    onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none mt-2"
                    placeholder="Enter Brand Name"
                  />
                )}
              </div>
            ) : (
              /* FIELD SERVICE MODE: Custom Input */
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Brand (Custom)</label>
                <input
                  name="brand"
                  value={formData.brand}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g. Dell Server, Custom Rig, etc."
                />
              </div>
            )}

            {/* CONDITIONAL DEVICE TYPE INPUT */}
            {formData.service_type === 'Depot' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Device Type</label>
                <select 
                  name="device_type" 
                  value={formData.device_type} 
                  onChange={handleChange}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                >
                  <option value="Laptop">Laptop</option>
                  <option value="Desktop">Desktop</option>
                  <option value="Printer">Printer (Household)</option>
                  <option value="Commercial Printer">Commercial Printer</option>
                  <option value="Server">Server</option>
                  <option value="Tablet">Tablet</option>
                </select>
              </div>
            ) : (
              /* FIELD SERVICE MODE: Custom Input */
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Device Type (Custom)</label>
                <input 
                  name="device_type" 
                  value={formData.device_type} 
                  onChange={handleChange}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                  placeholder="e.g. Server Rack, Network Switch, plotter..." 
                />
              </div>
            )}

            {/* Retailer Ref */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Retailer Reference No.</label>
              <input 
                name="retailer_ref" 
                value={formData.retailer_ref} 
                onChange={handleChange}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                placeholder="e.g. RMA-2024-001" 
              />
            </div>

            {/* Serial Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Serial Number</label>
              <input 
                name="serial_number" 
                value={formData.serial_number} 
                onChange={handleChange}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono uppercase" 
                placeholder="e.g. 5CD2349JKA" 
              />
            </div>
          </div>

          {/* RIGHT COLUMN: Service Details */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider border-b pb-2">Intake Logistics</h3>

            <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
              <label className="block text-sm font-bold text-yellow-800 mb-1">Shelf Location</label>
              <input 
                name="shelf_location" 
                value={formData.shelf_location} 
                onChange={handleChange}
                className="w-full p-2 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none text-lg font-bold text-gray-800" 
                placeholder="e.g. A-12" 
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Warranty Status</label>
              <select 
                name="warranty_status" 
                value={formData.warranty_status} 
                onChange={handleChange}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              >
                <option value="In Warranty">In Warranty (Standard)</option>
                <option value="Out of Warranty">Out of Warranty (Billable)</option>
                <option value="AMC">AMC / Contract</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reported Fault</label>
              <textarea 
                name="fault_details" 
                value={formData.fault_details} 
                onChange={handleChange}
                rows={3}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="col-span-2 border-t pt-6 flex justify-end gap-3">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className={`flex items-center gap-2 text-white px-6 py-2 rounded-lg font-semibold shadow-md transition ${isManual ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
              <Save size={18} /> {isManual ? 'Create Job' : 'Save & Register'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
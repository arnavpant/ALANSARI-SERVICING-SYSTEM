import { jsPDF } from 'jspdf'
import { format } from 'date-fns'

export const generateDeliveryNote = async (job, parts = []) => {
  const doc = new jsPDF()
  
  // Header
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('AL ANSARI SERVICE CENTER', 105, 20, { align: 'center' })
  
  doc.setFontSize(16)
  doc.text('DELIVERY NOTE', 105, 30, { align: 'center' })
  
  // Horizontal line
  doc.setLineWidth(0.5)
  doc.line(20, 35, 190, 35)
  
  // Job Details Section
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  
  let yPos = 45
  
  // Left Column
  doc.setFont('helvetica', 'bold')
  doc.text('Job ID:', 20, yPos)
  doc.setFont('helvetica', 'normal')
  doc.text(job.smart_job_id || 'N/A', 60, yPos)
  
  yPos += 7
  doc.setFont('helvetica', 'bold')
  doc.text('Retailer:', 20, yPos)
  doc.setFont('helvetica', 'normal')
  doc.text(job.retailer_name || 'N/A', 60, yPos)
  
  yPos += 7
  doc.setFont('helvetica', 'bold')
  doc.text('Retailer Ref:', 20, yPos)
  doc.setFont('helvetica', 'normal')
  doc.text(job.retailer_ref || 'N/A', 60, yPos)
  
  yPos += 7
  doc.setFont('helvetica', 'bold')
  doc.text('Email:', 20, yPos)
  doc.setFont('helvetica', 'normal')
  doc.text(job.email_received_from || 'N/A', 60, yPos)
  
  // Right Column
  yPos = 45
  doc.setFont('helvetica', 'bold')
  doc.text('Date Received:', 110, yPos)
  doc.setFont('helvetica', 'normal')
  doc.text(job.date_received ? format(new Date(job.date_received), 'dd/MM/yyyy') : 'N/A', 160, yPos)
  
  yPos += 7
  doc.setFont('helvetica', 'bold')
  doc.text('Date Completed:', 110, yPos)
  doc.setFont('helvetica', 'normal')
  doc.text(job.completed_at ? format(new Date(job.completed_at), 'dd/MM/yyyy') : 'N/A', 160, yPos)
  
  yPos += 7
  doc.setFont('helvetica', 'bold')
  doc.text('Warranty:', 110, yPos)
  doc.setFont('helvetica', 'normal')
  doc.text(job.warranty_status || 'N/A', 160, yPos)
  
  // Device Details Section
  yPos += 15
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.text('DEVICE DETAILS', 20, yPos)
  doc.setLineWidth(0.3)
  doc.line(20, yPos + 2, 190, yPos + 2)
  
  yPos += 10
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('Device Type:', 20, yPos)
  doc.setFont('helvetica', 'normal')
  doc.text(job.device_type || 'N/A', 60, yPos)
  
  yPos += 7
  doc.setFont('helvetica', 'bold')
  doc.text('Brand:', 20, yPos)
  doc.setFont('helvetica', 'normal')
  doc.text(job.brand || 'N/A', 60, yPos)
  
  yPos += 7
  doc.setFont('helvetica', 'bold')
  doc.text('Serial Number:', 20, yPos)
  doc.setFont('helvetica', 'normal')
  doc.text(job.serial_number || 'N/A', 60, yPos)
  
  // Fault & Work Performed Section
  yPos += 15
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.text('WORK PERFORMED', 20, yPos)
  doc.setLineWidth(0.3)
  doc.line(20, yPos + 2, 190, yPos + 2)
  
  yPos += 10
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  
  // Fault Details (wrapped text)
  const faultText = job.fault_details || 'No fault details provided'
  const faultLines = doc.splitTextToSize(faultText, 170)
  doc.text(faultLines, 20, yPos)
  yPos += faultLines.length * 5 + 5
  
  // Parts Replaced Section (if any)
  if (parts && parts.length > 0) {
    yPos += 5
    doc.setFontSize(13)
    doc.setFont('helvetica', 'bold')
    doc.text('PARTS REPLACED', 20, yPos)
    doc.setLineWidth(0.3)
    doc.line(20, yPos + 2, 190, yPos + 2)
    
    yPos += 10
    doc.setFontSize(10)
    
    parts.forEach((part, index) => {
      if (yPos > 260) { // New page if needed
        doc.addPage()
        yPos = 20
      }
      
      doc.setFont('helvetica', 'bold')
      doc.text(`${index + 1}. ${part.part_name}`, 20, yPos)
      doc.setFont('helvetica', 'normal')
      yPos += 5
      doc.text(`   P/N: ${part.part_number || 'N/A'}`, 20, yPos)
      yPos += 7
    })
  }
  
  // Signature Section
  yPos += 20
  if (yPos > 240) {
    doc.addPage()
    yPos = 20
  }
  
  doc.setLineWidth(0.3)
  doc.line(20, yPos, 85, yPos)
  doc.line(125, yPos, 190, yPos)
  
  yPos += 5
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text('Customer/Courier Signature', 20, yPos)
  doc.text('Date', 125, yPos)
  
  // Footer
  doc.setFontSize(8)
  doc.setFont('helvetica', 'italic')
  doc.text('This is a computer-generated delivery note', 105, 285, { align: 'center' })
  
  // Open PDF in new tab instead of auto-download
  const pdfBlob = doc.output('blob')
  const pdfUrl = URL.createObjectURL(pdfBlob)
  window.open(pdfUrl, '_blank')
  
  const fileName = `Delivery_Note_${job.smart_job_id}_${format(new Date(), 'yyyyMMdd')}.pdf`
  return fileName
}

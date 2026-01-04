import { supabase } from '../supabase'
import * as XLSX from 'xlsx'

export const generateYearlyArchive = async () => {
  try {
    // 1. Fetch ALL Data needed
    // We fetch parts and old_parts with the smart_job_id joined from jobs
    const { data: jobs, error: jobsError } = await supabase
      .from('jobs')
      .select('*')
      .order('id');

    const { data: parts, error: partsError } = await supabase
      .from('parts')
      .select('*, jobs(smart_job_id)') 
      
    const { data: oldParts, error: oldPartsError } = await supabase
      .from('old_parts')
      .select('*, jobs(smart_job_id)')

    if (jobsError || partsError || oldPartsError) throw new Error('Fetch failed');

    // 2. Create a New Workbook
    const workbook = XLSX.utils.book_new();
    const categories = ['LEN', 'HP', 'HPP', 'FDS', 'OOW', 'GEN'];
    
    // 3. Loop through categories and create separate Sheets
    categories.forEach(tag => {
      // Filter jobs where smart_job_id starts with the tag (e.g., "HP-")
      const filteredJobs = jobs.filter(j => j.smart_job_id && j.smart_job_id.startsWith(tag));
      
      if (filteredJobs.length > 0) {
        // Convert JSON data to an Excel Worksheet
        const worksheet = XLSX.utils.json_to_sheet(filteredJobs);
        // Add the worksheet to the workbook with the name "HP Jobs", "LEN Jobs", etc.
        XLSX.utils.book_append_sheet(workbook, worksheet, `${tag} Jobs`);
      }
    });

    // 4. Add Master Parts Sheet
    if (parts && parts.length > 0) {
      // Flatten the data (pull smart_job_id out of the nested object)
      const flatParts = parts.map(p => ({
        ...p,
        job_smart_id: p.jobs?.smart_job_id || 'UNKNOWN', 
        jobs: undefined // Remove the nested object to keep Excel clean
      }));
      
      const partsSheet = XLSX.utils.json_to_sheet(flatParts);
      XLSX.utils.book_append_sheet(workbook, partsSheet, "Master Parts");
    }

    // 5. Add Master Old Parts Sheet (RMA)
    if (oldParts && oldParts.length > 0) {
      const flatOldParts = oldParts.map(p => ({
        ...p,
        job_smart_id: p.jobs?.smart_job_id || 'UNKNOWN',
        jobs: undefined
      }));
      
      const oldPartsSheet = XLSX.utils.json_to_sheet(flatOldParts);
      XLSX.utils.book_append_sheet(workbook, oldPartsSheet, "Old Parts (RMA)");
    }

    // 6. Generate and Download the File
    // This creates "Service_Archive_2025-01-01.xlsx"
    const fileName = `Service_Archive_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);

    return { success: true, count: jobs.length };

  } catch (error) {
    console.error('Archive Error:', error);
    return { success: false, error };
  }
}
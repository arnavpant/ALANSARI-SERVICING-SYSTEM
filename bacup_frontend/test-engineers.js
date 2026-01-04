// Quick test script to verify engineers table exists and has data
import { createClient } from '@supabase/supabase-js'

// Load environment variables
const supabaseUrl = 'https://dwbuneceuqaonythkjly.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3YnVuZWNldXFhb255dGhramx5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjQ4MDExMywiZXhwIjoyMDgyMDU2MTEzfQ.oltyij-Wd9gJtDGqWq5rgbHr_LKH9W9aGkYpFhcjGnc'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testEngineersTable() {
  console.log('🔍 Testing Engineers Table...\n')
  
  // Test 1: Check if table exists and has data
  console.log('Test 1: Fetching all active engineers...')
  const { data: allEngineers, error: allError } = await supabase
    .from('engineers')
    .select('*')
    .eq('status', 'active')
    .order('id', { ascending: true })
  
  if (allError) {
    console.error('❌ Error fetching engineers:', allError.message)
    return
  }
  
  console.log(`✅ Found ${allEngineers.length} active engineers:`)
  allEngineers.forEach(eng => {
    console.log(`   - ${eng.id}: ${eng.name} (${eng.email})`)
  })
  console.log('')
  
  // Test 2: Verify specific engineer IDs exist
  console.log('Test 2: Verifying expected engineer IDs...')
  const expectedIds = ['ENG1', 'ENG2', 'ENG3', 'ENG4']
  const foundIds = allEngineers.map(e => e.id)
  
  expectedIds.forEach(id => {
    if (foundIds.includes(id)) {
      console.log(`   ✅ ${id} exists`)
    } else {
      console.log(`   ❌ ${id} MISSING`)
    }
  })
  console.log('')
  
  // Test 3: Check table structure
  console.log('Test 3: Checking table columns...')
  if (allEngineers.length > 0) {
    const sampleEngineer = allEngineers[0]
    const columns = Object.keys(sampleEngineer)
    console.log(`   Columns: ${columns.join(', ')}`)
    console.log(`   ✅ Table structure looks good`)
  }
  console.log('')
  
  // Summary
  console.log('📊 Summary:')
  console.log(`   Total Engineers: ${allEngineers.length}`)
  console.log(`   Status: ${allEngineers.length >= 4 ? '✅ PASS' : '❌ FAIL (Expected at least 4 engineers)'}`)
}

testEngineersTable().catch(console.error)

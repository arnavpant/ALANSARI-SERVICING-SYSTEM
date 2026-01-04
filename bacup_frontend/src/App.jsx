import { useEffect, useState, useRef } from 'react'
import { supabase } from './supabase'
import { Play, RefreshCw, Mail, Calendar, User, CheckCircle, Archive, UserPlus, Plus, AlertTriangle, Bell, Clock, X, ArrowRight, ExternalLink } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { Toaster, toast } from 'react-hot-toast'
import UnitCollectionForm from './UnitCollectionForm'
import ActiveJobs from './ActiveJobs'
import EngineerView from './EngineerView'
import PartsReception from './PartsReception'
import Login from './Login'
import CreateUserModal from './CreateUserModal'
import DatabaseViewer from './DatabaseViewer'
import ClosedJobs from './ClosedJobs'

// --- SLA DATA GATHERER (Admin Brain) ---
// Now returns ARRAYS of jobs, not just counts
const getSLAData = (allJobs) => {
  const now = new Date().getTime();
  const ONE_DAY = 24 * 60 * 60 * 1000;
  
  let data = {
    overdueDrafts: [], // > 24h
    stagnantJobs: [],  // > 48h Assigned
    partsDelay: [],    // > 7 days Waiting for Parts
    slaBreach: [],     // > 15 days Total
    totalCount: 0
  };

  allJobs.forEach(job => {
    const dateReceived = new Date(job.date_received).getTime();
    const ageInDays = (now - dateReceived) / ONE_DAY;

    // 1. DRAFT CHECK (> 24 Hours)
    if (job.status === 'DRAFT_FROM_EMAIL') {
        if ((now - dateReceived) > ONE_DAY) {
          data.overdueDrafts.push(job);
        }
    } 
    // ACTIVE JOB CHECKS
    else if (job.status !== 'CLOSED') {
        // 2. GLOBAL BREACH (> 15 Days)
        if (ageInDays > 15) {
            data.slaBreach.push(job);
        }

        // 3. ASSIGNED STAGNATION (> 48 Hours)
        if (job.status === 'ASSIGNED' && job.date_assigned) {
            const assignedTime = new Date(job.date_assigned).getTime();
            if ((now - assignedTime) > (2 * ONE_DAY)) {
              data.stagnantJobs.push(job);
            }
        }

        // 4. PARTS DELAY (> 7 Days)
        if (job.status === 'WAITING_FOR_PARTS') {
            // Fallback to date_received if updated_at is missing (safety)
            const refDate = job.updated_at ? new Date(job.updated_at) : new Date(job.date_received);
            if ((now - refDate.getTime()) > (7 * ONE_DAY)) {
              data.partsDelay.push(job);
            }
        }
    }
  });

  data.totalCount = data.overdueDrafts.length + data.stagnantJobs.length + data.partsDelay.length + data.slaBreach.length;
  return data;
}

function App() {
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('drafts')
  const [selectedJob, setSelectedJob] = useState(null)
  const [showCreateUserModal, setShowCreateUserModal] = useState(false)
  
  // NEW: Alert Center Logic
  const [slaData, setSlaData] = useState({ overdueDrafts: [], stagnantJobs: [], partsDelay: [], slaBreach: [], totalCount: 0 });
  const [showAlertPanel, setShowAlertPanel] = useState(false)
  const alertPanelRef = useRef(null) // To handle clicking outside

  // Close alert panel when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (alertPanelRef.current && !alertPanelRef.current.contains(event.target)) {
        setShowAlertPanel(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [alertPanelRef]);

  // --- CHECK AUTH SESSION ON LOAD ---
  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: userData, error } = await supabase
          .from('users').select('role, full_name, linked_engineer_id')
          .eq('id', session.user.id).single();

        if (!error && userData) {
          setUser({ ...session.user, role: userData.role, full_name: userData.full_name, linked_engineer_id: userData.linked_engineer_id });
        }
      }
    } catch (error) { console.error('Session error:', error); } 
    finally { setAuthLoading(false); }
  };

  const handleLoginSuccess = (userData) => setUser(userData);
  
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    toast.success('Logged out successfully');
  };

  // --- FETCH DRAFTS (Tab 1) ---
  const fetchDrafts = async () => {
    setLoading(true)
    const { data, error } = await supabase.from('jobs').select('*').eq('status', 'DRAFT_FROM_EMAIL').order('date_received', { ascending: false })
    if (error) console.error('Error:', error)
    else setJobs(data || [])
    setLoading(false)
  }

  // --- FETCH SLA DATA (Admin Only) ---
  useEffect(() => {
     const fetchAllForStats = async () => {
        // We need full details now to display them in the alert list
        const { data } = await supabase
            .from('jobs')
            .select('*') 
            .neq('status', 'CLOSED');
            
        if (data) {
            setSlaData(getSLAData(data));
        }
     }
     // Polling: Update alerts every 30 seconds or when tabs change
     if (user?.role === 'Admin') fetchAllForStats();
     const interval = setInterval(() => { if (user?.role === 'Admin') fetchAllForStats() }, 30000);
     return () => clearInterval(interval);
  }, [user, jobs, activeTab]);

  // --- HELPER: Go to Job from Alert ---
  const handleAlertClick = (job, targetTab) => {
    setActiveTab(targetTab);
    setShowAlertPanel(false);
    // Optional: You could scroll to the job or highlight it here
    toast(`Mapsd to ${job.smart_job_id || 'Draft'}`);
  }

  // --- SAVE / UPDATE FUNCTION ---
  const handleSaveJob = async (id, formData) => {
    const isManualWalkIn = !id;
    const isEmailDraftProcessing = id && (!selectedJob || !selectedJob.smart_job_id); 
    const isEditMode = id && selectedJob?.smart_job_id;

    let payload = { ...formData };
    
    if (isManualWalkIn || isEmailDraftProcessing) {
      const { data: smartId, error: rpcError } = await supabase.rpc('generate_smart_job_id', {
        p_warranty_status: formData.warranty_status,
        p_service_type: formData.service_type,
        p_brand: formData.brand,
        p_device_type: formData.device_type 
      });
      if (rpcError) { toast.error("Error generating Job ID"); return; }
      payload.smart_job_id = smartId;
      payload.status = 'RECEIVED'; 
      payload.date_received = payload.date_received || new Date().toISOString(); 
    }

    try {
      if (isManualWalkIn) await supabase.from('jobs').insert([payload]); 
      else await supabase.from('jobs').update(payload).eq('id', id);
      toast.success(isEditMode ? `Job Updated!` : `New Job Registered: ${payload.smart_job_id}`);
      setSelectedJob(null);
      if (activeTab === 'drafts') fetchDrafts();
      if (activeTab === 'active') window.location.reload(); 
    } catch (err) { toast.error('Failed to save job.'); }
  };

  useEffect(() => { if (user && activeTab === 'drafts') fetchDrafts(); }, [activeTab, user])

  const getAvailableTabs = () => {
    const role = user?.role;
    if (role === 'Admin') return ['drafts', 'active', 'parts', 'engineer', 'database', 'closed'];
    if (role === 'Front Desk') return ['drafts', 'active', 'parts'];
    if (role === 'Engineer') return ['engineer'];
    return [];
  };

  const availableTabs = getAvailableTabs();
  useEffect(() => {
    if (user) {
      const tabs = getAvailableTabs();
      if (!tabs.includes(activeTab)) setActiveTab(tabs[0] || 'engineer');
    }
  }, [user]);

  if (authLoading) return <div className="min-h-screen flex items-center justify-center bg-gray-50">Loading...</div>;
  if (!user) return <Login onLoginSuccess={handleLoginSuccess} />;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-8">
      <Toaster position="bottom-right" />
      
      {/* HEADER & TABS */}
      <div className="max-w-6xl mx-auto mb-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-slate-800">Service Dashboard</h1>
          
          <div className="flex items-center gap-3">
             {/* --- ADMIN ALERT CENTER (CLICKABLE BELL) --- */}
             {user?.role === 'Admin' && (
                 <div className="relative" ref={alertPanelRef}>
                    <button 
                      onClick={() => setShowAlertPanel(!showAlertPanel)}
                      className={`relative p-2 rounded-full transition ${slaData.totalCount > 0 ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'text-slate-400 hover:bg-slate-100'}`}
                    >
                        <Bell size={20} />
                        {slaData.totalCount > 0 && (
                          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white animate-pulse">
                            {slaData.totalCount}
                          </span>
                        )}
                    </button>

                    {/* --- THE ALERT PANEL (DROPDOWN) --- */}
                    {showAlertPanel && (
                        <div className="absolute right-0 top-full mt-3 w-96 bg-white shadow-2xl rounded-xl border border-slate-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                           <div className="bg-slate-50 p-3 border-b border-slate-100 flex justify-between items-center">
                              <h3 className="font-bold text-slate-700 flex items-center gap-2">
                                <AlertTriangle size={16} className="text-red-500" /> Alert Center
                              </h3>
                              <button onClick={() => setShowAlertPanel(false)} className="text-slate-400 hover:text-slate-600"><X size={16}/></button>
                           </div>
                           
                           <div className="max-h-[70vh] overflow-y-auto">
                              {slaData.totalCount === 0 ? (
                                <div className="p-8 text-center text-slate-500 flex flex-col items-center">
                                  <CheckCircle size={32} className="text-green-500 mb-2 opacity-50"/>
                                  <p className="text-sm">All systems normal.</p>
                                </div>
                              ) : (
                                <div className="divide-y divide-slate-100">
                                   
                                   {/* 1. GLOBAL BREACHES (RED) */}
                                   {slaData.slaBreach.map(job => (
                                     <div key={job.id} onClick={() => handleAlertClick(job, 'active')} className="p-3 hover:bg-red-50 cursor-pointer group transition">
                                       <div className="flex justify-between items-start mb-1">
                                         <span className="font-bold text-red-700 text-sm flex items-center gap-1">
                                           <AlertTriangle size={12}/> Global Breach (15d+)
                                         </span>
                                         <span className="text-[10px] text-slate-400 bg-white px-1 rounded border">{job.smart_job_id}</span>
                                       </div>
                                       <p className="text-xs text-slate-600 mb-1">{job.brand} {job.device_type}</p>
                                       <div className="text-[10px] text-red-500 font-medium flex items-center gap-1">
                                          View Job <ArrowRight size={10} className="group-hover:translate-x-1 transition"/>
                                       </div>
                                     </div>
                                   ))}

                                   {/* 2. PARTS DELAY (ORANGE) */}
                                   {slaData.partsDelay.map(job => (
                                     <div key={job.id} onClick={() => handleAlertClick(job, 'active')} className="p-3 hover:bg-orange-50 cursor-pointer group transition">
                                       <div className="flex justify-between items-start mb-1">
                                         <span className="font-bold text-orange-700 text-sm flex items-center gap-1">
                                           <Clock size={12}/> Parts Delayed (7d+)
                                         </span>
                                         <span className="text-[10px] text-slate-400 bg-white px-1 rounded border">{job.smart_job_id}</span>
                                       </div>
                                       <p className="text-xs text-slate-600 mb-1">Waiting since: {new Date(job.updated_at || job.date_received).toLocaleDateString()}</p>
                                       <div className="text-[10px] text-orange-600 font-medium flex items-center gap-1">
                                          View Job <ArrowRight size={10} className="group-hover:translate-x-1 transition"/>
                                       </div>
                                     </div>
                                   ))}

                                   {/* 3. STAGNANT (PURPLE) */}
                                   {slaData.stagnantJobs.map(job => (
                                     <div key={job.id} onClick={() => handleAlertClick(job, 'active')} className="p-3 hover:bg-purple-50 cursor-pointer group transition">
                                       <div className="flex justify-between items-start mb-1">
                                         <span className="font-bold text-purple-700 text-sm flex items-center gap-1">
                                           <User size={12}/> Stagnant Repair (48h+)
                                         </span>
                                         <span className="text-[10px] text-slate-400 bg-white px-1 rounded border">{job.smart_job_id}</span>
                                       </div>
                                       <p className="text-xs text-slate-600 mb-1">Tech: {job.assigned_engineer_id || 'Unknown'}</p>
                                     </div>
                                   ))}

                                   {/* 4. OVERDUE DRAFTS (GRAY/RED) */}
                                   {slaData.overdueDrafts.map(job => (
                                     <div key={job.id} onClick={() => handleAlertClick(job, 'drafts')} className="p-3 hover:bg-slate-50 cursor-pointer group transition">
                                       <div className="flex justify-between items-start mb-1">
                                         <span className="font-bold text-slate-700 text-sm flex items-center gap-1">
                                           <Mail size={12}/> Overdue Draft (24h+)
                                         </span>
                                         <span className="text-[10px] text-slate-400 bg-white px-1 rounded border">DRAFT</span>
                                       </div>
                                       <p className="text-xs text-slate-600 mb-1 truncate">{job.email_subject}</p>
                                       <div className="text-[10px] text-blue-600 font-medium flex items-center gap-1">
                                          Process Now <ArrowRight size={10} className="group-hover:translate-x-1 transition"/>
                                       </div>
                                     </div>
                                   ))}
                                </div>
                              )}
                           </div>
                        </div>
                    )}
                 </div>
             )}

            {/* Create User Button (Admin Only) */}
            {user?.role === 'Admin' && (
              <button onClick={() => setShowCreateUserModal(true)} className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm">
                <UserPlus className="w-4 h-4" /> Create User
              </button>
            )}
            
            <div className="text-right">
                <div className="text-sm font-bold text-slate-700">{user?.full_name || 'User'}</div>
                <div className="text-xs text-slate-500">{user?.role}</div>
            </div>

            <button onClick={handleLogout} className="text-sm text-red-600 hover:text-red-800 transition px-2">
              Logout
            </button>
          </div>
        </div>
        
        {/* TAB NAVIGATION */}
        <div className="flex gap-1 bg-white p-1 rounded-lg border border-slate-200 inline-flex shadow-sm">
          {availableTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition capitalize ${
                activeTab === tab ? 'bg-blue-100 text-blue-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              {tab === 'engineer' ? 'Engineer View' : tab === 'parts' ? 'Parts Reception' : tab === 'database' ? 'Database Viewer' : `${tab} Jobs`}
            </button>
          ))}
        </div>
      </div>

      {/* --- TAB CONTENT RENDERING --- */}
      {activeTab === 'drafts' && (
        <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <h3 className="font-semibold text-slate-700">Pending Intakes</h3>
            <div className="flex gap-2">
              <button onClick={() => setSelectedJob({ isManual: true })} className="flex items-center gap-1 bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-green-700 transition">
                <Plus size={16} /> New Walk-in
              </button>
              <button onClick={fetchDrafts} className="text-sm flex items-center gap-1 text-blue-600 hover:underline px-2"><RefreshCw size={14}/> Refresh</button>
            </div>
          </div>

          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
              <tr>
                <th className="p-4">Received</th>
                <th className="p-4">Sender</th>
                <th className="p-4">Subject / Fault</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {jobs.length === 0 ? (
                <tr><td colSpan="4" className="p-8 text-center text-slate-400">No pending drafts.</td></tr>
              ) : (
                jobs.map((job) => {
                  const isOverdue = (new Date().getTime() - new Date(job.date_received).getTime()) > (24 * 60 * 60 * 1000);
                  return (
                    <tr key={job.id} className={isOverdue ? "bg-red-50 hover:bg-red-100 transition" : "hover:bg-blue-50 transition"}>
                      <td className="p-4 text-sm text-slate-600">
                        {new Date(job.date_received).toLocaleDateString()}
                        <div className="text-xs text-slate-400">{formatDistanceToNow(new Date(job.date_received))} ago</div>
                        {isOverdue && <div className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold text-red-600 bg-white px-2 py-0.5 rounded border border-red-200"><Clock size={10} /> {'>'}24h Overdue</div>}
                      </td>
                      <td className="p-4 font-medium text-slate-900">{job.retailer_name}<div className="text-xs text-slate-400 font-normal">{job.sender_email}</div></td>
                      <td className="p-4 text-slate-600">{job.email_subject}</td>
                      <td className="p-4 text-right">
                        <button onClick={() => setSelectedJob(job)} className="inline-flex items-center gap-2 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition"><Play size={14} /> Process</button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'active' && <ActiveJobs onEdit={(job) => setSelectedJob(job)} />}
      {activeTab === 'parts' && <PartsReception />}
      {activeTab === 'engineer' && <EngineerView user={user} />}
      {activeTab === 'closed' && <ClosedJobs />}
      {activeTab === 'database' && <DatabaseViewer />}

      {selectedJob && <UnitCollectionForm job={selectedJob} onClose={() => setSelectedJob(null)} onSave={handleSaveJob} />}
      <CreateUserModal isOpen={showCreateUserModal} onClose={() => setShowCreateUserModal(false)} onUserCreated={() => toast.success('User created!')} />
    </div>
  );
}

export default App
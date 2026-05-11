import { useState, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, 
  Search, 
  UserPlus, 
  Database, 
  FileText, 
  ChevronRight, 
  AlertCircle,
  CheckCircle2,
  Menu,
  X,
  Plus,
  LogIn,
  LogOut,
  Lock,
  UserCheck,
  Users,
  Network,
  ShieldAlert,
  Fingerprint,
  Info
} from 'lucide-react';
import { auth, signInWithGoogle, logout, onAuthStateChanged, User } from './lib/firebase';

// --- Types ---

interface Case {
  case_id: number;
  case_title: string;
  crime_type: string;
  location: string;
  year: number;
  season: number;
  status: string;
  suspect_count?: number;
  evidence_count?: number;
  civilian_count?: number;
}

interface Suspect {
  suspect_id: number;
  name: string;
  alias: string;
  background: string;
  status: string;
}

interface Officer {
  officer_id: number;
  name: string;
  officer_rank: string;
  department: string;
  season?: number;
  role?: string;
}

interface Civilian {
  civilian_id: number;
  name: string;
  role: string;
  season?: number;
}

interface Evidence {
  evidence_id: number;
  case_id: number;
  evidence_type: string;
  description: string;
  collected_by: string;
  is_key: string;
}

interface CombinedData {
  suspect_id: number;
  suspect: string;
  case_id: number;
  case_title: string;
  status: string;
  involvement_type: string;
  evidence_count: number;
  officer_count: number;
}

interface Stats {
  cases: number;
  suspects: number;
  officers: number;
  solved: number;
  recentCases: Case[];
}

interface AccessLog {
  log_id: number;
  ip_address: string;
  location: string;
  attempt_type: string;
  status: string;
  timestamp: string;
}

// --- Components ---

const Navbar = ({ activeTab, setActiveTab, user }: { activeTab: string, setActiveTab: (tab: string) => void, user: User | null }) => {
  const [isOpen, setIsOpen] = useState(false);

  const tabs = [
    { id: 'home', label: 'Home', icon: Shield },
    { id: 'cases', label: 'Cases', icon: FileText },
    { id: 'officers', label: 'Officers', icon: UserCheck },
    { id: 'search', label: 'Search', icon: Search },
    { id: 'add', label: 'Log', icon: UserPlus },
    { id: 'combined', label: 'Nodes', icon: Database },
  ];

  return (
    <nav className="border-b border-tactical-border bg-tactical-card/90 backdrop-blur-xl sticky top-0 z-[60] shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Shield className="w-8 h-8 text-blue-500 animate-pulse" />
              <div className="absolute inset-0 bg-blue-500/20 blur-lg rounded-full" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black tracking-tighter text-white uppercase italic leading-none">CID_OSINT</span>
              <span className="text-[8px] font-mono text-blue-500 uppercase tracking-[0.4em] mt-0.5">Tactical_Grid</span>
            </div>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 lg:px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-[0.2em] transition-all relative group ${
                  activeTab === tab.id 
                    ? 'text-white' 
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {activeTab === tab.id && (
                  <motion.div 
                    layoutId="nav-bg"
                    className="absolute inset-0 bg-blue-600/10 border border-blue-500/50 rounded-lg shadow-[inset_0_0_10px_rgba(59,130,246,0.2)]"
                  />
                )}
                <tab.icon className={`w-3.5 h-3.5 relative z-10 ${activeTab === tab.id ? 'text-blue-500' : ''}`} />
                <span className="relative z-10">{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4">
            {user && (
              <div className="flex items-center gap-3">
                <div className="hidden lg:block text-right">
                  <p className="text-[10px] font-black text-white uppercase tracking-tighter leading-none">{user.displayName}</p>
                  <p className="text-[7px] font-mono text-green-500 uppercase tracking-[0.2em] mt-0.5 flex items-center justify-end gap-1">
                    <span className="w-1 h-1 rounded-full bg-green-500" />
                    Auth_Agent
                  </p>
                </div>
                <button
                  onClick={logout}
                  className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all border border-tactical-border hover:border-red-500/50"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden p-2 text-zinc-400 hover:text-white"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-tactical-border bg-tactical-card"
          >
            <div className="px-2 pt-2 pb-3 space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setIsOpen(false);
                  }}
                  className={`flex items-center gap-3 w-full px-4 py-3 rounded-md text-sm font-black uppercase tracking-widest ${
                    activeTab === tab.id 
                      ? 'bg-blue-600/20 text-white border-l-4 border-blue-600' 
                      : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800'
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  {tab.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

const LoginPage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
    } catch (err) {
      setError('AUTHENTICATION_FAILED: SOURCE_UNTRUSTED');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/5 blur-[120px] rounded-full pointer-events-none" />
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-tactical-card border border-tactical-border rounded-[2.5rem] p-12 shadow-2xl text-center space-y-10 relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-blue-500/50" />
        
        <div className="relative inline-block">
          <div className="p-6 rounded-3xl bg-black/40 border border-tactical-border shadow-inner relative z-10">
            <Lock className="w-12 h-12 text-blue-500" />
          </div>
          <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full" />
        </div>
        
        <div className="space-y-3">
          <h2 className="text-4xl font-black tracking-tighter text-white uppercase italic">Secure_Uplink</h2>
          <p className="text-zinc-600 text-[10px] font-mono uppercase tracking-[0.4em]">Authorized_Personnel_Only</p>
        </div>

        <div className="p-8 bg-black/40 rounded-[2rem] border border-tactical-border text-left space-y-5 relative">
          <div className="flex items-start gap-4">
            <div className="mt-1 w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
            <p className="text-[11px] text-zinc-500 font-medium uppercase tracking-widest leading-relaxed">Direct access to federal crime database and suspect intelligence.</p>
          </div>
          <div className="flex items-start gap-4">
            <div className="mt-1 w-1.5 h-1.5 rounded-full bg-zinc-700 shadow-[0_0_8px_rgba(63,63,70,0.5)]" />
            <p className="text-[11px] text-zinc-500 font-medium uppercase tracking-widest leading-relaxed">Encrypted real-time field data and operative monitoring.</p>
          </div>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 text-[9px] font-mono rounded-xl flex items-center gap-3 uppercase tracking-widest"
          >
            <AlertCircle className="w-4 h-4" />
            {error}
          </motion.div>
        )}

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-5 rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] transition-all flex items-center justify-center gap-4 shadow-[0_0_30px_rgba(37,99,235,0.2)] active:scale-95 disabled:bg-zinc-800 disabled:text-zinc-600"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <LogIn className="w-5 h-5" />
              Initialize_Link
            </>
          )}
        </button>

        <p className="text-[9px] text-zinc-600 font-mono uppercase tracking-[0.2em] leading-relaxed italic">
          Identity verification required. All activity is logged under the Federal Data Secrecy Act.
        </p>
      </motion.div>
    </div>
  );
};

const HomePage = ({ user, setActiveTab, onViewCase }: { user: User | null, setActiveTab: (tab: string) => void, onViewCase: (id: number) => void }) => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [logs, setLogs] = useState<AccessLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, logsRes] = await Promise.all([
          fetch('/api/stats'),
          fetch('/api/access-logs')
        ]);
        const statsData = await statsRes.json();
        const logsData = await logsRes.json();
        setStats(statsData);
        setLogs(logsData);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const statCards = [
    { label: 'Intelligence Records', value: stats?.cases, icon: Database, color: 'text-blue-500', bg: 'bg-blue-500/10', tab: 'cases' },
    { label: 'Tracked Suspects', value: stats?.suspects, icon: UserPlus, color: 'text-red-500', bg: 'bg-red-500/10', tab: 'search' },
    { label: 'Field Officers', value: stats?.officers, icon: UserCheck, color: 'text-emerald-500', bg: 'bg-emerald-500/10', tab: 'combined' },
    { label: 'Cases Resolved', value: stats?.solved, icon: CheckCircle2, color: 'text-amber-500', bg: 'bg-amber-500/10', tab: 'cases' },
  ];

  return (
    <div className="space-y-10 py-10 max-w-7xl mx-auto px-4">
      {/* Hero / Welcome Section */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-8 bg-zinc-950 rounded-3xl p-8 md:p-12 text-white overflow-hidden relative border border-tactical-border shadow-2xl">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
          <Shield className="w-64 h-64 -mr-20 -mt-20" />
        </div>
        
        <div className="space-y-6 relative z-10 text-center md:text-left">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 bg-blue-600/10 border border-blue-500/20 rounded-full"
          >
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-[0.3em] text-blue-400">Node_CID_Alpha: Priority_Enabled</span>
          </motion.div>
          
          <div className="space-y-1">
            <h2 className="text-3xl md:text-4xl font-black tracking-tighter uppercase leading-tight italic">
              Terminal Access: <span className="text-blue-500">{user?.displayName?.split(' ')[0] || 'Agent'}</span>
            </h2>
            <p className="text-zinc-500 font-mono text-xs uppercase tracking-[0.2em] max-w-xl">
              CID Central Command Interface. Authorized personnel entry only.
            </p>
          </div>
          
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-[10px] font-mono text-zinc-500 uppercase tracking-tighter">
            <div className="flex items-center gap-2 bg-zinc-900 px-3 py-1.5 rounded-lg border border-tactical-border">
              <span className="text-zinc-600">DB:</span>
              <span className="text-green-500 font-bold">UPLINK_STABLE</span>
            </div>
            <div className="flex items-center gap-2 bg-zinc-900 px-3 py-1.5 rounded-lg border border-tactical-border">
              <span className="text-zinc-600">CRYPTO:</span>
              <span className="text-blue-500 font-bold">ECC-4096</span>
            </div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="relative bg-zinc-900 p-8 rounded-2xl border border-tactical-border shadow-2xl scale-110 md:scale-100 hidden lg:block"
        >
          <div className="absolute inset-0 bg-blue-600/10 blur-3xl rounded-full" />
          <Shield className="w-16 h-16 text-blue-500 relative z-10 shadow-[0_0_20px_rgba(59,130,246,0.3)]" />
        </motion.div>
      </div>

      {/* Stats Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            onClick={() => setActiveTab(item.tab)}
            className="bg-tactical-card border border-tactical-border p-6 rounded-3xl shadow-lg hover:border-blue-500/50 transition-all group overflow-hidden relative cursor-pointer active:scale-95"
          >
            <div className={`${item.bg} p-3 rounded-2xl w-fit mb-4 transition-transform group-hover:scale-110`}>
              <item.icon className={`w-6 h-6 ${item.color}`} />
            </div>
            <div className="space-y-0.5">
              <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-bold">{item.label}</p>
              <div className="text-3xl font-black text-white tracking-tighter italic">
                {loading ? <div className="w-12 h-8 bg-zinc-800 animate-pulse rounded" /> : item.value}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="max-w-2xl mx-auto">
        {/* Database Intrusion Detector */}
        <div className="space-y-4">
          <div className="border-b border-tactical-border pb-2 text-center">
            <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] flex items-center justify-center gap-2 italic">
              <Shield className="w-4 h-4 text-red-500" />
              Intrusion Detection System
            </h3>
          </div>
          
          <div className="bg-tactical-card border border-tactical-border rounded-3xl p-6 space-y-6 shadow-2xl overflow-hidden relative">
            <div className="absolute top-0 right-0 w-24 h-24 bg-red-600/5 rounded-full -mr-12 -mt-12 pointer-events-none" />
            
            <div className="space-y-4 relative z-10">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Global_Net_Monitor</p>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-ping" />
                  <span className="text-[10px] font-bold text-red-500 uppercase">Probing...</span>
                </div>
              </div>

              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {logs.map((log, i) => (
                  <motion.div 
                    key={log.log_id}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className={`p-4 rounded-xl border ${
                      log.status === 'BLOCKED' || log.status === 'DENIED' 
                        ? 'bg-red-950/20 border-red-900/50 text-red-200' 
                        : 'bg-zinc-900 border-zinc-800 text-zinc-300'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] font-mono font-bold tracking-tight text-zinc-400">{log.ip_address}</span>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-tighter ${
                        log.status === 'BLOCKED' || log.status === 'DENIED' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'
                      }`}>
                        {log.status}
                      </span>
                    </div>
                    <p className="text-xs font-bold uppercase tracking-tight truncate">{log.attempt_type}</p>
                    <div className="flex justify-between items-center mt-3 opacity-40">
                      <span className="text-[9px] font-mono">{log.location}</span>
                      <span className="text-[9px] font-mono">{new Date(log.timestamp).toLocaleTimeString()}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="p-4 bg-black rounded-2xl space-y-3 border border-tactical-border">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-mono text-zinc-600 uppercase italic">Encryption: RSA-4096-AES</span>
                <span className="text-[9px] font-mono text-blue-500 uppercase font-black tracking-widest">Active_Shield</span>
              </div>
              <div className="h-1 bg-zinc-900 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 2, repeat: Infinity, repeatType: "loop", ease: "linear" }}
                  className="h-full bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,1)]" 
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const CasesPage = ({ onViewSuspects }: { onViewSuspects: (id: number) => void }) => {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    fetch('/api/cases')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setCases(data);
        } else {
          setCases([]);
        }
        setLoading(false);
      })
      .catch(err => {
        setCases([]);
        setLoading(false);
      });
  }, []);

  const filteredCases = cases.filter(c => 
    c.case_title.toLowerCase().includes(filter.toLowerCase()) || 
    c.crime_type.toLowerCase().includes(filter.toLowerCase()) ||
    c.location.toLowerCase().includes(filter.toLowerCase())
  );

  if (loading) return (
    <div className="p-12 text-center space-y-4">
      <div className="w-8 h-8 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto" />
      <p className="text-[10px] text-blue-500 font-mono tracking-[0.4em] uppercase">Initializing Secure Uplink...</p>
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-tactical-border pb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20">
            <FileText className="text-blue-500 w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic">
              Investigation_Ledger
            </h2>
            <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-[0.4em] mt-1">Global_Intelligence_Database</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600" />
            <input 
              type="text"
              placeholder="SEARCH_LEDGER..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="bg-black/40 border border-tactical-border rounded-xl py-2.5 pl-9 pr-4 text-[10px] font-mono text-white focus:outline-none focus:border-blue-500/50 w-64 uppercase"
            />
          </div>
          <div className="flex items-center gap-2 px-4 py-2.5 bg-zinc-900 border border-tactical-border rounded-xl text-[10px] font-mono text-zinc-500 uppercase">
            Total_Manifest: <span className="text-blue-500 font-black">{cases.length}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCases.map((c, i) => (
          <motion.div
            key={c.case_id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            className="group relative bg-tactical-card border border-tactical-border rounded-[2rem] overflow-hidden hover:border-blue-500/40 transition-all shadow-2xl p-6"
          >
            <div className="absolute top-0 right-0 p-6 opacity-[0.03] pointer-events-none group-hover:opacity-[0.08] transition-opacity">
              <Shield className="w-32 h-32 -mr-12 -mt-12" />
            </div>

            <div className="flex justify-between items-start mb-6">
              <div className="space-y-1">
                <span className="text-[8px] font-mono text-blue-500 font-bold uppercase tracking-[0.3em]">Case_Node_#{c.case_id.toString().padStart(4, '0')}</span>
                <h3 className="text-lg font-black text-white uppercase tracking-tight italic group-hover:text-blue-400 transition-colors">{c.case_title}</h3>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest border ${
                  c.status === 'Solved' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                  c.status === 'Ongoing' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                  'bg-zinc-800 text-zinc-500 border-zinc-700'
                }`}>
                  {c.status}
                </span>
                <span className="text-[10px] font-mono text-zinc-600 uppercase font-black tracking-widest italic">S0{c.season}</span>
              </div>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-zinc-900 border border-tactical-border rounded-lg">
                  <ShieldAlert className="w-3.5 h-3.5 text-zinc-400" />
                </div>
                <p className="text-xs text-zinc-400 font-medium italic">{c.crime_type}</p>
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-black/20 border border-tactical-border/50 p-2 rounded-xl text-center">
                  <p className="text-[8px] text-zinc-600 uppercase font-bold mb-1">Suspects</p>
                  <p className="text-xs font-black text-white">{c.suspect_count || 0}</p>
                </div>
                <div className="bg-black/20 border border-tactical-border/50 p-2 rounded-xl text-center">
                  <p className="text-[8px] text-zinc-600 uppercase font-bold mb-1">Evidence</p>
                  <p className="text-xs font-black text-emerald-500">{c.evidence_count || 0}</p>
                </div>
                <div className="bg-black/20 border border-tactical-border/50 p-2 rounded-xl text-center">
                  <p className="text-[8px] text-zinc-600 uppercase font-bold mb-1">Civilians</p>
                  <p className="text-xs font-black text-amber-500">{c.civilian_count || 0}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-zinc-900 border border-tactical-border rounded-lg">
                  <Database className="w-3.5 h-3.5 text-zinc-400" />
                </div>
                <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-tight">{c.location}</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-tactical-border">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                <span className="text-[10px] font-mono text-zinc-600 font-bold uppercase">{c.year} ARCHIVE</span>
              </div>
              <button 
                onClick={() => onViewSuspects(c.case_id)}
                className="bg-blue-600/10 hover:bg-blue-600 text-blue-500 hover:text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border border-blue-500/30 flex items-center gap-2"
              >
                UPLINK_INTEL
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

const SearchPage = ({ initialCaseId }: { initialCaseId?: string }) => {
  const [caseId, setCaseId] = useState(initialCaseId || '');
  const [suspects, setSuspects] = useState<Suspect[]>([]);
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [civilians, setCivilians] = useState<Civilian[]>([]);
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (initialCaseId) {
      performSearch(initialCaseId);
    }
  }, [initialCaseId]);

  const performSearch = async (id: string) => {
    setLoading(true);
    setSearched(false);
    try {
      const [suspectsRes, officersRes, civiliansRes, evidenceRes] = await Promise.all([
        fetch(`/api/cases/${id}/suspects`),
        fetch(`/api/cases/${id}/officers`),
        fetch(`/api/cases/${id}/civilians`),
        fetch(`/api/cases/${id}/evidence`)
      ]);

      const suspectsData = await suspectsRes.json();
      const officersData = await officersRes.json();
      const civiliansData = await civiliansRes.json();
      const evidenceData = await evidenceRes.json();

      setSuspects(Array.isArray(suspectsData) ? suspectsData : []);
      setOfficers(Array.isArray(officersData) ? officersData : []);
      setCivilians(Array.isArray(civiliansData) ? civiliansData : []);
      setEvidence(Array.isArray(evidenceData) ? evidenceData : []);
    } catch (err) {
      console.error('Search error:', err);
      setSuspects([]);
      setOfficers([]);
      setCivilians([]);
      setEvidence([]);
    } finally {
      setLoading(false);
      setSearched(true);
    }
  };

  const handleSearch = (e: any) => {
    e.preventDefault();
    if (!caseId) return;
    performSearch(caseId);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      <div className="bg-tactical-card border border-tactical-border p-8 rounded-3xl shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />
        <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic mb-6 flex items-center gap-3">
          <Search className="text-blue-500" />
          Intelligence_Query_Module
        </h2>
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
            <input
              type="number"
              placeholder="ENTER TARGET CASE_ID..."
              value={caseId}
              onChange={(e) => setCaseId(e.target.value)}
              className="w-full bg-black/40 border border-tactical-border rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all font-mono text-sm"
            />
          </div>
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-black uppercase tracking-[0.2em] text-[10px] transition-all active:scale-95 shadow-[0_0_20px_rgba(37,99,235,0.3)] flex items-center gap-2"
          >
            EXECUTE_LINK
          </button>
        </form>
      </div>

      {loading && (
        <div className="text-center py-12 space-y-4">
          <div className="w-8 h-8 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto" />
          <p className="text-[10px] text-zinc-500 font-mono tracking-[0.5em] uppercase">Accessing_Encrypted_Nodes...</p>
        </div>
      )}

      {searched && !loading && (
        <div className="space-y-12">
          {/* Suspects Section */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 border-b border-tactical-border pb-3">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <h3 className="text-xs font-black text-white uppercase tracking-[0.3em] italic">
                Identified_Targets ({suspects.length})
              </h3>
            </div>
            {suspects.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {suspects.map((s) => (
                  <motion.div
                    key={s.suspect_id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-tactical-card border border-tactical-border p-6 rounded-2xl relative overflow-hidden group hover:border-red-500/30 transition-all shadow-xl"
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full -mr-12 -mt-12 pointer-events-none" />
                    <div className="flex justify-between items-start mb-4 relative z-10">
                      <div>
                        <h4 className="text-lg font-black text-white uppercase tracking-tighter italic">{s.name}</h4>
                        {s.alias && <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest mt-1">Alias: {s.alias}</p>}
                        <p className="text-[9px] font-mono text-blue-500/70 mt-2 uppercase">Subject_Record: #{s.suspect_id}</p>
                      </div>
                      <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${
                        s.status === 'Arrested' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                        s.status === 'Deceased' ? 'bg-zinc-800 text-zinc-500 border-zinc-700' :
                        'bg-red-500/10 text-red-500 border-red-500/20 animate-pulse'
                      }`}>
                        {s.status}
                      </span>
                    </div>
                    <p className="text-zinc-400 text-xs leading-relaxed border-l-2 border-tactical-border pl-4 font-medium italic relative z-10">
                      {s.background}
                    </p>
                  </motion.div>
                ))}
              </div>
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-12 text-center bg-black/40 border border-dashed border-tactical-border rounded-2xl text-zinc-600 text-[10px] font-mono uppercase tracking-[0.2em]"
              >
                No linked target data found for current query ID.
              </motion.div>
            )}
          </section>

          {/* Officers Section */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 border-b border-tactical-border pb-3">
              <UserCheck className="w-5 h-5 text-blue-500" />
              <h3 className="text-xs font-black text-white uppercase tracking-[0.3em] italic">
                Deployed_Personnel ({officers.length})
              </h3>
            </div>
            {officers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {officers.map((o) => (
                  <motion.div
                    key={o.officer_id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-zinc-950 text-white p-5 rounded-2xl border border-tactical-border shadow-2xl relative overflow-hidden group"
                  >
                    <div className="absolute top-0 left-0 w-full h-1 bg-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2.5 bg-blue-600/10 border border-blue-500/30 rounded-xl relative">
                        <Shield className="w-4 h-4 text-blue-500" />
                        <div className="absolute inset-0 bg-blue-500/10 blur-md rounded-xl" />
                      </div>
                      <div>
                        <h4 className="text-xs font-extrabold tracking-tight uppercase">{o.name}</h4>
                        <p className="text-[9px] text-zinc-500 font-mono uppercase tracking-tighter mt-0.5 italic">{o.officer_rank}</p>
                      </div>
                    </div>
                    <div className="space-y-3 pt-3 border-t border-tactical-border">
                      <div className="flex justify-between items-center text-[9px] uppercase tracking-[0.2em] font-mono">
                        <span className="text-zinc-600">Assigned_Role:</span>
                        <span className="text-blue-400 font-black italic">{o.role || 'Investigator'}</span>
                      </div>
                      <div className="flex justify-between items-center text-[9px] uppercase tracking-[0.2em] font-mono">
                        <span className="text-zinc-600">Department:</span>
                        <span className="text-zinc-400">{o.department}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="p-10 text-center bg-black/40 border border-dashed border-tactical-border rounded-xl text-zinc-600 text-[10px] font-mono tracking-[0.2em]">
                NO DEPLOYED PERSONNEL LOGGED.
              </div>
            )}
          </section>

          {/* Evidence Section */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 border-b border-tactical-border pb-3">
              <Fingerprint className="w-5 h-5 text-emerald-500" />
              <h3 className="text-xs font-black text-white uppercase tracking-[0.3em] italic">
                Forensic_Physical_Evidence ({evidence.length})
              </h3>
            </div>
            {evidence.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {evidence.map((e) => (
                  <motion.div
                    key={e.evidence_id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-tactical-card border border-tactical-border p-6 rounded-2xl relative overflow-hidden group hover:border-emerald-500/30 transition-all shadow-xl"
                  >
                    <div className="flex justify-between items-start mb-4 relative z-10">
                      <div>
                        <h4 className="text-[10px] font-mono text-emerald-500 uppercase tracking-[0.2em] mb-1">{e.evidence_type}</h4>
                        <p className="text-sm font-black text-white uppercase italic tracking-tight">{e.description}</p>
                      </div>
                      {e.is_key === 'YES' && (
                        <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded border bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                          CRITICAL_ASSET
                        </span>
                      )}
                    </div>
                    <div className="pt-4 border-t border-tactical-border">
                      <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">Logged_By: <span className="text-zinc-300 font-bold">{e.collected_by}</span></p>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="p-10 text-center bg-black/40 border border-dashed border-tactical-border rounded-xl text-zinc-600 text-[10px] font-mono tracking-[0.2em]">
                NO FORENSIC DATA RECOVERED.
              </div>
            )}
          </section>

          {/* Civilians Section */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 border-b border-tactical-border pb-3">
              <Users className="w-5 h-5 text-amber-500" />
              <h3 className="text-xs font-black text-white uppercase tracking-[0.3em] italic">
                Related_Civilians ({civilians.length})
              </h3>
            </div>
            {civilians.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {civilians.map((c) => (
                  <motion.div
                    key={c.civilian_id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-tactical-card border border-tactical-border p-5 rounded-2xl relative overflow-hidden group hover:bg-black/60 transition-all shadow-xl"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                        <Users className="w-4 h-4 text-amber-500" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-white uppercase tracking-tight italic">{c.name}</h4>
                        <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mt-0.5">{c.role}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="p-10 text-center bg-black/40 border border-dashed border-tactical-border rounded-xl text-zinc-600 text-[10px] font-mono tracking-[0.2em]">
                NO RELATED CIVILIAN ENTITIES DETECTED.
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
};

const AddSuspectPage = ({ onViewSuspects }: { onViewSuspects: (id: number) => void }) => {
  const [activeSubTab, setActiveSubTab] = useState<'suspect' | 'case'>('suspect');
  const [formData, setFormData] = useState({
    name: '',
    alias: '',
    background: '',
    status: 'At Large',
    caseId: ''
  });
  const [caseFormData, setCaseFormData] = useState({
    case_title: '',
    crime_type: '',
    location: '',
    year: new Date().getFullYear(),
    season: 1,
    status: 'Ongoing'
  });
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    try {
      const res = await fetch('/api/suspects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();

      if (res.ok) {
        setStatus({ type: 'success', message: `Identity Logged: Record_ID_${data.id}` });
        const addedCaseId = formData.caseId;
        setFormData({ name: '', alias: '', background: '', status: 'At Large', caseId: '' });
        
        if (addedCaseId) {
          setTimeout(() => {
            if (window.confirm('Suspect linked to case. View linked intelligence?')) {
              onViewSuspects(parseInt(addedCaseId));
            }
          }, 500);
        }
      } else {
        setStatus({ type: 'error', message: data.error || 'Identity commitment failed' });
      }
    } catch (err) {
      setStatus({ type: 'error', message: 'Transmission Error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCaseSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    try {
      const res = await fetch('/api/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(caseFormData)
      });
      const data = await res.json();

      if (res.ok) {
        setStatus({ type: 'success', message: `Case Registered: NODE_ID_${data.id}` });
        setCaseFormData({
          case_title: '',
          crime_type: '',
          location: '',
          year: new Date().getFullYear(),
          season: 1,
          status: 'Ongoing'
        });
      } else {
        setStatus({ type: 'error', message: data.error || 'Case registration failed' });
      }
    } catch (err) {
      setStatus({ type: 'error', message: 'Transmission Error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex gap-2 p-1 bg-zinc-900 border border-tactical-border rounded-2xl w-fit mx-auto shadow-inner">
        <button 
          onClick={() => { setActiveSubTab('suspect'); setStatus(null); }}
          className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeSubTab === 'suspect' ? 'bg-blue-600 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          Target_Logger
        </button>
        <button 
          onClick={() => { setActiveSubTab('case'); setStatus(null); }}
          className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeSubTab === 'case' ? 'bg-emerald-600 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          Ledger_Updater
        </button>
      </div>

      <div className="bg-tactical-card border border-tactical-border rounded-3xl overflow-hidden shadow-2xl relative">
        <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${activeSubTab === 'suspect' ? 'from-red-500/50 via-blue-500/50 to-red-500/50' : 'from-emerald-500/50 via-blue-500/50 to-emerald-500/50'}`} />
        
        <div className="bg-black/40 p-8 border-b border-tactical-border">
          <div className="flex items-center gap-3">
            {activeSubTab === 'suspect' ? <UserPlus className="text-blue-500 w-6 h-6" /> : <FileText className="text-emerald-500 w-6 h-6" />}
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic">
              {activeSubTab === 'suspect' ? 'Target_Registration_Portal' : 'Investigation_Ledger_Nexus'}
            </h2>
          </div>
          <p className="text-zinc-500 text-[10px] font-mono mt-2 uppercase tracking-[0.3em]">SECURE_INTEL_UPLINK_01</p>
        </div>

        {activeSubTab === 'suspect' ? (
          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                  <span className="w-1 h-1 bg-blue-500 rounded-full" />
                  Legal_Identification
                </label>
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-black/40 border border-tactical-border rounded-xl p-4 text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all font-mono text-sm"
                  placeholder="TARGET_NAME"
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                  <span className="w-1 h-1 bg-zinc-700 rounded-full" />
                  Operational_Alias
                </label>
                <input
                  type="text"
                  value={formData.alias}
                  onChange={(e) => setFormData({ ...formData, alias: e.target.value })}
                  className="w-full bg-black/40 border border-tactical-border rounded-xl p-4 text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all font-mono text-sm"
                  placeholder="AKA / CODE_NAME"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                  <span className="w-1 h-1 bg-amber-500 rounded-full" />
                  Current_Class
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full bg-black/40 border border-tactical-border rounded-xl p-4 text-white focus:outline-none focus:border-blue-500/50 transition-all font-mono text-sm appearance-none"
                >
                  <option className="bg-zinc-900">At Large</option>
                  <option className="bg-zinc-900">Arrested</option>
                  <option className="bg-zinc-900">Deceased</option>
                  <option className="bg-zinc-900">Unknown</option>
                </select>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                  <span className="w-1 h-1 bg-blue-500 rounded-full" />
                  Linked_Case_Node
                </label>
                <input
                  type="number"
                  value={formData.caseId}
                  onChange={(e) => setFormData({ ...formData, caseId: e.target.value })}
                  className="w-full bg-black/40 border border-tactical-border rounded-xl p-4 text-white focus:outline-none focus:border-blue-500/50 transition-all font-mono text-sm"
                  placeholder="CASE_UID"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                <span className="w-1 h-1 bg-red-500 rounded-full" />
                Intelligence_Background
              </label>
              <textarea
                rows={4}
                value={formData.background}
                onChange={(e) => setFormData({ ...formData, background: e.target.value })}
                className="w-full bg-black/40 border border-tactical-border rounded-xl p-4 text-white focus:outline-none focus:border-blue-500 resize-none transition-all font-mono text-sm"
                placeholder="ENTER KNOWN CRIMINAL HISTORY AND BEHAVIORAL PATTERNS..."
              />
            </div>

            <button
              disabled={loading}
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-800 disabled:text-zinc-600 text-white py-5 rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] transition-all flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(37,99,235,0.2)] active:scale-95"
            >
              {loading ? 'MODULATING_SIGNAL...' : (
                <>
                  <ShieldAlert className="w-4 h-4" />
                  Commit_Target_To_Nexus
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleCaseSubmit} className="p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3 md:col-span-2">
                <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                  <span className="w-1 h-1 bg-emerald-500 rounded-full" />
                  Investigation_Title
                </label>
                <input
                  required
                  type="text"
                  value={caseFormData.case_title}
                  onChange={(e) => setCaseFormData({ ...caseFormData, case_title: e.target.value })}
                  className="w-full bg-black/40 border border-tactical-border rounded-xl p-4 text-white focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all font-mono text-sm"
                  placeholder="e.g. Operation_Mantle"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                  <span className="w-1 h-1 bg-zinc-700 rounded-full" />
                  Crime_Classification
                </label>
                <input
                  type="text"
                  value={caseFormData.crime_type}
                  onChange={(e) => setCaseFormData({ ...caseFormData, crime_type: e.target.value })}
                  className="w-full bg-black/40 border border-tactical-border rounded-xl p-4 text-white focus:outline-none focus:border-emerald-500/50 font-mono text-sm"
                  placeholder="e.g. Espionage"
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                  <span className="w-1 h-1 bg-zinc-700 rounded-full" />
                  Jurisdiction_Vector
                </label>
                <input
                  type="text"
                  value={caseFormData.location}
                  onChange={(e) => setCaseFormData({ ...caseFormData, location: e.target.value })}
                  className="w-full bg-black/40 border border-tactical-border rounded-xl p-4 text-white focus:outline-none focus:border-emerald-500/50 font-mono text-sm"
                  placeholder="e.g. Mumbai Sector 4"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-3">
                <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                  Temporal_Year
                </label>
                <input
                  type="number"
                  value={caseFormData.year}
                  onChange={(e) => setCaseFormData({ ...caseFormData, year: parseInt(e.target.value) })}
                  className="w-full bg-black/40 border border-tactical-border rounded-xl p-4 text-white focus:outline-none focus:border-emerald-500/50 font-mono text-sm"
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                  Phase_Season
                </label>
                <input
                  type="number"
                  value={caseFormData.season}
                  onChange={(e) => setCaseFormData({ ...caseFormData, season: parseInt(e.target.value) })}
                  className="w-full bg-black/40 border border-tactical-border rounded-xl p-4 text-white focus:outline-none focus:border-emerald-500/50 font-mono text-sm"
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                  Deployment_Status
                </label>
                <select
                  value={caseFormData.status}
                  onChange={(e) => setCaseFormData({ ...caseFormData, status: e.target.value })}
                  className="w-full bg-black/40 border border-tactical-border rounded-xl p-4 text-white focus:outline-none focus:border-emerald-500/50 font-mono text-sm appearance-none"
                >
                  <option className="bg-zinc-900">Ongoing</option>
                  <option className="bg-zinc-900">Solved</option>
                  <option className="bg-zinc-900">Cold</option>
                </select>
              </div>
            </div>

            <button
              disabled={loading}
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-zinc-800 disabled:text-zinc-600 text-white py-5 rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] transition-all flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(16,185,129,0.2)] active:scale-95"
            >
              {loading ? 'SYNCHRONIZING...' : (
                <>
                  <Database className="w-4 h-4" />
                  Append_To_Global_Ledger
                </>
              )}
            </button>
          </form>
        )}

        <AnimatePresence>
          {status && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`mx-8 mb-8 p-5 rounded-2xl flex items-center gap-4 border ${
                status.type === 'success' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'
              }`}
            >
              {status.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              <span className="text-[10px] font-mono uppercase tracking-widest">{status.message}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

const OfficersPage = ({ onViewCase }: { onViewCase: (id: number) => void }) => {
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOfficer, setSelectedOfficer] = useState<Officer | null>(null);
  const [officerCases, setOfficerCases] = useState<Case[]>([]);
  const [officerCivilians, setOfficerCivilians] = useState<Civilian[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showAddCivilianForm, setShowAddCivilianForm] = useState(false);
  const [newOfficer, setNewOfficer] = useState({ name: '', officer_rank: '', department: '', season: '1' });
  const [newCivilian, setNewCivilian] = useState({ name: '', role: '', season: '1' });
  const [formStatus, setFormStatus] = useState<string | null>(null);
  const [civilianFormStatus, setCivilianFormStatus] = useState<string | null>(null);

  const fetchOfficers = () => {
    setLoading(true);
    fetch('/api/officers')
      .then(res => res.json())
      .then(data => {
        setOfficers(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchOfficers();
  }, []);

  const handleViewDetails = async (officer: Officer) => {
    setSelectedOfficer(officer);
    try {
      const [casesRes, civiliansRes] = await Promise.all([
        fetch(`/api/officers/${officer.officer_id}/cases`),
        fetch(`/api/officers/${officer.officer_id}/civilians`)
      ]);
      const casesData = await casesRes.json();
      const civiliansData = await civiliansRes.json();
      setOfficerCases(Array.isArray(casesData) ? casesData : []);
      setOfficerCivilians(Array.isArray(civiliansData) ? civiliansData : []);
    } catch (err) {
      console.error(err);
      setOfficerCases([]);
      setOfficerCivilians([]);
    }
  };

  const handleAddOfficer = async (e: FormEvent) => {
    e.preventDefault();
    setFormStatus('Processing...');
    try {
      const res = await fetch('/api/officers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOfficer)
      });
      if (res.ok) {
        setFormStatus('Success! Officer added.');
        setNewOfficer({ name: '', officer_rank: '', department: '', season: '1' });
        fetchOfficers();
        setTimeout(() => {
          setFormStatus(null);
          setShowAddForm(false);
        }, 2000);
      } else {
        setFormStatus('Error: Failed to add officer.');
      }
    } catch (err) {
      setFormStatus('Network error.');
    }
  };

  const handleAddCivilian = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedOfficer) return;
    setCivilianFormStatus('Linking...');
    try {
      const res = await fetch(`/api/officers/${selectedOfficer.officer_id}/civilians`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCivilian)
      });
      if (res.ok) {
        setCivilianFormStatus('Linked!');
        setNewCivilian({ name: '', role: '', season: '1' });
        handleViewDetails(selectedOfficer);
        setTimeout(() => {
          setCivilianFormStatus(null);
          setShowAddCivilianForm(false);
        }, 2000);
      } else {
        setCivilianFormStatus('Failed.');
      }
    } catch (err) {
      setCivilianFormStatus('Error.');
    }
  };

  if (loading && !selectedOfficer) return (
    <div className="p-12 text-center space-y-4">
      <div className="w-8 h-8 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto" />
      <p className="text-[10px] text-blue-500 font-mono tracking-[0.4em] uppercase">Connecting_To_Bureau_Feed...</p>
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between border-b border-tactical-border pb-6">
        <div className="flex items-center gap-3">
          <UserCheck className="text-blue-500 w-6 h-6" />
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic">
            Bureau_Directory
          </h2>
        </div>
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] active:scale-95"
        >
          {showAddForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showAddForm ? 'Abort_Entry' : 'Register_Officer'}
        </button>
      </div>

      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-tactical-card border border-tactical-border rounded-3xl overflow-hidden shadow-2xl relative"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-blue-500" />
            <form onSubmit={handleAddOfficer} className="p-8 grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
              <div className="space-y-2">
                <label className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">Full_Name</label>
                <input 
                  required
                  type="text" 
                  value={newOfficer.name} 
                  onChange={e => setNewOfficer({...newOfficer, name: e.target.value})}
                  className="w-full bg-black/40 border border-tactical-border rounded-xl p-3 text-sm text-white focus:outline-none focus:border-blue-500/50"
                  placeholder="Enter Name..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">Official_Rank</label>
                <input 
                  type="text" 
                  value={newOfficer.officer_rank} 
                  onChange={e => setNewOfficer({...newOfficer, officer_rank: e.target.value})}
                  className="w-full bg-black/40 border border-tactical-border rounded-xl p-3 text-sm text-white focus:outline-none focus:border-blue-500/50"
                  placeholder="e.g. Inspector"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">Division</label>
                <input 
                  type="text" 
                  value={newOfficer.department} 
                  onChange={e => setNewOfficer({...newOfficer, department: e.target.value})}
                  className="w-full bg-black/40 border border-tactical-border rounded-xl p-3 text-sm text-white focus:outline-none focus:border-blue-500/50"
                  placeholder="e.g. Special Ops"
                />
              </div>
              <button 
                type="submit"
                className="bg-zinc-800 hover:bg-zinc-700 text-blue-500 border border-tactical-border py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all mb-0.5"
              >
                {formStatus || 'Commit_Identity'}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-3 max-h-[70vh] overflow-y-auto pr-3 custom-scrollbar">
          {officers.map((o) => (
            <motion.div
              key={o.officer_id}
              onClick={() => handleViewDetails(o)}
              className={`p-5 rounded-2xl border cursor-pointer transition-all relative overflow-hidden group ${
                selectedOfficer?.officer_id === o.officer_id 
                  ? 'bg-blue-600 border-blue-500 text-white shadow-[0_0_30px_rgba(37,99,235,0.3)] translate-x-3' 
                  : 'bg-tactical-card border-tactical-border text-zinc-400 hover:border-blue-500/50 hover:bg-tactical-card/80'
              }`}
            >
              {selectedOfficer?.officer_id === o.officer_id && (
                <div className="absolute top-0 right-0 p-4 opacity-20">
                  <Shield className="w-12 h-12 -mr-6 -mt-6" />
                </div>
              )}
              <div className="flex items-center gap-4 relative z-10">
                <div className={`p-2.5 rounded-xl border ${selectedOfficer?.officer_id === o.officer_id ? 'bg-white/20 border-white/30' : 'bg-black/40 border-tactical-border'}`}>
                  <Shield className={`w-4 h-4 ${selectedOfficer?.officer_id === o.officer_id ? 'text-white' : 'text-blue-500'}`} />
                </div>
                <div>
                  <h4 className="text-sm font-black uppercase tracking-tight">{o.name}</h4>
                  <p className={`text-[9px] font-mono uppercase tracking-[0.2em] mt-0.5 ${selectedOfficer?.officer_id === o.officer_id ? 'text-white/70' : 'text-zinc-600'}`}>
                    {o.officer_rank}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            {selectedOfficer ? (
              <motion.div
                key={selectedOfficer.officer_id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-tactical-card border border-tactical-border rounded-3xl p-8 space-y-8 shadow-2xl relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-[100px] -mr-32 -mt-32 pointer-events-none" />
                
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-tactical-border pb-8 relative z-10">
                  <div className="space-y-2">
                    <p className="text-[10px] font-mono font-bold text-blue-500 uppercase tracking-[0.4em]">Official_ID_Record</p>
                    <h3 className="text-4xl font-black text-white uppercase tracking-tighter italic leading-none">{selectedOfficer.name}</h3>
                    <div className="flex items-center gap-4 text-[10px] font-mono text-zinc-500 uppercase tracking-widest mt-2">
                      <span className="text-blue-400 font-black">{selectedOfficer.officer_rank}</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-zinc-800" />
                      <span>{selectedOfficer.department}</span>
                    </div>
                  </div>
                  <div className="px-6 py-3 bg-black border border-tactical-border rounded-2xl text-center shadow-inner">
                    <p className="text-[9px] font-mono text-zinc-600 uppercase tracking-tighter mb-1">BUREAU_UID</p>
                    <p className="text-lg font-black text-white font-mono tracking-widest text-blue-500">#{selectedOfficer.officer_id.toString().padStart(5, '0')}</p>
                  </div>
                </div>

                <div className="space-y-6 relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="h-0.5 flex-1 bg-gradient-to-r from-blue-500/50 to-transparent" />
                    <h5 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] whitespace-nowrap">Active_Intelligence_Nodes</h5>
                    <div className="h-0.5 flex-1 bg-gradient-to-l from-blue-500/50 to-transparent" />
                  </div>
                  
                  {officerCases.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4">
                      {officerCases.map((c) => (
                        <div 
                          key={c.case_id}
                          className="flex items-center justify-between p-5 bg-black/40 rounded-2xl border border-tactical-border group hover:border-blue-500/30 transition-all"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-tactical-border flex items-center justify-center text-blue-500 group-hover:text-white group-hover:bg-blue-600 transition-all">
                              <FileText className="w-6 h-6" />
                            </div>
                            <div>
                              <h6 className="text-base font-black text-white uppercase tracking-tight italic group-hover:text-blue-400 transition-colors">{c.case_title}</h6>
                              <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mt-1">
                                Assignment: <span className="text-blue-500 font-black">{(c as any).role || 'Operational_Lead'}</span>
                              </p>
                            </div>
                          </div>
                          <button 
                            onClick={() => onViewCase(c.case_id)}
                            className="bg-zinc-900 border border-tactical-border p-3 rounded-xl hover:border-blue-500/50 transition-all group-hover:scale-110 shadow-lg text-zinc-500 hover:text-blue-500"
                          >
                            <ChevronRight className="w-5 h-5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-12 text-center bg-black/20 border border-dashed border-tactical-border rounded-3xl text-zinc-600 text-[10px] font-mono uppercase tracking-[0.2em] italic">
                      No matching operational logs detected in the secure directory.
                    </div>
                  )}

                   {officerCivilians.length > 0 && (
                    <div className="space-y-4 pt-6">
                      <div className="flex items-center gap-3">
                        <div className="h-0.5 flex-1 bg-gradient-to-r from-amber-500/50 to-transparent" />
                        <h5 className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em] whitespace-nowrap">Known_Assigned_Relations</h5>
                        <div className="h-0.5 flex-1 bg-gradient-to-l from-amber-500/50 to-transparent" />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {officerCivilians.map((civilian) => (
                          <div 
                            key={civilian.civilian_id}
                            className="flex items-center gap-4 p-4 bg-amber-500/5 rounded-2xl border border-amber-500/20"
                          >
                            <div className="p-2 bg-amber-500/20 rounded-xl">
                              <Users className="w-4 h-4 text-amber-500" />
                            </div>
                            <div>
                              <h6 className="text-[11px] font-black text-white uppercase italic">{civilian.name}</h6>
                              <p className="text-[9px] font-mono text-amber-500/70 uppercase tracking-widest">{civilian.role}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-8 border-t border-tactical-border/50">
                    {!showAddCivilianForm ? (
                      <button 
                        onClick={() => setShowAddCivilianForm(true)}
                        className="w-full py-4 border border-dashed border-tactical-border rounded-2xl text-[10px] font-mono text-zinc-500 hover:text-amber-500 hover:border-amber-500/50 hover:bg-amber-500/5 transition-all uppercase tracking-[0.3em]"
                      >
                        + Create_New_Relational_Link
                      </button>
                    ) : (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-6 bg-black/40 border border-tactical-border rounded-3xl space-y-6"
                      >
                        <div className="flex items-center justify-between">
                          <h6 className="text-[10px] font-black text-white uppercase tracking-widest italic">New_Civilian_Intel_Node</h6>
                          <button onClick={() => setShowAddCivilianForm(false)}><X className="w-4 h-4 text-zinc-600" /></button>
                        </div>
                        <form onSubmit={handleAddCivilian} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">Target_Name</label>
                            <input 
                              required
                              type="text" 
                              value={newCivilian.name} 
                              onChange={e => setNewCivilian({...newCivilian, name: e.target.value})}
                              className="w-full bg-zinc-900 border border-tactical-border rounded-xl p-3 text-xs text-white"
                              placeholder="Name..."
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">Identified_Role</label>
                            <input 
                              required
                              type="text" 
                              value={newCivilian.role} 
                              onChange={e => setNewCivilian({...newCivilian, role: e.target.value})}
                              className="w-full bg-zinc-900 border border-tactical-border rounded-xl p-3 text-xs text-white"
                              placeholder="e.g. Spouse, Informant..."
                            />
                          </div>
                          <button 
                            type="submit"
                            className="md:col-span-2 bg-amber-600 hover:bg-amber-700 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                          >
                            {civilianFormStatus || 'Authorize_Linkage'}
                          </button>
                        </form>
                      </motion.div>
                    )}
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="h-full min-h-[400px] flex flex-col items-center justify-center p-12 bg-black/40 border border-dashed border-tactical-border rounded-3xl text-zinc-600 space-y-6">
                <div className="relative">
                  <UserPlus className="w-16 h-16 opacity-10" />
                  <div className="absolute inset-0 bg-blue-500/5 blur-2xl rounded-full" />
                </div>
                <p className="text-[11px] font-mono uppercase tracking-[0.3em] text-center max-w-sm leading-relaxed italic">
                  Select a registered operative from the directory to access field intel and deployment history.
                </p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

const CombinedPage = ({ onViewCase }: { onViewCase: (id: number) => void }) => {
  const [data, setData] = useState<CombinedData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  const fetchCombined = () => {
    setLoading(true);
    fetch('/api/combined-data')
      .then(res => res.json())
      .then(d => {
        if (Array.isArray(d)) {
          setData(d);
        } else {
          setData([]);
        }
        setLoading(false);
      })
      .catch(err => {
        setData([]);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchCombined();
  }, []);

  const filteredData = data.filter(item => 
    item.suspect.toLowerCase().includes(filter.toLowerCase()) ||
    item.case_title.toLowerCase().includes(filter.toLowerCase()) ||
    item.involvement_type.toLowerCase().includes(filter.toLowerCase())
  );

  if (loading) return (
    <div className="p-12 text-center space-y-4">
      <div className="w-8 h-8 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto" />
      <p className="text-[10px] text-blue-500 font-mono tracking-[0.4em] uppercase">Aggregating_Target_Nodes...</p>
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-tactical-border pb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20">
            <Database className="text-blue-500 w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic">
              Relational_Intelligence_Map
            </h2>
            <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-[0.4em] mt-1">Cross_Entity_Linkage_Feed</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600" />
            <input 
              type="text"
              placeholder="FILTER_NODES..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="bg-black/40 border border-tactical-border rounded-xl py-2.5 pl-9 pr-4 text-[10px] font-mono text-white focus:outline-none focus:border-blue-500/50 w-64 uppercase"
            />
          </div>
          <button 
            onClick={fetchCombined}
            className="p-2.5 bg-zinc-900 border border-tactical-border rounded-xl text-zinc-500 hover:text-blue-500 transition-all shadow-lg"
            title="Refresh Intelligence"
          >
            <Network className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <div className="flex items-center gap-2 px-4 py-2.5 bg-zinc-900 border border-tactical-border rounded-xl text-[10px] font-mono text-zinc-500 uppercase">
            Active_Links: <span className="text-blue-500 font-black">{data.length}</span>
          </div>
        </div>
      </div>

      {filteredData.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredData.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className="group relative bg-tactical-card border border-tactical-border rounded-[2.5rem] overflow-hidden hover:border-blue-500/40 transition-all shadow-2xl flex flex-col"
            >
              <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none group-hover:opacity-[0.05] transition-opacity">
                <Network className="w-48 h-48 -mr-12 -mt-12" />
              </div>

              <div className="p-8 flex-1 flex flex-col justify-between space-y-8 relative z-10">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                      <span className="text-[9px] font-mono text-red-500 font-black uppercase tracking-[0.3em]">Identity_Detected</span>
                    </div>
                    <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic leading-none">{item.suspect}</h3>
                    <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.2em] pt-1 italic">
                      {item.involvement_type} // #{item.suspect_id.toString().padStart(4, '0')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest mb-1">State_Flag</p>
                    <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                      item.status === 'Solved' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-black/40 border border-tactical-border rounded-2xl p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Shield className="w-3 h-3 text-blue-500" />
                      <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Bureau_Strength</span>
                    </div>
                    <div className="flex items-end gap-2">
                      <span className="text-2xl font-black text-white italic">{item.officer_count}</span>
                      <span className="text-[8px] font-mono text-zinc-600 uppercase pb-1">Operatives</span>
                    </div>
                  </div>
                  <div className="bg-black/40 border border-tactical-border rounded-2xl p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Fingerprint className="w-3 h-3 text-emerald-500" />
                      <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Evidence_Log</span>
                    </div>
                    <div className="flex items-end gap-2">
                      <span className="text-2xl font-black text-white italic">{item.evidence_count}</span>
                      <span className="text-[8px] font-mono text-zinc-600 uppercase pb-1">Assets</span>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-tactical-border flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-blue-600/10 border border-blue-500/20 rounded-xl">
                      <FileText className="w-4 h-4 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-tight">Case_Reference</p>
                      <h4 className="text-xs font-black text-zinc-100 uppercase italic tracking-tight">{item.case_title}</h4>
                    </div>
                  </div>
                  <button 
                    onClick={() => onViewCase(item.case_id)}
                    className="p-3 bg-zinc-900 border border-tactical-border rounded-xl text-zinc-500 hover:text-white hover:bg-blue-600 hover:border-blue-500 transition-all group-hover:scale-105"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="p-20 text-center bg-tactical-card/50 border border-dashed border-tactical-border rounded-[3rem] space-y-4">
          <Database className="w-12 h-12 text-zinc-800 mx-auto" />
          <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-[0.4em]">Zero Active Relational Links Detected In Current Buffer.</p>
          <button onClick={fetchCombined} className="text-[10px] font-black text-blue-500 uppercase tracking-widest hover:text-blue-400">Re-Initialize_Nexus_Sync</button>
        </div>
      )}
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [selectedCaseId, setSelectedCaseId] = useState<string | undefined>(undefined);
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleViewSuspects = (id: number) => {
    setSelectedCaseId(id.toString());
    setActiveTab('search');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-tactical-bg flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 police-grid opacity-20" />
        <div className="absolute inset-0 police-vignette" />
        <div className="text-center space-y-4 relative z-10">
          <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mx-auto" />
          <p className="text-xs font-mono text-blue-500 uppercase tracking-[0.3em] animate-pulse">Establishing Secure Uplink...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-tactical-bg selection:bg-blue-600 selection:text-white relative">
        <div className="absolute inset-0 police-grid opacity-10 pointer-events-none" />
        <Navbar activeTab="home" setActiveTab={() => {}} user={null} />
        <LoginPage />
      </div>
    );
  }

  const renderContent = () => {
    if (!user) return <LoginPage />;
    
    switch (activeTab) {
      case 'home': return <HomePage user={user} setActiveTab={setActiveTab} onViewCase={handleViewSuspects} />;
      case 'cases': return <CasesPage onViewSuspects={handleViewSuspects} />;
      case 'officers': return <OfficersPage onViewCase={handleViewSuspects} />;
      case 'search': return <SearchPage initialCaseId={selectedCaseId} />;
      case 'add': return <AddSuspectPage onViewSuspects={handleViewSuspects} />;
      case 'combined': return <CombinedPage onViewCase={handleViewSuspects} />;
      default: return <HomePage user={user} setActiveTab={setActiveTab} onViewCase={handleViewSuspects} />;
    }
  };

  return (
    <div className="min-h-screen bg-tactical-bg text-zinc-100 selection:bg-blue-600 selection:text-white flex flex-col relative overflow-hidden">
      {/* Background Layers */}
      <div className="fixed inset-0 police-grid opacity-[0.15] pointer-events-none z-0" />
      <div className="fixed inset-0 police-vignette pointer-events-none z-0" />
      
      {/* Red/Blue Tactical Glows */}
      <div className="fixed -top-40 -left-40 w-96 h-96 bg-blue-900/10 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="fixed -bottom-40 -right-40 w-96 h-96 bg-red-900/10 rounded-full blur-[120px] pointer-events-none z-0" />

      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} user={user} />
      
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab + (user ? 'in' : 'out')}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="border-t border-tactical-border bg-tactical-card/80 backdrop-blur-md py-8 mt-12 relative z-10">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 text-zinc-500">
            <Shield className="w-4 h-4 text-blue-500" />
            <span className="text-[9px] font-mono uppercase tracking-[0.2em]">Alpha_Protocol_v4.2</span>
          </div>
          <p className="text-zinc-500 text-[9px] font-mono uppercase tracking-[0.2em] text-center">
            Central Intelligence Database • Tactical Network Asset • © 2026 CID_ALPHA
          </p>
          <div className="px-3 py-1 bg-zinc-900 border border-tactical-border rounded text-[9px] font-mono text-green-500 uppercase flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            SYSTEM_OPERATIONAL
          </div>
        </div>
      </footer>

      {/* Subtle background technical watermark */}
      <div className="fixed bottom-20 left-10 pointer-events-none opacity-[0.02] select-none z-0">
        <div className="font-black text-[12vw] leading-none tracking-tighter text-white">
          CID_SECURE
        </div>
      </div>
    </div>
  );
}

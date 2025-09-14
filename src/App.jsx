import React, { useState } from 'react'
import { FileText, UserCircle, AlertTriangle, X, Menu, Calendar, MessageCircle, List } from 'lucide-react'
// --- Sample Data ---
// In a real app, this would come from your backend API.
const sampleTrainsData = [
  {
    id: 'TS-01',
    healthScore: 95,
    details: {
      fitnessCertificates: { status: 'Valid', expires: '2025-12-15' },
      jobCardStatus: { status: 'Closed', openJobs: 0 },
      brandingPriority: { level: 'High', contract: 'Nike', exposureNeeded: '15 hrs/week' },
      mileageBalancing: { deviation: -1250, unit: 'km', status: 'Under-utilized' },
      cleaningDetailing: { lastCleaned: '2025-09-12', status: 'Clean' },
      stablingGeometry: { bay: 'A5', turnoutTime: '4 mins' },
    },
  },
  {
    id: 'TS-14',
    healthScore: 92,
    details: {
      fitnessCertificates: { status: 'Valid', expires: '2026-03-01' },
      jobCardStatus: { status: 'Closed', openJobs: 0 },
      brandingPriority: { level: 'Low', contract: 'None', exposureNeeded: 'N/A' },
      mileageBalancing: { deviation: -2100, unit: 'km', status: 'Under-utilized' },
      cleaningDetailing: { lastCleaned: '2025-09-13', status: 'Clean' },
      stablingGeometry: { bay: 'C2', turnoutTime: '8 mins' },
    },
  },
  {
    id: 'TS-08',
    healthScore: 85,
    details: {
      fitnessCertificates: { status: 'Valid', expires: '2025-11-20' },
      jobCardStatus: { status: 'Closed', openJobs: 0 },
      brandingPriority: { level: 'Medium', contract: 'Pepsi', exposureNeeded: '5 hrs/week' },
      mileageBalancing: { deviation: 150, unit: 'km', status: 'Balanced' },
      cleaningDetailing: { lastCleaned: '2025-09-10', status: 'Clean' },
      stablingGeometry: { bay: 'B1', turnoutTime: '3 mins' },
    },
  },
  {
    id: 'TS-05',
    healthScore: 78,
    details: {
      fitnessCertificates: { status: 'Valid', expires: '2026-02-18' },
      jobCardStatus: { status: 'Closed', openJobs: 0 },
      brandingPriority: { level: 'Medium', contract: 'Amazon', exposureNeeded: '8 hrs/week' },
      mileageBalancing: { deviation: 1300, unit: 'km', status: 'Over-utilized' },
      cleaningDetailing: { lastCleaned: '2025-09-11', status: 'Clean' },
      stablingGeometry: { bay: 'D7', turnoutTime: '12 mins' },
    },
  },
  {
    id: 'TS-18',
    healthScore: 55,
    details: {
      fitnessCertificates: { status: 'Valid', expires: '2026-01-10' },
      jobCardStatus: { status: 'Open', openJobs: 1, details: 'HVAC unit repair' },
      brandingPriority: { level: 'Low', contract: 'None', exposureNeeded: 'N/A' },
      mileageBalancing: { deviation: -500, unit: 'km', status: 'Balanced' },
      cleaningDetailing: { lastCleaned: '2025-08-28', status: 'Due for Cleaning' },
      stablingGeometry: { bay: 'M3 (IBL)', turnoutTime: 'N/A' },
    },
  },
  {
    id: 'TS-02',
    healthScore: 20,
    details: {
      fitnessCertificates: { status: 'Expired', expires: '2025-09-11' },
      jobCardStatus: { status: 'Open', openJobs: 1, details: 'Telecom cert renewal' },
      brandingPriority: { level: 'Low', contract: 'None', exposureNeeded: 'N/A' },
      mileageBalancing: { deviation: 1800, unit: 'km', status: 'Over-utilized' },
      cleaningDetailing: { lastCleaned: '2025-09-09', status: 'Clean' },
      stablingGeometry: { bay: 'M1 (IBL)', turnoutTime: 'N/A' },
    },
  },
];

// --- Sub-Components ---

const Sidebar = ({ isOpen, onClose, onDatePrediction, onChatbot, onAllTrainsets }) => (
  <div className={`fixed inset-y-0 left-0 z-50 w-80 bg-gradient-to-b from-gray-800 to-gray-900 shadow-2xl border-r border-gray-600 transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-xl font-bold text-transparent bg-gradient-to-r from-teal-400 to-lime-400 bg-clip-text">Menu</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
          <X size={24} />
        </button>
      </div>
      
      <div className="space-y-4">
        <button 
          onClick={onDatePrediction}
          className="w-full flex items-center gap-4 p-4 bg-gray-700/50 hover:bg-gray-700 rounded-xl transition-all duration-300 text-white hover:text-teal-300 group"
        >
          <Calendar size={20} className="text-teal-400 group-hover:text-teal-300" />
          <div className="text-left">
            <div className="font-semibold">Date Predictions</div>
            <div className="text-sm text-gray-400">View predictions for any date</div>
          </div>
        </button>
        
        <button 
          onClick={onChatbot}
          className="w-full flex items-center gap-4 p-4 bg-gray-700/50 hover:bg-gray-700 rounded-xl transition-all duration-300 text-white hover:text-teal-300 group"
        >
          <MessageCircle size={20} className="text-teal-400 group-hover:text-teal-300" />
          <div className="text-left">
            <div className="font-semibold">AI Chatbot</div>
            <div className="text-sm text-gray-400">Get AI assistance</div>
          </div>
        </button>
        
        <button 
          onClick={onAllTrainsets}
          className="w-full flex items-center gap-4 p-4 bg-gray-700/50 hover:bg-gray-700 rounded-xl transition-all duration-300 text-white hover:text-teal-300 group"
        >
          <List size={20} className="text-teal-400 group-hover:text-teal-300" />
          <div className="text-left">
            <div className="font-semibold">All Trainsets</div>
            <div className="text-sm text-gray-400">View all trainset health status</div>
          </div>
        </button>
      </div>
    </div>
  </div>
);

const Header = ({ onMenuToggle }) => (
  <header className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 backdrop-blur-sm border-b border-gray-600 shadow-2xl sticky top-0 z-20">
    <div className="relative w-full h-20 flex items-center">
      {/* Left side icons - Fixed position */}
      <div className="absolute left-4 sm:left-6 lg:left-8 flex items-center space-x-3 z-10">
        <button 
          onClick={onMenuToggle}
          className="p-2 bg-teal-500/20 rounded-xl border border-teal-400/30 hover:bg-teal-500/30 transition-all duration-300"
        >
          <Menu size={24} className="text-teal-400" />
        </button>
        <div className="p-2 bg-teal-500/20 rounded-xl border border-teal-400/30">
          <UserCircle size={32} className="text-teal-400" />
        </div>
        <div className="hidden sm:block">
          <p className="text-sm text-gray-400">System Admin</p>
          <p className="text-xs text-gray-500">Operations Dashboard</p>
        </div>
      </div>
      
      {/* Center title - Absolutely centered */}
      <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <div className="text-center">
          <h1 className="text-4xl font-black text-transparent bg-gradient-to-r from-teal-400 via-cyan-400 to-lime-400 bg-clip-text tracking-widest">
            KRONOS
          </h1>
          <p className="text-xs text-gray-400 tracking-wider mt-1">TRAINSET OPTIMIZATION</p>
        </div>
      </div>
    </div>
  </header>
);

const HealthBar = ({ score }) => {
  return (
    <div className="relative">
      <div className="w-full bg-gray-700/50 rounded-full h-3 border border-gray-600/50">
        <div
          className="bg-gradient-to-r from-blue-400 to-blue-600 h-full rounded-full transition-all duration-1000 ease-out shadow-lg shadow-blue-500/50 relative overflow-hidden"
          style={{ width: `${score}%` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
        </div>
      </div>
    </div>
  );
};

const TrainCard = ({ train, onSelect }) => {
  return (
    <div 
      className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-2xl border-2 border-blue-400/50 shadow-blue-500/20 cursor-pointer hover:border-teal-400/70 hover:bg-gradient-to-br hover:from-gray-700 hover:to-gray-800 transition-all duration-500 shadow-xl hover:shadow-blue-500/30 hover:shadow-2xl transform hover:scale-[1.02] hover:-translate-y-1 group h-full min-h-[180px] flex flex-col justify-between w-full"
      onClick={() => onSelect(train)}
    >
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl sm:text-2xl lg:text-3xl font-black text-white group-hover:text-teal-300 transition-colors duration-300">
          {train.id}
        </h3>
        {/* Score back in top-right corner */}
        <div className="text-right">
          <p className="text-lg sm:text-xl lg:text-2xl font-bold text-white group-hover:text-teal-300 transition-colors duration-300">
            {train.healthScore}
          </p>
          <p className="text-sm text-gray-400">/100</p>
        </div>
      </div>
      
      <div className="mb-3">
        <HealthBar score={train.healthScore} />
      </div>
      
      {/* Only 'Health Score' label text below health bar, left-aligned */}
      <div className="mb-4">
        <span className="text-xs text-gray-500">Health Score</span>
      </div>
      
      <div className="flex justify-end mt-auto">
        <div className="text-xs text-gray-500 group-hover:text-gray-400 transition-colors duration-300">
          Click for details →
        </div>
      </div>
    </div>
  );
};

const DetailItem = ({ label, value, statusColor }) => (
    <div className="bg-gradient-to-br from-gray-700 to-gray-800 p-4 rounded-xl border border-gray-600/50 hover:border-gray-500/70 transition-all duration-300 shadow-lg">
        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-2">{label}</p>
        <p className={`text-lg font-bold ${statusColor || 'text-white'}`}>{value}</p>
    </div>
);

// Date Prediction Calendar Component
const DatePredictionModal = ({ isOpen, onClose }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  if (!isOpen) return null;
  
  const today = new Date();
  const maxDate = new Date(today);
  maxDate.setDate(today.getDate() + 30);
  
  const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const startOfCalendar = new Date(startOfMonth);
  startOfCalendar.setDate(startOfCalendar.getDate() - startOfCalendar.getDay());
  
  const days = [];
  const current = new Date(startOfCalendar);
  
  for (let i = 0; i < 42; i++) {
    days.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  
  const isDateInRange = (date) => {
    return date >= today && date <= maxDate;
  };
  
  const isDateSelected = (date) => {
    return selectedDate && 
           date.getDate() === selectedDate.getDate() && 
           date.getMonth() === selectedDate.getMonth() && 
           date.getFullYear() === selectedDate.getFullYear();
  };
  
  const isCurrentMonth = (date) => {
    return date.getMonth() === currentMonth.getMonth();
  };
  
  const previousMonth = () => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() - 1);
    if (newMonth >= new Date(today.getFullYear(), today.getMonth(), 1)) {
      setCurrentMonth(newMonth);
    }
  };
  
  const nextMonth = () => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + 1);
    if (newMonth <= new Date(maxDate.getFullYear(), maxDate.getMonth(), 1)) {
      setCurrentMonth(newMonth);
    }
  };
  
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-40 p-4" onClick={onClose}>
      <div 
        className="bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 rounded-3xl border-2 border-teal-400/50 w-full max-w-md shadow-2xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-transparent bg-gradient-to-r from-teal-400 to-lime-400 bg-clip-text">
            Select Prediction Date
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>
        
        {/* Calendar Header */}
        <div className="flex justify-between items-center mb-4">
          <button 
            onClick={previousMonth}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            disabled={currentMonth <= new Date(today.getFullYear(), today.getMonth(), 1)}
          >
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <h3 className="text-lg font-semibold text-white">
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </h3>
          
          <button 
            onClick={nextMonth}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            disabled={currentMonth >= new Date(maxDate.getFullYear(), maxDate.getMonth(), 1)}
          >
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        
        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1 mb-4">
          {dayNames.map(day => (
            <div key={day} className="text-center text-sm font-medium text-gray-400 py-2">
              {day}
            </div>
          ))}
          
          {days.map((date, index) => {
            const inRange = isDateInRange(date);
            const selected = isDateSelected(date);
            const currentMonthDay = isCurrentMonth(date);
            
            return (
              <button
                key={index}
                onClick={() => inRange && setSelectedDate(date)}
                className={`
                  h-10 w-10 rounded-lg text-sm font-medium transition-all duration-200
                  ${selected 
                    ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg' 
                    : inRange 
                      ? 'hover:bg-teal-500/20 hover:text-teal-300 text-white' 
                      : 'text-gray-600 cursor-not-allowed'
                  }
                  ${!currentMonthDay ? 'opacity-40' : ''}
                  ${date.toDateString() === today.toDateString() ? 'ring-2 ring-lime-400/50' : ''}
                `}
                disabled={!inRange}
              >
                {date.getDate()}
              </button>
            );
          })}
        </div>
        
        {/* Selected Date Display */}
        {selectedDate && (
          <div className="bg-gray-700/50 rounded-xl p-4 mb-4">
            <p className="text-sm text-gray-400 mb-1">Selected Date:</p>
            <p className="text-lg font-semibold text-teal-300">
              {selectedDate.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
        )}
        
        {/* Info */}
        <div className="text-center">
          <p className="text-sm text-gray-400 mb-2">
            Select any date within the next 30 days
          </p>
          <p className="text-xs text-gray-500">
            Prediction functionality coming soon...
          </p>
        </div>
      </div>
    </div>
  );
};

// All Trainsets Page Component
const AllTrainsetsPage = ({ isOpen, onClose, trains }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 z-40 overflow-y-auto">
      <div className="min-h-screen">
        <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border-b border-gray-600 shadow-xl sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold text-transparent bg-gradient-to-r from-teal-400 to-lime-400 bg-clip-text">
                All Trainsets Health Status
              </h1>
              <button 
                onClick={onClose}
                className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-xl transition-colors"
              >
                <X size={20} />
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
        
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-12">
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
            {trains.map((train) => (
              <div 
                key={train.id}
                className="flex-shrink-0 w-full sm:w-80 md:w-72 lg:w-64 xl:w-72 2xl:w-80"
              >
                <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-2xl border-2 border-blue-400/50 shadow-blue-500/20 shadow-xl h-full min-h-[200px] flex flex-col justify-between">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl sm:text-2xl font-bold text-white">{train.id}</h3>
                    <span className="text-lg sm:text-xl font-bold text-white">{train.healthScore}/100</span>
                  </div>
                  <div className="mb-4">
                    <HealthBar score={train.healthScore} />
                  </div>
                  <div className="text-sm text-gray-400 mt-auto">
                    Last updated: Today
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const TrainDetailModal = ({ train, onClose }) => {
  if (!train) return null;

  const { details } = train;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-30 p-4 animate-fadeIn" onClick={onClose}>
      <div 
        className="bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 rounded-3xl border-2 border-gray-600/50 w-full max-w-4xl shadow-2xl p-8 animate-slideUp relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-blue-500/10 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-purple-500/10 to-transparent rounded-full blur-3xl"></div>
        
        <div className="relative z-10">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-4xl font-black text-transparent bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text mb-2">
                {train.id}
              </h2>
              <p className="text-gray-400 text-lg">Detailed Status Report</p>
            </div>
            <button 
              onClick={onClose} 
              className="text-gray-400 hover:text-white transition-all duration-300 p-3 hover:bg-gray-700/50 rounded-xl group"
            >
              <X size={28} className="group-hover:scale-110 transition-transform duration-300" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <DetailItem label="Health Score" value={`${train.healthScore}/100`} statusColor={train.healthScore > 80 ? 'text-green-400' : train.healthScore > 60 ? 'text-yellow-400' : 'text-red-400'}/>
              <DetailItem label="Fitness Certificate" value={details.fitnessCertificates.status} statusColor={details.fitnessCertificates.status === 'Valid' ? 'text-green-400' : 'text-red-400'}/>
              <DetailItem label="Job Card" value={details.jobCardStatus.status} statusColor={details.jobCardStatus.status === 'Closed' ? 'text-green-400' : 'text-red-400'}/>
              <DetailItem label="Branding Priority" value={details.brandingPriority.level} statusColor={details.brandingPriority.level === 'High' ? 'text-blue-400' : 'text-gray-300'}/>
              <DetailItem label="Mileage" value={details.mileageBalancing.status} statusColor={details.mileageBalancing.status === 'Balanced' ? 'text-green-400' : 'text-yellow-400'}/>
              <DetailItem label="Cleaning" value={details.cleaningDetailing.status} statusColor={details.cleaningDetailing.status === 'Clean' ? 'text-green-400' : 'text-yellow-400'}/>
          </div>

          <div className="bg-gradient-to-r from-gray-900/80 via-gray-800/80 to-gray-900/80 p-6 rounded-2xl border border-gray-600/50 backdrop-blur-sm">
              <h4 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
                <FileText size={20} className="text-blue-400" />
                Constraint Details
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-300">
                  <div className="space-y-3">
                    <div><span className="font-bold text-blue-400">Cert Expires:</span> <span className="text-white">{details.fitnessCertificates.expires}</span></div>
                    <div><span className="font-bold text-blue-400">Open Jobs:</span> <span className="text-white">{details.jobCardStatus.openJobs}</span> {details.jobCardStatus.details ? `(${details.jobCardStatus.details})` : ''}</div>
                    <div><span className="font-bold text-blue-400">Branding Contract:</span> <span className="text-white">{details.brandingPriority.contract}</span> ({details.brandingPriority.exposureNeeded})</div>
                  </div>
                  <div className="space-y-3">
                    <div><span className="font-bold text-blue-400">Mileage Deviation:</span> <span className="text-white">{details.mileageBalancing.deviation} {details.mileageBalancing.unit}</span></div>
                    <div><span className="font-bold text-blue-400">Last Deep Clean:</span> <span className="text-white">{details.cleaningDetailing.lastCleaned}</span></div>
                    <div><span className="font-bold text-blue-400">Stabling Bay:</span> <span className="text-white">{details.stablingGeometry.bay}</span> (Turnout: {details.stablingGeometry.turnoutTime})</div>
                  </div>
              </div>
          </div>
        </div>
      </div>
    </div>
  );
};


// --- Main App Component ---

export default function App() {
  const [trains, _setTrains] = useState(sampleTrainsData);
  const [selectedTrain, setSelectedTrain] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showDatePrediction, setShowDatePrediction] = useState(false);
  const [showAllTrainsets, setShowAllTrainsets] = useState(false);

  const handleChatbot = () => {
    alert('AI Chatbot feature coming soon!');
  };

  return (
    <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 min-h-screen font-sans text-white relative">
      <Header onMenuToggle={() => setSidebarOpen(true)} />
      
      <Sidebar 
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onDatePrediction={() => {
          setSidebarOpen(false);
          setShowDatePrediction(true);
        }}
        onChatbot={handleChatbot}
        onAllTrainsets={() => {
          setSidebarOpen(false);
          setShowAllTrainsets(true);
        }}
      />

      {/* Sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <main className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-12">
        <div className="text-center mb-12 space-y-4">
            <h2 className="text-3xl font-bold text-transparent bg-gradient-to-r from-teal-400 via-cyan-400 to-lime-400 bg-clip-text">
              Today's Recommended Trainsets
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Based on AI-driven health score analysis and operational constraints optimization.
            </p>
        </div>
        
        {/* 3x2 Grid layout for trainsets - responsive */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-12 max-w-6xl mx-auto">
          {trains.map((train, index) => (
            <div 
              key={train.id}
              className="animate-slideInUp"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <TrainCard train={train} onSelect={setSelectedTrain} />
            </div>
          ))}
        </div>
        
        {/* Manual Override Button - Centered below boxes */}
        <div className="flex justify-center">
          <button className="flex items-center gap-3 bg-gradient-to-r from-red-700/80 to-red-800/80 text-white font-bold px-8 py-4 rounded-xl hover:from-red-600/90 hover:to-red-700/90 transition-all duration-300 shadow-lg hover:shadow-red-600/20 transform hover:scale-105 border border-red-600/30">
            <AlertTriangle size={20} />
            <span>Manual Override</span>
          </button>
        </div>
      </main>
      
      <TrainDetailModal train={selectedTrain} onClose={() => setSelectedTrain(null)} />
      <DatePredictionModal isOpen={showDatePrediction} onClose={() => setShowDatePrediction(false)} />
      <AllTrainsetsPage isOpen={showAllTrainsets} onClose={() => setShowAllTrainsets(false)} trains={trains} />

      <style jsx global>{`
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        @keyframes slideUp {
            from { opacity: 0; transform: translateY(30px) scale(0.95); }
            to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes slideInUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
            animation: fadeIn 0.3s ease-out forwards;
        }
        .animate-slideUp {
            animation: slideUp 0.4s ease-out forwards;
        }
        .animate-slideInUp {
            animation: slideInUp 0.6s ease-out forwards;
            opacity: 0;
        }
      `}</style>
    </div>
  );
}


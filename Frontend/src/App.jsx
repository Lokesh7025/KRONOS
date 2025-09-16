import React, { useState, useEffect } from 'react';
import { FileText, UserCircle, AlertTriangle, X, Menu, Calendar, MessageCircle, List, ChevronsRight, Wrench, Power } from 'lucide-react';

// --- RakeAssist Chatbot Component ---
const RakeAssist = ({ onClose, currentDay }) => {
  const [messages, setMessages] = useState([
    { text: `Hello! I'm RakeAssist. Ask me about the fleet plan for Day ${currentDay} or any other day.`, sender: 'ai' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async () => {
    if (inputValue.trim() === '' || isLoading) return;

    const userMessage = { text: inputValue, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:5001/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: inputValue, day: currentDay }),
      });

      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      const aiMessage = { text: data.answer || "Sorry, I couldn't get a response.", sender: 'ai' };
      setMessages(prev => [...prev, aiMessage]);

    } catch (error) {
      console.error("Error fetching from RakeAssist API:", error);
      const errorMessage = { text: "Sorry, I'm having trouble connecting to my brain right now.", sender: 'ai' };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleSendMessage();
  };

  return (
    <div className="fixed bottom-5 right-5 w-[370px] h-[550px] bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl flex flex-col font-sans z-50 animate-slideUp">
      <div className="bg-gray-900 p-4 flex justify-between items-center rounded-t-2xl border-b border-gray-700">
        <h3 className="text-lg font-bold text-teal-400">RakeAssist AI</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors"><X size={20} /></button>
      </div>
      <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-4">
        {messages.map((msg, index) => (
          <div key={index} className={`p-3 rounded-2xl max-w-[80%] leading-snug ${msg.sender === 'user' ? 'bg-teal-500 text-white self-end rounded-br-lg' : 'bg-gray-700 text-gray-200 self-start rounded-bl-lg'}`}>
            {msg.text}
          </div>
        ))}
        {isLoading && <div className="p-3 rounded-2xl max-w-[80%] leading-snug bg-gray-700 text-gray-200 self-start rounded-bl-lg animate-pulse">Thinking...</div>}
      </div>
      <div className="p-4 border-t border-gray-700 flex gap-2">
        <input
          type="text"
          className="flex-1 bg-gray-900 border border-gray-600 rounded-full py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask about Rake-05..."
          disabled={isLoading}
        />
        <button className="bg-teal-500 hover:bg-teal-600 text-white font-bold py-2 px-5 rounded-full transition-colors disabled:opacity-50" onClick={handleSendMessage} disabled={isLoading}>
          Send
        </button>
      </div>
    </div>
  );
};


// --- Sub-Components from your design ---

const Sidebar = ({ isOpen, onClose, onDatePrediction, onChatbot, onAllTrainsets }) => (
  <div className={`fixed inset-y-0 left-0 z-[60] w-80 bg-gradient-to-b from-gray-800 to-gray-900 shadow-2xl border-r border-gray-600 transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-xl font-bold text-transparent bg-gradient-to-r from-teal-400 to-lime-400 bg-clip-text">Menu</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors"><X size={24} /></button>
      </div>
      <div className="space-y-4">
        <button onClick={onDatePrediction} className="w-full flex items-center gap-4 p-4 bg-gray-700/50 hover:bg-gray-700 rounded-xl transition-all duration-300 text-white hover:text-teal-300 group">
          <Calendar size={20} className="text-teal-400 group-hover:text-teal-300" />
          <div className="text-left"><div className="font-semibold">Date Predictions</div><div className="text-sm text-gray-400">View predictions for any date</div></div>
        </button>
        <button onClick={onChatbot} className="w-full flex items-center gap-4 p-4 bg-gray-700/50 hover:bg-gray-700 rounded-xl transition-all duration-300 text-white hover:text-teal-300 group">
          <MessageCircle size={20} className="text-teal-400 group-hover:text-teal-300" />
          <div className="text-left"><div className="font-semibold">AI Chatbot</div><div className="text-sm text-gray-400">Get AI assistance</div></div>
        </button>
        <button onClick={onAllTrainsets} className="w-full flex items-center gap-4 p-4 bg-gray-700/50 hover:bg-gray-700 rounded-xl transition-all duration-300 text-white hover:text-teal-300 group">
          <List size={20} className="text-teal-400 group-hover:text-teal-300" />
          <div className="text-left"><div className="font-semibold">All Trainsets</div><div className="text-sm text-gray-400">View all trainset health status</div></div>
        </button>
      </div>
    </div>
  </div>
);

const Header = ({ onMenuToggle }) => (
  <header className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 backdrop-blur-sm border-b border-gray-600 shadow-2xl sticky top-0 z-20">
    <div className="relative w-full h-20 flex items-center">
      <div className="absolute left-4 sm:left-6 lg:left-8 flex items-center space-x-3 z-10">
        <button onClick={onMenuToggle} className="p-2 bg-teal-500/20 rounded-xl border border-teal-400/30 hover:bg-teal-500/30 transition-all duration-300"><Menu size={24} className="text-teal-400" /></button>
        <div className="p-2 bg-teal-500/20 rounded-xl border border-teal-400/30"><UserCircle size={32} className="text-teal-400" /></div>
        <div className="hidden sm:block"><p className="text-sm text-gray-400">System Admin</p><p className="text-xs text-gray-500">Operations Dashboard</p></div>
      </div>
      <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <div className="text-center">
          <h1 className="text-4xl font-black text-transparent bg-gradient-to-r from-teal-400 via-cyan-400 to-lime-400 bg-clip-text tracking-widest">KRONOS</h1>
          <p className="text-xs text-gray-400 tracking-wider mt-1">TRAINSET OPTIMIZATION</p>
        </div>
      </div>
    </div>
  </header>
);

const HealthBar = ({ score }) => {
  const getColor = (s) => {
    if (s > 80) return 'from-teal-400 to-cyan-400';
    if (s > 50) return 'from-yellow-400 to-orange-400';
    return 'from-red-500 to-pink-500';
  };
  return (
    <div className="relative">
      <div className="w-full bg-gray-700/50 rounded-full h-3 border border-gray-600/50">
        <div className={`bg-gradient-to-r ${getColor(score)} h-full rounded-full transition-all duration-1000 ease-out shadow-lg shadow-blue-500/50 relative overflow-hidden`} style={{ width: `${score}%` }}>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
        </div>
      </div>
    </div>
  );
};

const TrainCard = ({ train, status, onSelect }) => {
    const statusInfo = {
        SERVICE: { icon: <ChevronsRight size={20}/>, color: 'text-green-400', bgColor: 'bg-green-500/10', borderColor: 'border-green-500/50' },
        MAINTENANCE: { icon: <Wrench size={20}/>, color: 'text-yellow-400', bgColor: 'bg-yellow-500/10', borderColor: 'border-yellow-500/50' },
        STANDBY: { icon: <Power size={20}/>, color: 'text-blue-400', bgColor: 'bg-blue-500/10', borderColor: 'border-blue-500/50' },
    };
    const style = statusInfo[status] || statusInfo['STANDBY'];

    return (
        <div onClick={() => onSelect(train)} className={`bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-2xl border-2 ${style.borderColor} shadow-lg cursor-pointer hover:border-teal-400/70 transition-all duration-500 transform hover:scale-[1.03] hover:-translate-y-1 group h-full flex flex-col justify-between`}>
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-3xl font-black text-white group-hover:text-teal-300 transition-colors duration-300">{train.train_id}</h3>
            <div className={`p-2 rounded-full ${style.bgColor}`}>{React.cloneElement(style.icon, { className: style.color })}</div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-baseline"><span className="text-xs text-gray-500">Health Score</span><p className="text-2xl font-bold text-white group-hover:text-teal-300 transition-colors duration-300">{Math.round(train.health_score)}</p></div>
            <HealthBar score={train.health_score} />
          </div>
        </div>
    );
};

const DetailItem = ({ label, value, statusColor }) => (
  <div className="bg-gradient-to-br from-gray-700 to-gray-800 p-4 rounded-xl border border-gray-600/50 shadow-lg">
    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-2">{label}</p>
    <p className={`text-lg font-bold ${statusColor || 'text-white'}`}>{value}</p>
  </div>
);

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
  
  const days = Array.from({ length: 42 }, (_, i) => {
    const date = new Date(startOfCalendar);
    date.setDate(date.getDate() + i);
    return date;
  });
  
  const isDateInRange = (date) => date >= today && date <= maxDate;
  const isDateSelected = (date) => selectedDate && date.toDateString() === selectedDate.toDateString();
  const isCurrentMonth = (date) => date.getMonth() === currentMonth.getMonth();
  
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
  
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-40 p-4" onClick={onClose}>
      <div className="bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 rounded-3xl border-2 border-teal-400/50 w-full max-w-md shadow-2xl p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-transparent bg-gradient-to-r from-teal-400 to-lime-400 bg-clip-text">Select Prediction Date</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors"><X size={24} /></button>
        </div>
        <div className="flex justify-between items-center mb-4">
          <button onClick={previousMonth} className="p-2 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50" disabled={currentMonth <= new Date(today.getFullYear(), today.getMonth(), 1)}>&lt;</button>
          <h3 className="text-lg font-semibold text-white">{monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}</h3>
          <button onClick={nextMonth} className="p-2 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50" disabled={currentMonth >= new Date(maxDate.getFullYear(), maxDate.getMonth(), 1)}>&gt;</button>
        </div>
        <div className="grid grid-cols-7 gap-1 mb-4">
          {dayNames.map(day => <div key={day} className="text-center text-sm font-medium text-gray-400 py-2">{day}</div>)}
          {days.map((date, index) => {
            const inRange = isDateInRange(date);
            const selected = isDateSelected(date);
            const currentMonthDay = isCurrentMonth(date);
            return (
              <button key={index} onClick={() => inRange && setSelectedDate(date)} className={`h-10 w-10 rounded-lg text-sm font-medium transition-all duration-200 ${selected ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg' : inRange ? 'hover:bg-teal-500/20 hover:text-teal-300 text-white' : 'text-gray-600 cursor-not-allowed'} ${!currentMonthDay ? 'opacity-40' : ''} ${date.toDateString() === today.toDateString() ? 'ring-2 ring-lime-400/50' : ''}`} disabled={!inRange}>
                {date.getDate()}
              </button>
            );
          })}
        </div>
        <div className="text-center"><p className="text-xs text-gray-500">Prediction functionality coming soon...</p></div>
      </div>
    </div>
  );
};

const AllTrainsetsPage = ({ isOpen, onClose, trains, getStatus, onSelectTrain }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 z-40 overflow-y-auto">
      <div className="min-h-screen">
        <div className="bg-gray-900/80 backdrop-blur-sm border-b border-gray-700 shadow-xl sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
            <h1 className="text-3xl font-bold text-teal-400">All Trainsets Health Status</h1>
            <button onClick={onClose} className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-xl transition-colors"><X size={20} /> Back</button>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {trains.map((train) => <TrainCard key={train.train_id} train={train} status={getStatus(train.train_id)} onSelect={onSelectTrain} />)}
          </div>
        </div>
      </div>
    </div>
  );
};

const TrainDetailModal = ({ train, status, onClose }) => {
    if (!train) return null;
    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-30 p-4 animate-fadeIn" onClick={onClose}>
            <div className="bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 rounded-3xl border-2 border-gray-600/50 w-full max-w-4xl shadow-2xl p-8 animate-slideUp" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h2 className="text-4xl font-black text-teal-400 mb-2">{train.train_id} ({status})</h2>
                        <p className="text-gray-400 text-lg">Detailed Status Report</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-all duration-300 p-3 hover:bg-gray-700/50 rounded-xl group"><X size={28} /></button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    <DetailItem label="Health Score" value={`${Math.round(train.health_score)}/100`} statusColor={train.health_score > 80 ? 'text-green-400' : train.health_score > 50 ? 'text-yellow-400' : 'text-red-400'} />
                    <DetailItem label="Current KM (Monthly)" value={`${train.current_km} km`} />
                    <DetailItem label="Branding Hours (Monthly)" value={`${train.current_hours ? train.current_hours.toFixed(1) : 0} hrs`} />
                    <DetailItem label="Consecutive Service Days" value={train.consecutive_service_days || 0} />
                    <DetailItem label="Job Card" value={train.job_card_priority} statusColor={train.job_card_priority === 'NONE' ? 'text-green-400' : 'text-yellow-400'} />
                    <DetailItem label="Fitness Certificate" value={train.is_cert_expired ? 'Expired' : 'Valid'} statusColor={!train.is_cert_expired ? 'text-green-400' : 'text-red-400'} />
                </div>
            </div>
        </div>
    );
};

// --- Main App Component ---

export default function App() {
    const [simulationLog, setSimulationLog] = useState([]);
    const [currentDay, setCurrentDay] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [showChatbot, setShowChatbot] = useState(false);
    const [showDatePrediction, setShowDatePrediction] = useState(false);
    const [showAllTrainsets, setShowAllTrainsets] = useState(false);
    const [selectedTrain, setSelectedTrain] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const response = await fetch('/simulation_log.json');
                if (!response.ok) throw new Error(`HTTP ${response.status}: Failed to fetch data. Make sure simulation_log.json is in your /public folder.`);
                const data = await response.json();
                if (!Array.isArray(data) || data.length === 0) throw new Error("Simulation data is empty or invalid. Please re-run the Python simulation.");
                setSimulationLog(data);
            } catch (err) {
                console.error(err);
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const selectedDayData = simulationLog.find(d => d.day === currentDay);
    const plan = selectedDayData?.plan || { SERVICE: [], MAINTENANCE: [], STANDBY: [] };
    const fleetStatus = selectedDayData?.fleet_status_today || [];

    const getTrainStatus = (trainId) => {
        if (plan.SERVICE.includes(trainId)) return 'SERVICE';
        if (plan.MAINTENANCE.includes(trainId)) return 'MAINTENANCE';
        return 'STANDBY';
    };
    
    const handleSelectTrain = (train) => {
        setSelectedTrain(train);
    };

    const renderContent = () => {
        if (isLoading) return <div className="text-center py-20"><p className="text-2xl text-gray-400 animate-pulse">Loading Simulation Data...</p></div>;
        if (error) return <div className="text-center p-8 bg-red-900/50 border border-red-700 rounded-lg max-w-2xl mx-auto"><p className="text-2xl font-bold text-red-400 mb-4">Failed to Load Data</p><p className="text-gray-300 font-mono bg-gray-900 p-4 rounded">{error}</p></div>;
        if (!selectedDayData) return <p className="text-center text-xl text-gray-500">No data for Day {currentDay}.</p>;

        return (
            <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {['SERVICE', 'MAINTENANCE', 'STANDBY'].map(statusKey => (
                        <div key={statusKey} className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                            <h3 className="text-xl font-bold text-teal-400 mb-4">{statusKey} ({plan[statusKey]?.length || 0})</h3>
                            <div className="flex flex-wrap gap-2">
                                {plan[statusKey]?.sort().map(trainId => (
                                    <div key={trainId} className="bg-gray-700 py-1 px-3 rounded-md text-sm font-mono text-white whitespace-nowrap">{trainId}</div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
                <h2 className="text-3xl font-bold text-center mt-12 mb-6 text-teal-400">Full Fleet Status for Day {currentDay}</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {fleetStatus.sort((a,b) => parseInt(a.train_id.split('-')[1]) - parseInt(b.train_id.split('-')[1])).map(train => (
                        <TrainCard key={train.train_id} train={train} status={getTrainStatus(train.train_id)} onSelect={handleSelectTrain} />
                    ))}
                </div>
            </>
        );
    };

    return (
        <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 min-h-screen text-white font-sans">
            <Header onMenuToggle={() => setSidebarOpen(true)} />
            <Sidebar 
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                onDatePrediction={() => { setSidebarOpen(false); setShowDatePrediction(true); }}
                onChatbot={() => { setSidebarOpen(false); setShowChatbot(true); }}
                onAllTrainsets={() => { setSidebarOpen(false); setShowAllTrainsets(true); }}
            />
            {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setSidebarOpen(false)} />}
            
            <main className="max-w-7xl mx-auto px-4 py-8">
                <div className="bg-gray-800 rounded-xl p-6 mb-8 border border-gray-700 shadow-lg">
                    <h2 className="text-2xl font-bold mb-4 text-teal-400">Simulation Timeline</h2>
                    <div className="flex items-center gap-4 text-gray-300">
                        <span className="font-mono text-lg">Day 1</span>
                        <input type="range" min="1" max={simulationLog.length || 1} value={currentDay} onChange={(e) => setCurrentDay(Number(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-teal-500" disabled={isLoading || error} />
                        <span className="font-mono text-lg">Day {simulationLog.length || 30}</span>
                    </div>
                    <div className="text-center mt-4"><p className="text-xl font-semibold">Viewing Plan for: <span className="text-teal-300 font-bold">Day {currentDay}</span></p><p className="text-sm text-gray-400 mt-1">Scenario: <span className="font-semibold text-gray-300">{selectedDayData?.scenario || 'N/A'}</span></p></div>
                </div>
                {renderContent()}
            </main>

            {showChatbot && <RakeAssist onClose={() => setShowChatbot(false)} currentDay={currentDay} />}
            <DatePredictionModal isOpen={showDatePrediction} onClose={() => setShowDatePrediction(false)} />
            <AllTrainsetsPage isOpen={showAllTrainsets} onClose={() => setShowAllTrainsets(false)} trains={fleetStatus} getStatus={getTrainStatus} onSelectTrain={(train) => {setShowAllTrainsets(false); setSelectedTrain(train);}} />
            <TrainDetailModal train={selectedTrain} status={selectedTrain ? getTrainStatus(selectedTrain.train_id) : ''} onClose={() => setSelectedTrain(null)} />

            <style jsx global>{`
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slideUp { from { opacity: 0; transform: translateY(30px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
                .animate-fadeIn { animation: fadeIn 0.3s ease-out forwards; }
                .animate-slideUp { animation: slideUp 0.4s ease-out forwards; }
            `}</style>
        </div>
    );
}


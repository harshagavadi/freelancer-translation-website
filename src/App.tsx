import { useState, useCallback, useEffect } from 'react';
import { useStore, Project, CURRENCIES } from './store/useStore';
import { useDropzone } from 'react-dropzone';
import { formatDistanceToNow, format } from 'date-fns';

type ViewType = 'home' | 'dashboard' | 'projects' | 'messages' | 'new-project' | 'notifications' | 'wallet';

export function App() {
  const { 
    user, 
    projects, 
    login, 
    register, 
    logout, 
    createProject, 
    updateProject, 
    uploadFile, 
    sendMessage, 
    markMessageAsRead, 
    getProjectMessages, 
    getUnreadCount,
    getUnreadNotifications,
    markNotificationAsRead,
    freelancerProfiles,
    depositFunds,
    withdrawFunds,
    getUserTransactions,
    getWalletBalance,
    changeCurrency,
    formatCurrency
  } = useStore();
  const [currentView, setCurrentView] = useState<ViewType>('home');
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authType, setAuthType] = useState<'client' | 'translator'>('client');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [authForm, setAuthForm] = useState({
    name: '',
    email: '',
    password: '',
  });

  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    service: '',
    message: ''
  });

  const [newProjectForm, setNewProjectForm] = useState({
    title: '',
    sourceLanguage: 'English',
    targetLanguage: 'Spanish',
    wordCount: '',
    deadline: '',
    description: '',
  });

  const [messageInput, setMessageInput] = useState('');
  
  // Wallet states
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [walletAction, setWalletAction] = useState<'deposit' | 'withdraw'>('deposit');
  const [walletForm, setWalletForm] = useState({
    amount: '',
    paymentMethod: 'credit_card'
  });
  const [walletLoading, setWalletLoading] = useState(false);

  // Get user's projects
  const userProjects = user ? projects.filter(p => 
    user.type === 'client' ? p.clientId === user.id : p.translatorId === user.id
  ) : [];

  const unreadCount = getUnreadCount();
  const unreadNotifications = getUnreadNotifications();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let success = false;
      if (authMode === 'login') {
        success = await login(authForm.email, authForm.password, authType);
        if (!success) {
          setError('Invalid email or password');
        }
      } else {
        success = await register(authForm.name, authForm.email, authForm.password, authType);
      }

      if (success) {
        setShowAuth(false);
        setCurrentView('dashboard');
        setAuthForm({ name: '', email: '', password: '' });
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    setCurrentView('home');
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Thank you for your inquiry! We will get back to you within 1 hour.');
    setContactForm({ name: '', email: '', service: '', message: '' });
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const price = parseFloat(newProjectForm.wordCount) * 0.12; // $0.12 per word

    createProject({
      title: newProjectForm.title,
      sourceLanguage: newProjectForm.sourceLanguage,
      targetLanguage: newProjectForm.targetLanguage,
      wordCount: parseInt(newProjectForm.wordCount),
      deadline: newProjectForm.deadline,
      price,
      status: 'pending',
      clientId: user.id,
    });

    setNewProjectForm({
      title: '',
      sourceLanguage: 'English',
      targetLanguage: 'Spanish',
      wordCount: '',
      deadline: '',
      description: '',
    });

    setCurrentView('projects');
    alert('Project created successfully!');
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject || !messageInput.trim()) return;

    sendMessage(selectedProject.id, messageInput);
    setMessageInput('');
  };

  // File upload handler
  const FileUploadZone = ({ projectId }: { projectId: string }) => {
    const onDrop = useCallback(async (acceptedFiles: File[]) => {
      for (const file of acceptedFiles) {
        await uploadFile(projectId, file);
      }
      alert('Files uploaded successfully!');
    }, [projectId]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

    return (
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition ${
          isDragActive ? 'border-indigo-600 bg-indigo-50' : 'border-gray-300 hover:border-indigo-400'
        }`}
      >
        <input {...getInputProps()} />
        <div className="text-4xl mb-2">📁</div>
        {isDragActive ? (
          <p className="text-indigo-600 font-semibold">Drop files here...</p>
        ) : (
          <div>
            <p className="text-gray-700 font-semibold mb-1">Drag & drop files here</p>
            <p className="text-gray-500 text-sm">or click to browse</p>
          </div>
        )}
      </div>
    );
  };

  // Dashboard Component
  const Dashboard = () => {
    const completedProjects = userProjects.filter(p => p.status === 'completed').length;
    const activeProjects = userProjects.filter(p => p.status !== 'completed').length;
    const totalSpent = userProjects.reduce((sum, p) => sum + p.price, 0);
    const autoAssignedCount = userProjects.filter(p => p.autoAssigned).length;

    return (
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Notifications Banner */}
          {unreadNotifications.length > 0 && (
            <div className="mb-6 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-white/20 p-2 rounded-full">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                  </div>
                  <div className="text-white">
                    <div className="font-semibold text-lg">You have {unreadNotifications.length} new notification{unreadNotifications.length > 1 ? 's' : ''}!</div>
                    <div className="text-indigo-100 text-sm mt-1">
                      {unreadNotifications[0].title}: {unreadNotifications[0].message}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    unreadNotifications.forEach(n => markNotificationAsRead(n.id));
                  }}
                  className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition text-sm font-medium"
                >
                  Mark all as read
                </button>
              </div>
            </div>
          )}

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome back, {user?.name}!
            </h1>
            <p className="text-gray-600 mt-2">
              {user?.type === 'client' ? 'Manage your translation projects' : 'View and manage client projects'}
            </p>
            {user?.type === 'client' && autoAssignedCount > 0 && (
              <div className="mt-3 inline-flex items-center space-x-2 bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">{autoAssignedCount} project{autoAssignedCount > 1 ? 's' : ''} auto-assigned to expert translators</span>
              </div>
            )}
          </div>

          {/* Stats Grid */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="text-sm text-gray-600 mb-1">Active Projects</div>
              <div className="text-3xl font-bold text-indigo-600">{activeProjects}</div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="text-sm text-gray-600 mb-1">Completed</div>
              <div className="text-3xl font-bold text-green-600">{completedProjects}</div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="text-sm text-gray-600 mb-1">Total {user?.type === 'client' ? 'Spent' : 'Earned'}</div>
              <div className="text-3xl font-bold text-gray-900">${totalSpent.toFixed(2)}</div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="text-sm text-gray-600 mb-1">Unread Messages</div>
              <div className="text-3xl font-bold text-orange-600">{unreadCount}</div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <button
              onClick={() => setCurrentView('projects')}
              className="bg-indigo-600 text-white p-6 rounded-xl hover:bg-indigo-700 transition shadow-lg text-left"
            >
              <div className="text-lg font-semibold mb-2">📋 View Projects</div>
              <div className="text-indigo-100">Manage your translation projects</div>
            </button>
            <button
              onClick={() => setCurrentView('messages')}
              className="bg-purple-600 text-white p-6 rounded-xl hover:bg-purple-700 transition shadow-lg text-left"
            >
              <div className="text-lg font-semibold mb-2">💬 Messages</div>
              <div className="text-purple-100">Communication hub</div>
            </button>
            {user?.type === 'client' ? (
              <button
                onClick={() => setCurrentView('new-project')}
                className="bg-green-600 text-white p-6 rounded-xl hover:bg-green-700 transition shadow-lg text-left"
              >
                <div className="text-lg font-semibold mb-2">➕ New Project</div>
                <div className="text-green-100">Start a new translation</div>
              </button>
            ) : (
              <button
                onClick={() => {
                  setWalletAction('withdraw');
                  setShowWalletModal(true);
                }}
                className="bg-green-600 text-white p-6 rounded-xl hover:bg-green-700 transition shadow-lg text-left"
              >
                <div className="text-lg font-semibold mb-2">💸 Withdraw Earnings</div>
                <div className="text-green-100">Cash out your balance</div>
              </button>
            )}
          </div>

          {/* Wallet Quick Access - Role Based */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 mb-8 text-white shadow-2xl">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-indigo-100 text-sm mb-2">Your Wallet Balance</div>
                <div className="text-5xl font-bold mb-4">${getWalletBalance().toFixed(2)}</div>
                <div className="flex gap-4">
                  {user?.type === 'client' ? (
                    <>
                      <button
                        onClick={() => {
                          setWalletAction('deposit');
                          setShowWalletModal(true);
                        }}
                        className="bg-white text-indigo-600 px-8 py-3 rounded-lg font-semibold hover:bg-indigo-50 transition shadow-lg flex items-center space-x-2"
                      >
                        <span className="text-2xl">💳</span>
                        <span>Add Funds</span>
                      </button>
                      <button
                        onClick={() => setCurrentView('wallet')}
                        className="bg-white/20 text-white px-6 py-3 rounded-lg font-semibold hover:bg-white/30 transition backdrop-blur-sm"
                      >
                        View Transactions
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          setWalletAction('withdraw');
                          setShowWalletModal(true);
                        }}
                        className="bg-white text-indigo-600 px-8 py-3 rounded-lg font-semibold hover:bg-indigo-50 transition shadow-lg flex items-center space-x-2"
                      >
                        <span className="text-2xl">💸</span>
                        <span>Withdraw Funds</span>
                      </button>
                      <button
                        onClick={() => setCurrentView('wallet')}
                        className="bg-white/20 text-white px-6 py-3 rounded-lg font-semibold hover:bg-white/30 transition backdrop-blur-sm"
                      >
                        View Earnings
                      </button>
                    </>
                  )}
                </div>
              </div>
              <div className="hidden md:block">
                <svg className="w-32 h-32 text-white/20" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                  <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-white/20 grid grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-indigo-100">Total {user?.type === 'client' ? 'Deposited' : 'Earned'}</div>
                <div className="text-2xl font-bold mt-1">
                  ${getUserTransactions()
                    .filter(t => user?.type === 'client' ? t.type === 'deposit' : t.type === 'earning')
                    .reduce((sum, t) => sum + t.amount, 0)
                    .toFixed(2)}
                </div>
              </div>
              <div>
                <div className="text-indigo-100">Transactions</div>
                <div className="text-2xl font-bold mt-1">{getUserTransactions().length}</div>
              </div>
              <div>
                <div className="text-indigo-100">This Month</div>
                <div className="text-2xl font-bold mt-1">
                  ${getUserTransactions()
                    .filter(t => {
                      const date = new Date(t.timestamp);
                      const now = new Date();
                      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
                    })
                    .reduce((sum, t) => {
                      if (user?.type === 'client') {
                        return sum + (t.type === 'deposit' ? t.amount : t.type === 'payment' ? -t.amount : 0);
                      } else {
                        return sum + (t.type === 'earning' ? t.amount : t.type === 'withdrawal' ? -t.amount : 0);
                      }
                    }, 0)
                    .toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          {/* Freelancer Marketplace (for clients) */}
          {user?.type === 'client' && (
            <div className="bg-white rounded-xl shadow-md p-6 mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">🌟 Our Expert Translators</h2>
              <p className="text-gray-600 mb-4">Your projects are automatically matched with the best available translator</p>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {freelancerProfiles.slice(0, 4).map((profile) => {
                  return (
                    <div key={profile.id} className="border border-gray-200 rounded-lg p-4 hover:border-indigo-300 transition">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full ${profile.isAvailable ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                          <span className="text-sm text-gray-600">{profile.isAvailable ? 'Available' : 'Busy'}</span>
                        </div>
                        <div className="flex items-center text-yellow-500">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          <span className="text-sm font-semibold ml-1">{profile.rating}</span>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 mb-2">{profile.completedProjects} projects completed</div>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {profile.languages.slice(0, 3).map((lang, idx) => (
                          <span key={idx} className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">
                            {lang}
                          </span>
                        ))}
                      </div>
                      <div className="text-sm font-semibold text-indigo-600">${profile.pricePerWord}/word</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {profile.activeProjects}/{profile.maxConcurrentProjects} active
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recent Projects */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Projects</h2>
            {userProjects.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No projects yet</p>
            ) : (
              <div className="space-y-3">
                {userProjects.slice(0, 5).map((project) => (
                  <div
                    key={project.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => {
                      setSelectedProject(project);
                      setCurrentView('projects');
                    }}
                  >
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">{project.title}</div>
                      <div className="text-sm text-gray-500">
                        {project.sourceLanguage} → {project.targetLanguage} | {project.wordCount} words
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      project.status === 'completed' ? 'bg-green-100 text-green-800' :
                      project.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                      project.status === 'review' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {project.status.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // New Project Component
  const NewProject = () => (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Create New Project</h1>
          <p className="text-gray-600 mt-2">Fill in the details for your translation project</p>
        </div>

        <form onSubmit={handleCreateProject} className="bg-white rounded-xl shadow-md p-8 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Project Title *</label>
            <input
              type="text"
              value={newProjectForm.title}
              onChange={(e) => setNewProjectForm({ ...newProjectForm, title: e.target.value })}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none"
              placeholder="e.g., Legal Contract Translation"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Source Language *</label>
              <select
                value={newProjectForm.sourceLanguage}
                onChange={(e) => setNewProjectForm({ ...newProjectForm, sourceLanguage: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none"
              >
                {['English', 'Spanish', 'French', 'German', 'Chinese', 'Japanese', 'Arabic', 'Russian'].map(lang => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Target Language *</label>
              <select
                value={newProjectForm.targetLanguage}
                onChange={(e) => setNewProjectForm({ ...newProjectForm, targetLanguage: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none"
              >
                {['Spanish', 'English', 'French', 'German', 'Chinese', 'Japanese', 'Arabic', 'Russian'].map(lang => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Word Count *</label>
              <input
                type="number"
                value={newProjectForm.wordCount}
                onChange={(e) => setNewProjectForm({ ...newProjectForm, wordCount: e.target.value })}
                required
                min="1"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none"
                placeholder="e.g., 2500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Deadline *</label>
              <input
                type="date"
                value={newProjectForm.deadline}
                onChange={(e) => setNewProjectForm({ ...newProjectForm, deadline: e.target.value })}
                required
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Project Description</label>
            <textarea
              value={newProjectForm.description}
              onChange={(e) => setNewProjectForm({ ...newProjectForm, description: e.target.value })}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none resize-none"
              placeholder="Provide any additional details about your project..."
            />
          </div>

          {newProjectForm.wordCount && (
            <div className="bg-indigo-50 p-4 rounded-lg">
              <div className="text-sm text-gray-700 mb-1">Estimated Price</div>
              <div className="text-2xl font-bold text-indigo-600">
                ${(parseFloat(newProjectForm.wordCount || '0') * 0.12).toFixed(2)}
              </div>
              <div className="text-sm text-gray-600 mt-1">Based on $0.12 per word (Professional rate)</div>
            </div>
          )}

          <div className="flex gap-4">
            <button
              type="submit"
              className="flex-1 bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition"
            >
              Create Project
            </button>
            <button
              type="button"
              onClick={() => setCurrentView('dashboard')}
              className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  // Projects Component
  const Projects = () => (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Projects</h1>
            <p className="text-gray-600 mt-2">Track and manage your translation projects</p>
          </div>
          {user?.type === 'client' && (
            <button
              onClick={() => setCurrentView('new-project')}
              className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition"
            >
              + New Project
            </button>
          )}
        </div>

        {userProjects.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No projects yet</h3>
            <p className="text-gray-600 mb-6">Start your first translation project today!</p>
            {user?.type === 'client' && (
              <button
                onClick={() => setCurrentView('new-project')}
                className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition"
              >
                Create Your First Project
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {userProjects.map((project) => {
              const projectMessages = getProjectMessages(project.id);
              const unreadProjectMessages = projectMessages.filter(m => m.senderId !== user?.id && !m.read).length;

              return (
                <div key={project.id} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="text-xl font-semibold text-gray-900">{project.title}</h3>
                        {project.autoAssigned && (
                          <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-1 rounded-full font-medium">
                            🤖 Auto-assigned
                          </span>
                        )}
                      </div>
                      <div className="flex items-center flex-wrap gap-3 mt-2 text-sm text-gray-600">
                        <span>🌐 {project.sourceLanguage} → {project.targetLanguage}</span>
                        <span>📝 {project.wordCount} words</span>
                        <span>📅 Due: {new Date(project.deadline).toLocaleDateString()}</span>
                        {project.translatorName && (
                          <span className="bg-purple-50 text-purple-700 px-2 py-1 rounded-md font-medium">
                            👤 {project.translatorName}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <div className="text-2xl font-bold text-gray-900">${project.price.toFixed(2)}</div>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mt-2 ${
                        project.status === 'completed' ? 'bg-green-100 text-green-800' :
                        project.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                        project.status === 'assigned' ? 'bg-indigo-100 text-indigo-800' :
                        project.status === 'review' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {project.status.replace('-', ' ').toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {/* Project Files */}
                  {project.files.length > 0 && (
                    <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                      <div className="text-sm font-semibold text-gray-700 mb-2">Files ({project.files.length})</div>
                      <div className="space-y-2">
                        {project.files.map(file => (
                          <div key={file.id} className="flex items-center justify-between text-sm">
                            <div className="flex items-center space-x-2">
                              <span>📎</span>
                              <span className="text-gray-700">{file.name}</span>
                              <span className="text-gray-500">({(file.size / 1024).toFixed(1)} KB)</span>
                            </div>
                            <a
                              href={file.data}
                              download={file.name}
                              className="text-indigo-600 hover:text-indigo-700"
                            >
                              Download
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Upload Zone */}
                  <div className="mb-4">
                    <FileUploadZone projectId={project.id} />
                  </div>

                  <div className="flex space-x-3">
                    {user?.type === 'translator' && project.status !== 'completed' && (
                      <select
                        value={project.status}
                        onChange={(e) => updateProject(project.id, { status: e.target.value as Project['status'] })}
                        className="flex-1 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition"
                      >
                        <option value="assigned">Assigned</option>
                        <option value="in-progress">In Progress</option>
                        <option value="review">Under Review</option>
                        <option value="completed">Completed</option>
                      </select>
                    )}
                    {user?.type === 'client' && (
                      <div className="flex-1 text-center text-gray-600 py-2">
                        Status: <span className="font-semibold">{project.status.replace('-', ' ')}</span>
                      </div>
                    )}
                    <button
                      onClick={() => {
                        setSelectedProject(project);
                        setCurrentView('messages');
                      }}
                      className="flex-1 bg-indigo-50 text-indigo-600 px-4 py-2 rounded-lg hover:bg-indigo-100 transition relative"
                    >
                      💬 Messages
                      {unreadProjectMessages > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                          {unreadProjectMessages}
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  // Messages Component
  const Messages = () => {
    const projectMessages = selectedProject ? getProjectMessages(selectedProject.id) : [];

    useEffect(() => {
      // Mark messages as read when viewing
      if (selectedProject) {
        projectMessages.forEach(msg => {
          if (msg.senderId !== user?.id && !msg.read) {
            markMessageAsRead(msg.id);
          }
        });
      }
    }, [selectedProject, projectMessages.length]);

    return (
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Messages</h1>
          
          <div className="grid md:grid-cols-3 gap-6">
            {/* Project List */}
            <div className="md:col-span-1 bg-white rounded-xl shadow-md p-4 h-[600px] overflow-y-auto">
              <h2 className="font-semibold text-gray-900 mb-4">Projects</h2>
              {userProjects.length === 0 ? (
                <p className="text-gray-500 text-center py-8 text-sm">No projects yet</p>
              ) : (
                <div className="space-y-2">
                  {userProjects.map((project) => {
                    const msgs = getProjectMessages(project.id);
                    const unread = msgs.filter(m => m.senderId !== user?.id && !m.read).length;
                    
                    return (
                      <div
                        key={project.id}
                        onClick={() => setSelectedProject(project)}
                        className={`p-3 rounded-lg cursor-pointer transition ${
                          selectedProject?.id === project.id
                            ? 'bg-indigo-100 border-2 border-indigo-600'
                            : 'bg-gray-50 hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <div className="font-semibold text-gray-900 text-sm">{project.title}</div>
                          {unread > 0 && (
                            <span className="bg-red-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                              {unread}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">{msgs.length} messages</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Chat Window */}
            <div className="md:col-span-2 bg-white rounded-xl shadow-md flex flex-col h-[600px]">
              {selectedProject ? (
                <>
                  <div className="p-4 border-b border-gray-200">
                    <h2 className="font-semibold text-gray-900">{selectedProject.title}</h2>
                    <div className="text-sm text-gray-500">
                      {selectedProject.sourceLanguage} → {selectedProject.targetLanguage}
                    </div>
                  </div>
                  
                  <div className="flex-1 p-4 overflow-y-auto space-y-4">
                    {projectMessages.length === 0 ? (
                      <div className="text-center text-gray-500 py-12">
                        <div className="text-4xl mb-2">💬</div>
                        <p>No messages yet. Start the conversation!</p>
                      </div>
                    ) : (
                      projectMessages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-md rounded-lg p-3 ${
                            message.senderId === user?.id
                              ? 'bg-indigo-600 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}>
                            <div className="font-semibold text-sm mb-1">{message.senderName}</div>
                            <div>{message.text}</div>
                            <div className={`text-xs mt-1 ${
                              message.senderId === user?.id ? 'text-indigo-200' : 'text-gray-500'
                            }`}>
                              {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200">
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none"
                      />
                      <button
                        type="submit"
                        disabled={!messageInput.trim()}
                        className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Send
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <div className="text-6xl mb-4">👈</div>
                    <p>Select a project to view messages</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Auth Modal
  const AuthModal = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          {authMode === 'login' ? 'Login' : 'Create Account'}
        </h2>

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setAuthType('client')}
            className={`flex-1 py-2 rounded-lg transition ${
              authType === 'client'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            👤 Client
          </button>
          <button
            onClick={() => setAuthType('translator')}
            className={`flex-1 py-2 rounded-lg transition ${
              authType === 'translator'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            🌐 Translator
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          {authMode === 'register' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
              <input
                type="text"
                value={authForm.name}
                onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none"
                placeholder="Your name"
              />
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={authForm.email}
              onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <input
              type="password"
              value={authForm.password}
              onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
          >
            {loading ? 'Please wait...' : authMode === 'login' ? 'Login' : 'Create Account'}
          </button>

          <div className="text-center text-sm">
            <button
              type="button"
              onClick={() => {
                setAuthMode(authMode === 'login' ? 'register' : 'login');
                setError('');
              }}
              className="text-indigo-600 hover:text-indigo-700"
            >
              {authMode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Login'}
            </button>
          </div>
        </form>

        {authMode === 'login' && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg text-sm">
            <div className="font-semibold text-blue-900 mb-2">Demo Accounts:</div>
            <div className="text-blue-800 space-y-1">
              <div><strong>Client:</strong> client@example.com / password</div>
              <div><strong>Translator:</strong> translator@example.com / password</div>
            </div>
          </div>
        )}

        <button
          onClick={() => setShowAuth(false)}
          className="w-full mt-4 border-2 border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50 transition"
        >
          Cancel
        </button>
      </div>
    </div>
  );

  // Handle wallet transactions
  const handleWalletTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    setWalletLoading(true);
    
    const amount = parseFloat(walletForm.amount);
    if (amount <= 0) {
      alert('Please enter a valid amount');
      setWalletLoading(false);
      return;
    }
    
    try {
      let success = false;
      if (walletAction === 'deposit') {
        success = await depositFunds(amount, walletForm.paymentMethod);
      } else {
        success = await withdrawFunds(amount, walletForm.paymentMethod);
      }
      
      if (success) {
        setShowWalletModal(false);
        setWalletForm({ amount: '', paymentMethod: 'credit_card' });
        alert(`${walletAction === 'deposit' ? 'Deposit' : 'Withdrawal'} successful!`);
      }
    } catch (error) {
      alert('Transaction failed. Please try again.');
    } finally {
      setWalletLoading(false);
    }
  };

  // Wallet View Component
  const WalletView = () => {
    const transactions = getUserTransactions();
    const balance = getWalletBalance();

    return (
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">My Wallet</h1>
            <p className="text-gray-600 mt-2">Manage your funds and view transaction history</p>
          </div>

          {/* Balance Card */}
          <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl shadow-2xl p-8 mb-8 text-white">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-indigo-100 mb-2">Available Balance</div>
                <div className="text-5xl font-bold mb-6">${balance.toFixed(2)}</div>
                <div className="flex gap-4">
                  <button
                    onClick={() => {
                      setWalletAction('deposit');
                      setShowWalletModal(true);
                    }}
                    className="bg-white text-indigo-600 px-6 py-3 rounded-lg font-semibold hover:bg-indigo-50 transition shadow-lg"
                  >
                    💳 Add Funds
                  </button>
                  <button
                    onClick={() => {
                      setWalletAction('withdraw');
                      setShowWalletModal(true);
                    }}
                    className="bg-white/20 text-white px-6 py-3 rounded-lg font-semibold hover:bg-white/30 transition backdrop-blur-sm"
                  >
                    💸 Withdraw
                  </button>
                </div>
              </div>
              <div className="text-right">
                <svg className="w-20 h-20 text-white/30" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                  <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>

          {/* Transaction History */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Transaction History</h2>
            {transactions.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <div className="text-5xl mb-3">📊</div>
                <p>No transactions yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${
                        transaction.type === 'deposit' ? 'bg-green-100' :
                        transaction.type === 'withdrawal' ? 'bg-red-100' :
                        transaction.type === 'payment' ? 'bg-orange-100' :
                        'bg-blue-100'
                      }`}>
                        {transaction.type === 'deposit' ? '💰' :
                         transaction.type === 'withdrawal' ? '💸' :
                         transaction.type === 'payment' ? '💳' :
                         '✅'}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 capitalize">
                          {transaction.type.replace('_', ' ')}
                        </div>
                        <div className="text-sm text-gray-600">{transaction.description}</div>
                        <div className="text-xs text-gray-500">
                          {format(new Date(transaction.timestamp), 'MMM dd, yyyy hh:mm a')}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-xl font-bold ${
                        transaction.type === 'deposit' || transaction.type === 'earning' ? 'text-green-600' :
                        'text-red-600'
                      }`}>
                        {transaction.type === 'deposit' || transaction.type === 'earning' ? '+' : '-'}
                        ${transaction.amount.toFixed(2)}
                      </div>
                      {transaction.transactionFee && (
                        <div className="text-xs text-gray-500">Fee: ${transaction.transactionFee.toFixed(2)}</div>
                      )}
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        transaction.status === 'completed' ? 'bg-green-100 text-green-700' :
                        transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {transaction.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Wallet Modal
  const WalletModal = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {walletAction === 'deposit' ? '💳 Add Funds to Wallet' : '💸 Withdraw Your Earnings'}
        </h2>
        <p className="text-gray-600 mb-6">
          {walletAction === 'deposit' 
            ? 'Add money to pay for translation projects' 
            : 'Cash out your earnings to your preferred payment method'}
        </p>

        <form onSubmit={handleWalletTransaction} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Amount (USD) *</label>
            <input
              type="number"
              value={walletForm.amount}
              onChange={(e) => setWalletForm({ ...walletForm, amount: e.target.value })}
              required
              min="1"
              step="0.01"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none text-lg"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method *</label>
            <select
              value={walletForm.paymentMethod}
              onChange={(e) => setWalletForm({ ...walletForm, paymentMethod: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none"
            >
              <option value="credit_card">💳 Credit Card</option>
              <option value="debit_card">💳 Debit Card</option>
              <option value="paypal">💰 PayPal</option>
              <option value="bank_transfer">🏦 Bank Transfer</option>
              <option value="upi">📱 UPI (India)</option>
              <option value="crypto">₿ Cryptocurrency</option>
            </select>
          </div>

          {walletAction === 'deposit' && user?.type === 'client' && walletForm.amount && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div className="text-sm text-blue-800">
                  <div className="font-semibold mb-1">Platform Commission (5%)</div>
                  <div className="space-y-1">
                    <div>Amount: <span className="font-semibold">${parseFloat(walletForm.amount).toFixed(2)}</span></div>
                    <div>Platform Fee (5%): <span className="font-semibold">${(parseFloat(walletForm.amount) * 0.05).toFixed(2)}</span></div>
                    <div className="pt-1 border-t border-blue-300">Total Charge: <span className="font-bold text-lg">${(parseFloat(walletForm.amount) * 1.05).toFixed(2)}</span></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {walletAction === 'withdraw' && walletForm.amount && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div className="text-sm text-yellow-800">
                  <div className="font-semibold mb-1">Withdrawal Fee (2%)</div>
                  <div className="space-y-1">
                    <div>Amount: <span className="font-semibold">${parseFloat(walletForm.amount).toFixed(2)}</span></div>
                    <div>Processing Fee (2%): <span className="font-semibold">${(parseFloat(walletForm.amount) * 0.02).toFixed(2)}</span></div>
                    <div className="pt-1 border-t border-yellow-300">You'll Receive: <span className="font-bold text-lg">${(parseFloat(walletForm.amount) * 0.98).toFixed(2)}</span></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={walletLoading}
              className="flex-1 bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
            >
              {walletLoading ? 'Processing...' : `${walletAction === 'deposit' ? 'Add' : 'Withdraw'} Funds`}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowWalletModal(false);
                setWalletForm({ amount: '', paymentMethod: 'credit_card' });
              }}
              disabled={walletLoading}
              className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  // Portal Navigation
  if (user && currentView !== 'home') {
    return (
      <div className="min-h-screen">
        {showWalletModal && <WalletModal />}
        
        {/* Portal Navigation */}
        <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-sm z-50 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-2">
                <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                </svg>
                <span className="text-xl font-bold text-gray-900">Lingua Solutions India</span>
              </div>
              <div className="flex items-center space-x-6">
                <button
                  onClick={() => setCurrentView('dashboard')}
                  className={`${currentView === 'dashboard' ? 'text-indigo-600' : 'text-gray-700'} hover:text-indigo-600 transition`}
                >
                  Dashboard
                </button>
                <button
                  onClick={() => setCurrentView('projects')}
                  className={`${currentView === 'projects' || currentView === 'new-project' ? 'text-indigo-600' : 'text-gray-700'} hover:text-indigo-600 transition`}
                >
                  Projects
                </button>
                <button
                  onClick={() => setCurrentView('messages')}
                  className={`${currentView === 'messages' ? 'text-indigo-600' : 'text-gray-700'} hover:text-indigo-600 transition relative`}
                >
                  Messages
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-2 bg-red-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setCurrentView('wallet')}
                  className={`${currentView === 'wallet' ? 'text-indigo-600' : 'text-gray-700'} hover:text-indigo-600 transition font-semibold`}
                >
                  💰 {formatCurrency(getWalletBalance())}
                </button>
                <select
                  value={user?.currency || 'USD'}
                  onChange={(e) => changeCurrency(e.target.value)}
                  className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none"
                >
                  {CURRENCIES.map(currency => (
                    <option key={currency.code} value={currency.code}>
                      {currency.flag} {currency.code}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => setCurrentView('home')}
                  className="text-gray-700 hover:text-indigo-600 transition"
                >
                  Home
                </button>
                <button
                  onClick={handleLogout}
                  className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </nav>

        {currentView === 'dashboard' && <Dashboard />}
        {currentView === 'projects' && <Projects />}
        {currentView === 'new-project' && <NewProject />}
        {currentView === 'messages' && <Messages />}
        {currentView === 'wallet' && <WalletView />}
      </div>
    );
  }

  // Main Website (rest of the code remains the same as before)
  return (
    <div className="min-h-screen bg-white">
      {showAuth && <AuthModal />}
      
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-sm z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
              </svg>
              <span className="text-xl font-bold text-gray-900">Lingua Solutions India</span>
            </div>
            <div className="hidden md:flex space-x-8 items-center">
              <a href="#home" className="text-gray-700 hover:text-indigo-600 transition">Home</a>
              <a href="#services" className="text-gray-700 hover:text-indigo-600 transition">Services</a>
              <a href="#pricing" className="text-gray-700 hover:text-indigo-600 transition">Pricing</a>
              <a href="#testimonials" className="text-gray-700 hover:text-indigo-600 transition">Testimonials</a>
              <a href="#contact" className="text-gray-700 hover:text-indigo-600 transition">Contact</a>
              <button
                onClick={() => setShowAuth(true)}
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition"
              >
                Client Portal
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" className="pt-24 pb-20 px-4 bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-block bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full text-sm font-semibold">
                ⭐ Rated 4.9/5 by 287+ clients
              </div>
              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight">
                Professional Translation Services You Can Trust
              </h1>
              <p className="text-xl text-gray-600">
                Connect with expert translators for certified, accurate translations in 15+ languages. Fast delivery, competitive rates, and 100% satisfaction guaranteed.
              </p>
              <div className="flex gap-4">
                <a href="#contact" className="px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition shadow-lg">
                  Get Free Quote
                </a>
                <button
                  onClick={() => setShowAuth(true)}
                  className="px-8 py-3 border-2 border-indigo-600 text-indigo-600 rounded-lg hover:bg-indigo-50 transition"
                >
                  Access Portal
                </button>
              </div>
              <div className="flex gap-8 pt-4">
                <div>
                  <div className="text-3xl font-bold text-indigo-600">500+</div>
                  <div className="text-gray-600">Projects Completed</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-indigo-600">15+</div>
                  <div className="text-gray-600">Languages</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-indigo-600">98%</div>
                  <div className="text-gray-600">Satisfaction</div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-indigo-400 to-purple-500 rounded-2xl p-8 shadow-2xl">
                <svg className="w-full h-full text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Translation Services</h2>
            <p className="text-xl text-gray-600">Comprehensive language solutions for every need</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />,
                title: 'Document Translation',
                description: 'Legal, technical, medical, and business documents translated with precision.'
              },
              {
                icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />,
                title: 'Website Localization',
                description: 'Adapt your website for global markets with culturally-sensitive translation.'
              },
              {
                icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />,
                title: 'Certified Translation',
                description: 'Official certified translations accepted by courts and government agencies.'
              },
            ].map((service, index) => (
              <div key={index} className="p-6 bg-white border border-gray-200 rounded-xl hover:shadow-xl transition hover:border-indigo-300">
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {service.icon}
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{service.title}</h3>
                <p className="text-gray-600">{service.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Commission Details Section */}
      <section id="pricing" className="py-20 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Transparent Commission Structure</h2>
            <p className="text-xl text-gray-600">Simple, fair, and most competitive platform fees in the industry</p>
          </div>

          {/* Commission Comparison */}
          <div className="max-w-5xl mx-auto mb-16">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Client Commission */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border-2 border-blue-200 hover:shadow-xl transition-shadow">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">👥</span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800">For Clients</h3>
                </div>
                
                <div className="bg-white rounded-xl p-6 mb-6 shadow-lg">
                  <div className="text-center mb-4">
                    <div className="text-5xl font-bold text-blue-600 mb-2">5%</div>
                    <div className="text-gray-600 font-medium">Platform Commission</div>
                  </div>
                  <div className="border-t pt-4">
                    <p className="text-sm text-gray-600 mb-3 text-center">Applied on deposit amount</p>
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="text-sm space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Deposit:</span>
                          <span className="font-semibold text-gray-900">₹10,000</span>
                        </div>
                        <div className="flex justify-between text-blue-600">
                          <span>Platform Fee (5%):</span>
                          <span className="font-semibold">+ ₹500</span>
                        </div>
                        <div className="border-t border-blue-200 pt-2 mt-2 flex justify-between font-bold text-gray-900">
                          <span>Total Charged:</span>
                          <span className="text-lg">₹10,500</span>
                        </div>
                        <div className="flex justify-between text-green-600 font-semibold">
                          <span>Wallet Balance:</span>
                          <span>₹10,000</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <span className="text-green-500 mt-1 text-lg">✓</span>
                    <span className="text-gray-700">One-time fee on deposits only</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-green-500 mt-1 text-lg">✓</span>
                    <span className="text-gray-700">No fees on project payments</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-green-500 mt-1 text-lg">✓</span>
                    <span className="text-gray-700">Auto-matched with expert translators</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-green-500 mt-1 text-lg">✓</span>
                    <span className="text-gray-700">Secure escrow payment protection</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-green-500 mt-1 text-lg">✓</span>
                    <span className="text-gray-700">Full project management portal</span>
                  </div>
                </div>
              </div>

              {/* Freelancer Commission */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-8 border-2 border-purple-200 hover:shadow-xl transition-shadow">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">💼</span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800">For Freelancers</h3>
                </div>
                
                <div className="bg-white rounded-xl p-6 mb-6 shadow-lg">
                  <div className="text-center mb-4">
                    <div className="text-5xl font-bold text-purple-600 mb-2">2%</div>
                    <div className="text-gray-600 font-medium">Withdrawal Fee</div>
                  </div>
                  <div className="border-t pt-4">
                    <p className="text-sm text-gray-600 mb-3 text-center">Applied on withdrawal amount</p>
                    <div className="bg-purple-50 rounded-lg p-4">
                      <div className="text-sm space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Withdraw:</span>
                          <span className="font-semibold text-gray-900">₹10,000</span>
                        </div>
                        <div className="flex justify-between text-purple-600">
                          <span>Processing Fee (2%):</span>
                          <span className="font-semibold">- ₹200</span>
                        </div>
                        <div className="border-t border-purple-200 pt-2 mt-2 flex justify-between font-bold text-gray-900">
                          <span>Wallet Deducted:</span>
                          <span className="text-lg">₹10,000</span>
                        </div>
                        <div className="flex justify-between text-green-600 font-semibold">
                          <span>You Receive:</span>
                          <span>₹9,800</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <span className="text-green-500 mt-1 text-lg">✓</span>
                    <span className="text-gray-700">Keep 100% of project earnings</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-green-500 mt-1 text-lg">✓</span>
                    <span className="text-gray-700">No commission on payments received</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-green-500 mt-1 text-lg">✓</span>
                    <span className="text-gray-700">Automatic project assignments</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-green-500 mt-1 text-lg">✓</span>
                    <span className="text-gray-700">Fast payment via UPI, PayPal & more</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-green-500 mt-1 text-lg">✓</span>
                    <span className="text-gray-700">Multiple withdrawal methods</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Why Our Pricing is Better */}
          <div className="max-w-4xl mx-auto mb-12">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-white shadow-2xl">
              <h3 className="text-3xl font-bold mb-8 text-center">Why Lingua Solutions India is the Most Competitive</h3>
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="text-center bg-white/10 rounded-xl p-6 backdrop-blur-sm">
                  <div className="text-5xl font-bold mb-2">5% + 2%</div>
                  <div className="text-xl font-semibold mb-1">Lingua Solutions India</div>
                  <div className="text-sm bg-green-500 rounded-lg py-2 mt-3 font-bold">✓ Most Competitive</div>
                </div>
                <div className="text-center bg-white/5 rounded-xl p-6">
                  <div className="text-4xl font-bold mb-2 opacity-80">10-20%</div>
                  <div className="text-lg mb-1 opacity-80">Upwork</div>
                  <div className="text-sm opacity-70 mt-3">From Freelancers Only</div>
                </div>
                <div className="text-center bg-white/5 rounded-xl p-6">
                  <div className="text-4xl font-bold mb-2 opacity-80">20%</div>
                  <div className="text-lg mb-1 opacity-80">Fiverr</div>
                  <div className="text-sm opacity-70 mt-3">From Freelancers Only</div>
                </div>
              </div>
              <div className="grid md:grid-cols-3 gap-4 pt-6 border-t border-white/20 text-center">
                <div className="bg-white/10 rounded-lg p-4">
                  <div className="text-2xl mb-2">🚀</div>
                  <div className="font-semibold mb-1">Instant Payouts</div>
                  <div className="text-sm opacity-90">UPI, Bank, PayPal, Crypto</div>
                </div>
                <div className="bg-white/10 rounded-lg p-4">
                  <div className="text-2xl mb-2">🔒</div>
                  <div className="font-semibold mb-1">Razorpay Secure</div>
                  <div className="text-sm opacity-90">Protected Transactions</div>
                </div>
                <div className="bg-white/10 rounded-lg p-4">
                  <div className="text-2xl mb-2">💯</div>
                  <div className="font-semibold mb-1">No Hidden Fees</div>
                  <div className="text-sm opacity-90">100% Transparent</div>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="max-w-5xl mx-auto">
            <h4 className="text-2xl font-bold text-center mb-8 text-gray-900">Supported Payment Methods</h4>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-white px-6 py-4 rounded-xl shadow-md border-2 border-indigo-100 hover:border-indigo-300 transition text-center">
                <div className="text-3xl mb-2">💳</div>
                <div className="font-semibold text-gray-900">Cards</div>
                <div className="text-sm text-gray-600">Credit & Debit</div>
              </div>
              <div className="bg-white px-6 py-4 rounded-xl shadow-md border-2 border-indigo-100 hover:border-indigo-300 transition text-center">
                <div className="text-3xl mb-2">📱</div>
                <div className="font-semibold text-gray-900">UPI</div>
                <div className="text-sm text-gray-600">PhonePe, GPay, Paytm</div>
              </div>
              <div className="bg-white px-6 py-4 rounded-xl shadow-md border-2 border-indigo-100 hover:border-indigo-300 transition text-center">
                <div className="text-3xl mb-2">💰</div>
                <div className="font-semibold text-gray-900">PayPal</div>
                <div className="text-sm text-gray-600">Worldwide</div>
              </div>
              <div className="bg-white px-6 py-4 rounded-xl shadow-md border-2 border-indigo-100 hover:border-indigo-300 transition text-center">
                <div className="text-3xl mb-2">🏦</div>
                <div className="font-semibold text-gray-900">Bank Transfer</div>
                <div className="text-sm text-gray-600">Direct Deposit</div>
              </div>
              <div className="bg-white px-6 py-4 rounded-xl shadow-md border-2 border-indigo-100 hover:border-indigo-300 transition text-center">
                <div className="text-3xl mb-2">₿</div>
                <div className="font-semibold text-gray-900">Cryptocurrency</div>
                <div className="text-sm text-gray-600">BTC, ETH, USDT</div>
              </div>
              <div className="bg-white px-6 py-4 rounded-xl shadow-md border-2 border-indigo-100 hover:border-indigo-300 transition text-center">
                <div className="text-3xl mb-2">🌍</div>
                <div className="font-semibold text-gray-900">All Currencies</div>
                <div className="text-sm text-gray-600">20+ Supported</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Client Testimonials</h2>
            <p className="text-xl text-gray-600">See what our clients say</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: 'Sarah Johnson',
                role: 'CEO, TechStart Inc.',
                text: 'Outstanding service! The translation was flawless and delivered ahead of schedule.'
              },
              {
                name: 'Miguel Rodriguez',
                role: 'Author',
                text: 'The translator perfectly captured the nuances of my work. Highly recommend!'
              },
              {
                name: 'Emily Chen',
                role: 'Marketing Director',
                text: 'Professional and reliable. Our international sales increased by 40%!'
              }
            ].map((testimonial, idx) => (
              <div key={idx} className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                <div className="flex mb-3">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-gray-700 italic mb-4">\"{testimonial.text}\"</p>
                <div className="font-semibold text-gray-900">{testimonial.name}</div>
                <div className="text-sm text-gray-600">{testimonial.role}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Get Your Free Quote</h2>
            <p className="text-xl text-gray-600">Start your translation project today!</p>
          </div>
          <form onSubmit={handleContactSubmit} className="bg-white rounded-xl shadow-lg p-8 space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
                <input
                  type="text"
                  value={contactForm.name}
                  onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                <input
                  type="email"
                  value={contactForm.email}
                  onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none"
                  placeholder="your@email.com"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Service *</label>
              <select
                value={contactForm.service}
                onChange={(e) => setContactForm({ ...contactForm, service: e.target.value })}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none"
              >
                <option value="">Select a service</option>
                <option value="document">Document Translation</option>
                <option value="website">Website Localization</option>
                <option value="certified">Certified Translation</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Message *</label>
              <textarea
                value={contactForm.message}
                onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                required
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none resize-none"
                placeholder="Tell us about your project..."
              />
            </div>
            <button
              type="submit"
              className="w-full bg-indigo-600 text-white py-4 rounded-lg font-semibold hover:bg-indigo-700 transition shadow-lg"
            >
              Get Free Quote
            </button>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
            </svg>
            <span className="text-xl font-bold">Lingua Solutions India</span>
          </div>
          <p className="text-gray-400 mb-4">Professional translation services for a global world</p>
          <p className="text-gray-400">&copy; 2026 Lingua Solutions India. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

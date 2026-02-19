'''import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Currency {
  code: string;
  symbol: string;
  name: string;
  flag: string;
  rate: number; // Exchange rate relative to USD
}

export interface User {
  id: string;
  name: string;
  email: string;
  type: 'client' | 'translator';
  avatar?: string;
  walletBalance: number;
  currency: string; // Currency code (USD, INR, EUR, etc.)
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'deposit' | 'withdrawal' | 'payment' | 'earning' | 'refund' | 'commission';
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  description: string;
  projectId?: string;
  timestamp: string;
  paymentMethod?: string;
  transactionFee?: number;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  commissionAmount?: number;
}

// Freelancer Profile with specializations and availability
export interface FreelancerProfile {
  id: string;
  userId: string;
  languages: string[]; // Languages they can translate
  specializations: string[]; // Document types: legal, medical, technical, etc.
  rating: number;
  completedProjects: number;
  activeProjects: number;
  maxConcurrentProjects: number;
  isAvailable: boolean;
  pricePerWord: number;
  responseTime: number; // Average response time in hours
}

export interface Project {
  id: string;
  title: string;
  sourceLanguage: string;
  targetLanguage: string;
  status: 'pending' | 'assigned' | 'in-progress' | 'review' | 'completed' | 'cancelled';
  wordCount: number;
  deadline: string;
  price: number;
  clientId: string;
  translatorId?: string;
  translatorName?: string;
  files: ProjectFile[];
  createdAt: string;
  updatedAt: string;
  assignedAt?: string;
  autoAssigned: boolean;
  matchScore?: number; // How well the translator matches the project
}

export interface ProjectFile {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: string;
  uploadedBy: string;
  data: string; // base64 encoded
}

export interface Message {
  id: string;
  projectId: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
  read: boolean;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'project_assigned' | 'project_completed' | 'message' | 'status_change';
  title: string;
  message: string;
  projectId?: string;
  read: boolean;
  timestamp: string;
}

interface AppState {
  user: User | null;
  projects: Project[];
  messages: Message[];
  freelancerProfiles: FreelancerProfile[];
  notifications: Notification[];
  transactions: Transaction[];
  platformCommissionBalance: number; // Total commission earned by platform
  
  // Auth actions
  login: (email: string, password: string, type: 'client' | 'translator') => Promise<boolean>;
  register: (name: string, email: string, password: string, type: 'client' | 'translator') => Promise<boolean>;
  logout: () => void;
  
  // Currency actions
  changeCurrency: (currencyCode: string) => void;
  convertAmount: (amount: number, fromCurrency: string, toCurrency: string) => number;
  formatCurrency: (amount: number, currencyCode?: string) => string;
  
  // Wallet actions
  depositFunds: (amount: number, paymentMethod: string) => Promise<boolean>;
  withdrawFunds: (amount: number, paymentMethod: string) => Promise<boolean>;
  processPayment: (projectId: string, amount: number) => Promise<boolean>;
  getUserTransactions: () => Transaction[];
  getWalletBalance: () => number;
  getPlatformCommissionBalance: () => number;
  getPlatformTransactions: () => Transaction[];
  
  // Project actions
  createProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'files' | 'autoAssigned'>) => string;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  uploadFile: (projectId: string, file: File) => Promise<void>;
  deleteFile: (projectId: string, fileId: string) => void;
  
  // Auto-assignment
  autoAssignProject: (projectId: string) => boolean;
  findBestTranslator: (project: Project) => FreelancerProfile | null;
  
  // Message actions
  sendMessage: (projectId: string, text: string) => void;
  markMessageAsRead: (messageId: string) => void;
  getProjectMessages: (projectId: string) => Message[];
  getUnreadCount: () => number;
  
  // Notification actions
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markNotificationAsRead: (notificationId: string) => void;
  getUnreadNotifications: () => Notification[];
}

// Simulated user database (in real app, this would be backend)
const USERS_DB = [
  { id: '1', name: 'John Client', email: 'client@example.com', password: 'password', type: 'client' as const },
  { id: '2', name: 'Maria Garcia', email: 'translator@example.com', password: 'password', type: 'translator' as const },
  { id: '3', name: 'Ahmed Hassan', email: 'ahmed@example.com', password: 'password', type: 'translator' as const },
  { id: '4', name: 'Li Wei', email: 'liwei@example.com', password: 'password', type: 'translator' as const },
  { id: '5', name: 'Sophie Laurent', email: 'sophie@example.com', password: 'password', type: 'translator' as const },
];

// Supported currencies with real exchange rates
// Country to Currency mapping
const countryCurrencyMap: Record<string, string> = {
  US: 'USD', IN: 'INR', GB: 'GBP', DE: 'EUR', FR: 'EUR', IT: 'EUR',
  ES: 'EUR', NL: 'EUR', BE: 'EUR', AT: 'EUR', PT: 'EUR', IE: 'EUR', GR: 'EUR',
  CA: 'CAD', AU: 'AUD', JP: 'JPY', CN: 'CNY', CH: 'CHF', SE: 'SEK', NZ: 'NZD',
  SG: 'SGD', HK: 'HKD', AE: 'AED', SA: 'SAR', MX: 'MXN', BR: 'BRL', ZA: 'ZAR',
  KR: 'KRW', TH: 'THB',
};

// Detect user's country and set currency automatically
export const detectAndSetCurrency = async (): Promise<string> => {
  try {
    // Try using IP-based geolocation API
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();
    
    if (data.country_code) {
      const currency = countryCurrencyMap[data.country_code] || 'USD';
      console.log(`🌍 Location detected: ${data.country_name} (${data.country_code}) → Currency: ${currency}`);
      return currency;
    }
  } catch (error) {
    console.log('Could not detect location, using default USD');
  }
  
  return 'USD'; // Default fallback
};

// Razorpay Configuration
export const RAZORPAY_CONFIG = {
  keyId: 'rzp_live_RtvHUTxmXEeF4M',
  keySecret: '45TO74k2Ov4jJXWp9K0Oal1r',
  platformAccount: 'acc_platform_commission',
};

export const CURRENCIES: Currency[] = [
  { code: 'USD', symbol: '$', name: 'US Dollar', flag: '🇺🇸', rate: 1.0 },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', flag: '🇮🇳', rate: 83.12 },
  { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇪🇺', rate: 0.92 },
  { code: 'GBP', symbol: '£', name: 'British Pound', flag: '🇬🇧', rate: 0.79 },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', flag: '🇨🇦', rate: 1.36 },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', flag: '🇦🇺', rate: 1.53 },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', flag: '🇯🇵', rate: 149.50 },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', flag: '🇨🇳', rate: 7.24 },
  { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc', flag: '🇨🇭', rate: 0.88 },
  { code: 'SEK', symbol: 'kr', name: 'Swedish Krona', flag: '🇸🇪', rate: 10.87 },
  { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar', flag: '🇳🇿', rate: 1.67 },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', flag: '🇸🇬', rate: 1.34 },
  { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar', flag: '🇭🇰', rate: 7.83 },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', flag: '🇦🇪', rate: 3.67 },
  { code: 'SAR', symbol: 'ر.س', name: 'Saudi Riyal', flag: '🇸🇦', rate: 3.75 },
  { code: 'MXN', symbol: '$', name: 'Mexican Peso', flag: '🇲🇽', rate: 17.08 },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real', flag: '🇧🇷', rate: 4.98 },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand', flag: '🇿🇦', rate: 18.65 },
  { code: 'KRW', symbol: '₩', name: 'South Korean Won', flag: '🇰🇷', rate: 1337.50 },
  { code: 'THB', symbol: '฿', name: 'Thai Baht', flag: '🇹🇭', rate: 35.80 },
];

// Predefined freelancer profiles with language expertise
const INITIAL_FREELANCER_PROFILES: FreelancerProfile[] = [
  {
    id: 'fp1',
    userId: '2',
    languages: ['English', 'Spanish', 'Portuguese'],
    specializations: ['legal', 'business', 'medical'],
    rating: 4.9,
    completedProjects: 127,
    activeProjects: 0,
    maxConcurrentProjects: 5,
    isAvailable: true,
    pricePerWord: 0.12,
    responseTime: 2,
  },
  {
    id: 'fp2',
    userId: '3',
    languages: ['Arabic', 'English', 'French'],
    specializations: ['technical', 'legal', 'marketing'],
    rating: 4.8,
    completedProjects: 89,
    activeProjects: 0,
    maxConcurrentProjects: 4,
    isAvailable: true,
    pricePerWord: 0.10,
    responseTime: 3,
  },
  {
    id: 'fp3',
    userId: '4',
    languages: ['Chinese', 'English', 'Japanese'],
    specializations: ['technical', 'website', 'marketing'],
    rating: 4.95,
    completedProjects: 203,
    activeProjects: 0,
    maxConcurrentProjects: 6,
    isAvailable: true,
    pricePerWord: 0.15,
    responseTime: 1,
  },
  {
    id: 'fp4',
    userId: '5',
    languages: ['French', 'English', 'German', 'Italian'],
    specializations: ['literary', 'business', 'legal'],
    rating: 4.85,
    completedProjects: 156,
    activeProjects: 0,
    maxConcurrentProjects: 5,
    isAvailable: true,
    pricePerWord: 0.13,
    responseTime: 2,
  },
];

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: null,
      projects: [],
      messages: [],
      freelancerProfiles: INITIAL_FREELANCER_PROFILES,
      notifications: [],
      transactions: [],
      platformCommissionBalance: 0,

      // Auth actions
      login: async (email: string, password: string, type: 'client' | 'translator') => {
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const user = USERS_DB.find(u => u.email === email && u.password === password && u.type === type);
        
        if (user) {
          // Detect user's currency based on location
          const detectedCurrency = await detectAndSetCurrency();
          
          set({ user: { id: user.id, name: user.name, email: user.email, type: user.type, walletBalance: 0, currency: detectedCurrency } });
          
          // Notify user about auto-detected currency
          setTimeout(() => {
            get().addNotification({
              userId: user.id,
              type: 'status_change',
              title: 'Currency Auto-Detected',
              message: `Your currency has been set to ${detectedCurrency} based on your location. You can change it anytime from the currency selector.`,
            });
          }, 1000);
          
          return true;
        }
        return false;
      },

      register: async (name: string, email: string, password: string, type: 'client' | 'translator') => {
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Detect user's currency based on location
        const detectedCurrency = await detectAndSetCurrency();
        
        const newUser: User = {
          id: Date.now().toString(),
          name,
          email,
          type,
          walletBalance: 0,
          currency: detectedCurrency,
        };
        
        USERS_DB.push({ ...newUser, password });
        
        // If translator, create a default profile
        if (type === 'translator') {
          const newProfile: FreelancerProfile = {
            id: `fp${Date.now()}`,
            userId: newUser.id,
            languages: ['English', 'Spanish'],
            specializations: ['general'],
            rating: 5.0,
            completedProjects: 0,
            activeProjects: 0,
            maxConcurrentProjects: 3,
            isAvailable: true,
            pricePerWord: 0.10,
            responseTime: 4,
          };
          
          set(state => ({
            freelancerProfiles: [...state.freelancerProfiles, newProfile]
          }));
        }
        
        set({ user: newUser });
        
        // Notify user about auto-detected currency
        setTimeout(() => {
          get().addNotification({
            userId: newUser.id,
            type: 'status_change',
            title: 'Welcome to Lingua Solutions India!',
            message: `Your account has been created. Currency set to ${detectedCurrency} based on your location.`,
          });
        }, 1000);
        
        return true;
      },

      logout: () => {
        set({ user: null });
      },

      // Find best translator based on language match, availability, rating, and workload
      findBestTranslator: (project: Project) => {
        const profiles = get().freelancerProfiles;
        
        // Filter available translators who can handle the language pair
        const eligibleTranslators = profiles.filter(profile => {
          // Check if translator can handle source and target languages
          const canHandleLanguages = 
            profile.languages.includes(project.sourceLanguage) &&
            profile.languages.includes(project.targetLanguage);
          
          // Check availability and capacity
          const hasCapacity = 
            profile.isAvailable && 
            profile.activeProjects < profile.maxConcurrentProjects;
          
          return canHandleLanguages && hasCapacity;
        });
        
        if (eligibleTranslators.length === 0) {
          return null;
        }
        
        // Score each translator
        const scoredTranslators = eligibleTranslators.map(profile => {
          let score = 0;
          
          // Rating weight (40%)
          score += (profile.rating / 5) * 40;
          
          // Experience weight (30%)
          const experienceScore = Math.min(profile.completedProjects / 200, 1);
          score += experienceScore * 30;
          
          // Availability weight (20%)
          const availabilityScore = 1 - (profile.activeProjects / profile.maxConcurrentProjects);
          score += availabilityScore * 20;
          
          // Response time weight (10%)
          const responseScore = 1 - Math.min(profile.responseTime / 24, 1);
          score += responseScore * 10;
          
          return { profile, score };
        });
        
        // Sort by score and return the best match
        scoredTranslators.sort((a, b) => b.score - a.score);
        return scoredTranslators[0].profile;
      },

      // Auto-assign project to best available translator
      autoAssignProject: (projectId: string) => {
        const state = get();
        const project = state.projects.find(p => p.id === projectId);
        
        if (!project || project.translatorId) {
          return false; // Project doesn't exist or already assigned
        }
        
        const bestTranslator = state.findBestTranslator(project);
        
        if (!bestTranslator) {
          console.log('No available translator found for project:', projectId);
          return false;
        }
        
        const translator = USERS_DB.find(u => u.id === bestTranslator.userId);
        
        // Update project with translator assignment
        set(state => ({
          projects: state.projects.map(p =>
            p.id === projectId
              ? {
                  ...p,
                  translatorId: bestTranslator.userId,
                  translatorName: translator?.name || 'Translator',
                  status: 'assigned' as const,
                  assignedAt: new Date().toISOString(),
                  autoAssigned: true,
                  updatedAt: new Date().toISOString(),
                }
              : p
          ),
          freelancerProfiles: state.freelancerProfiles.map(fp =>
            fp.id === bestTranslator.id
              ? { ...fp, activeProjects: fp.activeProjects + 1 }
              : fp
          )
        }));
        
        // Send notifications to both client and translator
        const clientNotification = {
          userId: project.clientId,
          type: 'project_assigned' as const,
          title: 'Project Assigned!',
          message: `Your project "${project.title}" has been automatically assigned to ${translator?.name}.`,
          projectId: project.id,
        };
        
        const translatorNotification = {
          userId: bestTranslator.userId,
          type: 'project_assigned' as const,
          title: 'New Project Assigned!',
          message: `You have been assigned to project "${project.title}". Click to view details.`,
          projectId: project.id,
        };
        
        state.addNotification(clientNotification);
        state.addNotification(translatorNotification);
        
        // Send automatic welcome message
        const welcomeMessage: Message = {
          id: `msg_${Date.now()}`,
          projectId: project.id,
          senderId: bestTranslator.userId,
          senderName: translator?.name || 'Translator',
          text: `Hello! I've been assigned to your translation project. I'll start working on it right away. Feel free to reach out if you have any questions!`,
          timestamp: new Date().toISOString(),
          read: false,
        };
        
        set(state => ({
          messages: [...state.messages, welcomeMessage]
        }));
        
        return true;
      },

      // Project actions
      createProject: (projectData) => {
        const project: Project = {
          ...projectData,
          id: `proj_${Date.now()}`,
          files: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          autoAssigned: false,
        };
        
        set(state => ({
          projects: [...state.projects, project]
        }));
        
        // Automatically try to assign the project
        setTimeout(() => {
          const success = get().autoAssignProject(project.id);
          if (!success) {
            // If auto-assignment fails, notify client
            get().addNotification({
              userId: project.clientId,
              type: 'status_change',
              title: 'Project Created',
              message: `Your project "${project.title}" has been created and is waiting for translator assignment.`,
              projectId: project.id,
            });
          }
        }, 1000);
        
        return project.id;
      },

      updateProject: (id, updates) => {
        const oldProject = get().projects.find(p => p.id === id);
        
        set(state => ({
          projects: state.projects.map(p =>
            p.id === id
              ? { ...p, ...updates, updatedAt: new Date().toISOString() }
              : p
          )
        }));
        
        // Handle status changes
        if (updates.status && oldProject && updates.status !== oldProject.status) {
          const project = get().projects.find(p => p.id === id);
          
          if (project?.status === 'completed' && project.translatorId) {
            // Update translator profile
            set(state => ({
              freelancerProfiles: state.freelancerProfiles.map(fp =>
                fp.userId === project.translatorId
                  ? {
                      ...fp,
                      activeProjects: Math.max(0, fp.activeProjects - 1),
                      completedProjects: fp.completedProjects + 1,
                    }
                  : fp
              )
            }));
            
            // Notify client
            get().addNotification({
              userId: project.clientId,
              type: 'project_completed',
              title: 'Project Completed!',
              message: `Your project "${project.title}" has been completed by ${project.translatorName}.`,
              projectId: project.id,
            });
          }
        }
      },

      deleteProject: (id) => {
        const project = get().projects.find(p => p.id === id);
        
        if (project?.translatorId) {
          // Update translator's active projects
          set(state => ({
            freelancerProfiles: state.freelancerProfiles.map(fp =>
              fp.userId === project.translatorId
                ? { ...fp, activeProjects: Math.max(0, fp.activeProjects - 1) }
                : fp
            )
          }));
        }
        
        set(state => ({
          projects: state.projects.filter(p => p.id !== id),
          messages: state.messages.filter(m => m.projectId !== id)
        }));
      },

      uploadFile: async (projectId, file) => {
        const reader = new FileReader();
        
        return new Promise((resolve, reject) => {
          reader.onload = () => {
            const projectFile: ProjectFile = {
              id: Date.now().toString(),
              name: file.name,
              size: file.size,
              type: file.type,
              uploadedAt: new Date().toISOString(),
              uploadedBy: get().user?.id || '',
              data: reader.result as string,
            };
            
            set(state => ({
              projects: state.projects.map(p =>
                p.id === projectId
                  ? { ...p, files: [...p.files, projectFile], updatedAt: new Date().toISOString() }
                  : p
              )
            }));
            
            resolve();
          };
          
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      },

      deleteFile: (projectId, fileId) => {
        set(state => ({
          projects: state.projects.map(p =>
            p.id === projectId
              ? { ...p, files: p.files.filter(f => f.id !== fileId), updatedAt: new Date().toISOString() }
              : p
          )
        }));
      },

      // Message actions
      sendMessage: (projectId, text) => {
        const user = get().user;
        if (!user) return;
        
        const message: Message = {
          id: Date.now().toString(),
          projectId,
          senderId: user.id,
          senderName: user.name,
          text,
          timestamp: new Date().toISOString(),
          read: false,
        };
        
        set(state => ({
          messages: [...state.messages, message]
        }));
        
        // Notify the other party
        const project = get().projects.find(p => p.id === projectId);
        if (project) {
          const recipientId = user.id === project.clientId ? project.translatorId : project.clientId;
          if (recipientId) {
            get().addNotification({
              userId: recipientId,
              type: 'message',
              title: 'New Message',
              message: `${user.name} sent you a message in "${project.title}"`,
              projectId,
            });
          }
        }
      },

      markMessageAsRead: (messageId) => {
        set(state => ({
          messages: state.messages.map(m =>
            m.id === messageId ? { ...m, read: true } : m
          )
        }));
      },

      getProjectMessages: (projectId) => {
        return get().messages.filter(m => m.projectId === projectId);
      },

      getUnreadCount: () => {
        const user = get().user;
        if (!user) return 0;
        
        return get().messages.filter(m => m.senderId !== user.id && !m.read).length;
      },
      
      // Notification actions
      addNotification: (notification) => {
        const newNotification: Notification = {
          ...notification,
          id: `notif_${Date.now()}_${Math.random()}`,
          timestamp: new Date().toISOString(),
          read: false,
        };
        
        set(state => ({
          notifications: [...state.notifications, newNotification]
        }));
      },
      
      markNotificationAsRead: (notificationId) => {
        set(state => ({
          notifications: state.notifications.map(n =>
            n.id === notificationId ? { ...n, read: true } : n
          )
        }));
      },
      
      getUnreadNotifications: () => {
        const user = get().user;
        if (!user) return [];
        
        return get().notifications.filter(n => n.userId === user.id && !n.read);
      },
      
      // Wallet actions
      depositFunds: async (amount: number, paymentMethod: string) => {
        const user = get().user;
        if (!user || amount <= 0) return false;

        const platformFee = user.type === 'client' ? amount * 0.05 : 0;
        const totalCharged = amount + platformFee;

        // Convert to smallest currency unit (paise for INR)
        const amountInSmallestUnit = Math.round(get().convertAmount(totalCharged, 'USD', 'INR') * 100);
        const commissionInSmallestUnit = Math.round(get().convertAmount(platformFee, 'USD', 'INR') * 100);

        try {
          // 1. Create Razorpay Order
          const orderResponse = await fetch('/api/razorpay/order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              amount: amountInSmallestUnit,
              currency: 'INR',
              notes: {
                user_id: user.id,
                commission: commissionInSmallestUnit,
              },
            }),
          });

          if (!orderResponse.ok) throw new Error('Failed to create Razorpay order');
          const order = await orderResponse.json();

          // 2. Open Razorpay Checkout
          const options = {
            key: RAZORPAY_CONFIG.keyId,
            amount: order.amount,
            currency: order.currency,
            name: 'Lingua Solutions India',
            description: 'Wallet Deposit',
            order_id: order.id,
            handler: async (response: any) => {
              // 3. Capture Payment and Process on Success
              const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = response;

              const captureResponse = await fetch('/api/razorpay/capture', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  payment_id: razorpay_payment_id,
                  order_id: razorpay_order_id,
                  signature: razorpay_signature,
                  amount: order.amount,
                  commission: commissionInSmallestUnit,
                }),
              });

              if (!captureResponse.ok) throw new Error('Payment capture failed');

              // 4. Update state after successful payment
              const transaction: Transaction = {
                id: `txn_${Date.now()}`,
                userId: user.id,
                type: 'deposit',
                amount,
                status: 'completed',
                description: `Deposit via ${paymentMethod}`,
                timestamp: new Date().toISOString(),
                paymentMethod,
                transactionFee: platformFee > 0 ? platformFee : undefined,
                razorpayOrderId: razorpay_order_id,
                razorpayPaymentId: razorpay_payment_id,
                commissionAmount: platformFee,
              };

              if (platformFee > 0) {
                const commissionTransaction: Transaction = {
                  id: `comm_${Date.now()}`,
                  userId: 'platform',
                  type: 'commission',
                  amount: platformFee,
                  status: 'completed',
                  description: `Platform commission from ${user.name}`,
                  timestamp: new Date().toISOString(),
                  paymentMethod: 'razorpay_auto_credit',
                  razorpayOrderId: razorpay_order_id,
                  razorpayPaymentId: razorpay_payment_id,
                };

                set(state => ({
                  user: state.user ? { ...state.user, walletBalance: state.user.walletBalance + amount } : null,
                  transactions: [...state.transactions, transaction, commissionTransaction],
                  platformCommissionBalance: state.platformCommissionBalance + platformFee,
                }));
              } else {
                 set(state => ({
                  user: state.user ? { ...state.user, walletBalance: state.user.walletBalance + amount } : null,
                  transactions: [...state.transactions, transaction],
                }));
              }
             
              get().addNotification({
                userId: user.id,
                type: 'status_change',
                title: 'Funds Deposited!',
                message: `Successfully added ${get().formatCurrency(amount)} to your wallet.`,
              });
            },
            prefill: {
              name: user.name,
              email: user.email,
            },
            notes: {
              userId: user.id,
            },
            theme: {
              color: '#4F46E5',
            },
          };
          
          const rzp = new (window as any).Razorpay(options);
          rzp.open();
          
          return true;
        } catch (error) {
          console.error('Razorpay payment failed:', error);
          get().addNotification({
            userId: user.id,
            type: 'status_change',
            title: 'Deposit Failed',
            message: 'There was an error processing your deposit. Please try again.',
          });
          return false;
        }
      },
      
      withdrawFunds: async (amount: number, paymentMethod: string) => {
        const user = get().user;
        if (!user || amount <= 0) return false;
        
        const transactionFee = amount * 0.02; // 2% fee
        const amountReceived = amount - transactionFee; // What user actually receives
        
        if (get().getWalletBalance() < amount) {
          get().addNotification({
            userId: user.id,
            type: 'status_change',
            title: 'Withdrawal Failed',
            message: 'Insufficient balance.',
          });
          return false;
        }

        // Convert to smallest currency unit for Razorpay payout
        const amountInSmallestUnit = Math.round(get().convertAmount(amountReceived, 'USD', 'INR') * 100);

        try {
           // 1. Create Razorpay Payout
          const payoutResponse = await fetch('/api/razorpay/payout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              amount: amountInSmallestUnit,
              currency: 'INR',
              method: paymentMethod,
              userId: user.id,
              // In a real app, you'd get fund_account_id from user's saved bank details
              fund_account_id: `fa_${user.id}_${paymentMethod}`, 
            }),
          });

          if (!payoutResponse.ok) throw new Error('Failed to create Razorpay payout');
          const payout = await payoutResponse.json();

          // 2. Update state after successful payout
          const transaction: Transaction = {
            id: `txn_${Date.now()}`,
            userId: user.id,
            type: 'withdrawal',
            amount,
            status: 'completed',
            description: `Withdrawal to ${paymentMethod} via Razorpay`,
            timestamp: new Date().toISOString(),
            paymentMethod,
            transactionFee,
            razorpayPaymentId: payout.id,
          };
          
          // Commission from withdrawal fee also goes to platform
          const commissionFromFee: Transaction = {
            id: `comm_fee_${Date.now()}`,
            userId: 'platform',
            type: 'commission',
            amount: transactionFee,
            status: 'completed',
            description: `Withdrawal fee commission from ${user.name}`,
            timestamp: new Date().toISOString(),
            paymentMethod: 'razorpay_auto_credit',
            razorpayPaymentId: payout.id,
          };
          
          set(state => ({
            user: state.user ? { ...state.user, walletBalance: state.user.walletBalance - amount } : null,
            transactions: [...state.transactions, transaction, commissionFromFee],
            platformCommissionBalance: state.platformCommissionBalance + transactionFee,
          }));
          
          get().addNotification({
            userId: user.id,
            type: 'status_change',
            title: 'Withdrawal Successful',
            message: `Withdrew ${get().formatCurrency(amount)}. You'll receive ${get().formatCurrency(amountReceived)}.`,
          });
          
          return true;
        } catch (error) {
          console.error('Razorpay withdrawal failed:', error);
           get().addNotification({
            userId: user.id,
            type: 'status_change',
            title: 'Withdrawal Failed',
            message: 'There was an error processing your withdrawal. Please try again.',
          });
          return false;
        }
      },
      
      processPayment: async (projectId: string, amount: number) => {
        const user = get().user;
        const project = get().projects.find(p => p.id === projectId);
        
        if (!user || !project) return false;
        
        // Client pays for project
        if (user.type === 'client') {
          if (user.walletBalance < amount) {
            get().addNotification({
              userId: user.id,
              type: 'status_change',
              title: 'Payment Failed',
              message: 'Insufficient wallet balance. Please add funds.',
            });
            return false;
          }
          
          const transaction: Transaction = {
            id: `txn_${Date.now()}`,
            userId: user.id,
            type: 'payment',
            amount,
            status: 'completed',
            description: `Payment for "${project.title}"`,
            projectId,
            timestamp: new Date().toISOString(),
          };
          
          set(state => ({
            user: state.user ? { ...state.user, walletBalance: state.user.walletBalance - amount } : null,
            transactions: [...state.transactions, transaction]
          }));
          
          // If project is completed, transfer to translator
          if (project.status === 'completed' && project.translatorId) {
            const translatorTransaction: Transaction = {
              id: `txn_${Date.now()}_earning`,
              userId: project.translatorId,
              type: 'earning',
              amount,
              status: 'completed',
              description: `Earnings from "${project.title}"`,
              projectId,
              timestamp: new Date().toISOString(),
            };
            
            set(state => ({
              transactions: [...state.transactions, translatorTransaction]
            }));
            
            get().addNotification({
              userId: project.translatorId,
              type: 'status_change',
              title: 'Payment Received',
              message: `You earned $${amount.toFixed(2)} from "${project.title}"`,
              projectId,
            });
          }
          
          return true;
        }
        
        return false;
      },
      
      getUserTransactions: () => {
        const user = get().user;
        if (!user) return [];
        
        return get().transactions
          .filter(t => t.userId === user.id)
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      },
      
      getWalletBalance: () => {
        const user = get().user;
        if (!user) return 0;

        const balance = get().getUserTransactions().reduce((acc, t) => {
            switch (t.type) {
                case 'deposit':
                case 'earning':
                    return acc + t.amount;
                case 'withdrawal':
                case 'payment':
                    return acc - t.amount;
                default:
                    return acc;
            }
        }, 0);
        return balance;
      },
      
      // Currency actions
      changeCurrency: (currencyCode: string) => {
        const user = get().user;
        if (!user) return;
        
        const oldCurrency = user.currency;
        const oldBalance = user.walletBalance;
        
        // Convert balance to new currency
        const newBalance = get().convertAmount(oldBalance, oldCurrency, currencyCode);
        
        set(state => ({
          user: state.user ? { ...state.user, currency: currencyCode, walletBalance: newBalance } : null
        }));
        
        get().addNotification({
          userId: user.id,
          type: 'status_change',
          title: 'Currency Changed',
          message: `Your currency has been changed to ${currencyCode}. Balance updated accordingly.`,
        });
      },
      
      convertAmount: (amount: number, fromCurrency: string, toCurrency: string) => {
        if (fromCurrency === toCurrency) return amount;
        
        const fromRate = CURRENCIES.find(c => c.code === fromCurrency)?.rate || 1;
        const toRate = CURRENCIES.find(c => c.code === toCurrency)?.rate || 1;
        
        // Convert to USD first, then to target currency
        const usdAmount = amount / fromRate;
        const convertedAmount = usdAmount * toRate;
        
        return Math.round(convertedAmount * 100) / 100; // Round to 2 decimal places
      },
      
      formatCurrency: (amount: number, currencyCode?: string) => {
        const user = get().user;
        const currency = CURRENCIES.find(c => c.code === (currencyCode || user?.currency || 'USD'));
        
        if (!currency) return `$${amount.toFixed(2)}`;
        
        // Format based on currency
        if (currency.code === 'JPY' || currency.code === 'KRW') {
          // No decimals for these currencies
          return `${currency.symbol}${Math.round(amount).toLocaleString()}`;
        }
        
        return `${currency.symbol}${amount.toFixed(2)}`;
      },
      
      getPlatformCommissionBalance: () => {
        return get().platformCommissionBalance;
      },
      
      getPlatformTransactions: () => {
        return get().transactions
          .filter(t => t.type === 'commission')
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      },
    }),
    {
      name: 'translatepro-storage',
    }
  )
);
''
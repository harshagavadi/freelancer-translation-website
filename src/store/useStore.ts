import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export interface Currency {
  code: string;
  symbol: string;
  name: string;
  flag: string;
  rate: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  type: 'client' | 'translator';
  avatar?: string;
  walletBalance: number;
  currency: string;
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

export interface FreelancerProfile {
  id: string;
  userId: string;
  languages: string[];
  specializations: string[];
  rating: number;
  completedProjects: number;
  activeProjects: number;
  maxConcurrentProjects: number;
  isAvailable: boolean;
  pricePerWord: number;
  responseTime: number;
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
  matchScore?: number;
}

export interface ProjectFile {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: string;
  uploadedBy: string;
  data: string;
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
  platformCommissionBalance: number;

  loadUserData: (userId: string) => Promise<void>;
  login: (email: string, password: string, type: 'client' | 'translator') => Promise<boolean>;
  register: (name: string, email: string, password: string, type: 'client' | 'translator') => Promise<boolean>;
  logout: () => void;

  changeCurrency: (currencyCode: string) => Promise<void>;
  convertAmount: (amount: number, fromCurrency: string, toCurrency: string) => number;
  formatCurrency: (amount: number, currencyCode?: string) => string;

  depositFunds: (amount: number, paymentMethod: string) => Promise<boolean>;
  withdrawFunds: (amount: number, paymentMethod: string) => Promise<boolean>;
  processPayment: (projectId: string, amount: number) => Promise<boolean>;
  getUserTransactions: () => Transaction[];
  getWalletBalance: () => number;
  getPlatformCommissionBalance: () => number;
  getPlatformTransactions: () => Transaction[];

  createProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'files' | 'autoAssigned'>) => Promise<string>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  uploadFile: (projectId: string, file: File) => Promise<void>;
  deleteFile: (projectId: string, fileId: string) => Promise<void>;

  autoAssignProject: (projectId: string) => Promise<boolean>;
  findBestTranslator: (project: Project) => FreelancerProfile | null;

  sendMessage: (projectId: string, text: string) => Promise<void>;
  markMessageAsRead: (messageId: string) => Promise<void>;
  getProjectMessages: (projectId: string) => Message[];
  getUnreadCount: () => number;

  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => Promise<void>;
  markNotificationAsRead: (notificationId: string) => Promise<void>;
  getUnreadNotifications: () => Notification[];
}

const countryCurrencyMap: Record<string, string> = {
  US: 'USD', IN: 'INR', GB: 'GBP', DE: 'EUR', FR: 'EUR', IT: 'EUR',
  ES: 'EUR', NL: 'EUR', BE: 'EUR', AT: 'EUR', PT: 'EUR', IE: 'EUR', GR: 'EUR',
  CA: 'CAD', AU: 'AUD', JP: 'JPY', CN: 'CNY', CH: 'CHF', SE: 'SEK', NZ: 'NZD',
  SG: 'SGD', HK: 'HKD', AE: 'AED', SA: 'SAR', MX: 'MXN', BR: 'BRL', ZA: 'ZAR',
  KR: 'KRW', TH: 'THB',
};

export const detectAndSetCurrency = async (): Promise<string> => {
  try {
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();

    if (data.country_code) {
      const currency = countryCurrencyMap[data.country_code] || 'USD';
      console.log(`Location detected: ${data.country_name} → ${currency}`);
      return currency;
    }
  } catch (error) {
    console.log('Could not detect location, using default USD');
  }

  return 'USD';
};

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

export const useStore = create<AppState>((set, get) => ({
  user: null,
  projects: [],
  messages: [],
  freelancerProfiles: [],
  notifications: [],
  transactions: [],
  platformCommissionBalance: 0,

  loadUserData: async (userId: string) => {
    try {
      const { data: projects } = await supabase
        .from('projects')
        .select('*')
        .or(`client_id.eq.${userId},translator_id.eq.${userId}`);

      const { data: profiles } = await supabase
        .from('freelancer_profiles')
        .select('*');

      const { data: messages } = await supabase
        .from('messages')
        .select('*')
        .in('project_id', projects?.map(p => p.id) || []);

      const { data: notifications } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId);

      const { data: transactions } = await supabase
        .from('transactions')
        .select('*')
        .or(`user_id.eq.${userId},user_id.eq.platform`);

      const { data: platformSettings } = await supabase
        .from('platform_settings')
        .select('*')
        .maybeSingle();

      const projectsWithFiles = await Promise.all(
        (projects || []).map(async (project) => {
          const { data: files } = await supabase
            .from('project_files')
            .select('*')
            .eq('project_id', project.id);

          return {
            id: project.id,
            title: project.title,
            sourceLanguage: project.source_language,
            targetLanguage: project.target_language,
            status: project.status,
            wordCount: project.word_count,
            deadline: project.deadline,
            price: project.price,
            clientId: project.client_id,
            translatorId: project.translator_id,
            translatorName: project.translator_name,
            description: project.description,
            autoAssigned: project.auto_assigned,
            matchScore: project.match_score,
            assignedAt: project.assigned_at,
            createdAt: project.created_at,
            updatedAt: project.updated_at,
            files: (files || []).map(f => ({
              id: f.id,
              name: f.name,
              size: f.size,
              type: f.type,
              uploadedAt: f.uploaded_at,
              uploadedBy: f.uploaded_by,
              data: f.data,
            })),
          };
        })
      );

      set({
        projects: projectsWithFiles,
        freelancerProfiles: (profiles || []).map(p => ({
          id: p.id,
          userId: p.user_id,
          languages: p.languages,
          specializations: p.specializations,
          rating: p.rating,
          completedProjects: p.completed_projects,
          activeProjects: p.active_projects,
          maxConcurrentProjects: p.max_concurrent_projects,
          isAvailable: p.is_available,
          pricePerWord: p.price_per_word,
          responseTime: p.response_time,
        })),
        messages: (messages || []).map(m => ({
          id: m.id,
          projectId: m.project_id,
          senderId: m.sender_id,
          senderName: m.sender_name,
          text: m.text,
          timestamp: m.timestamp,
          read: m.read,
        })),
        notifications: (notifications || []).map(n => ({
          id: n.id,
          userId: n.user_id,
          type: n.type,
          title: n.title,
          message: n.message,
          projectId: n.project_id,
          read: n.read,
          timestamp: n.timestamp,
        })),
        transactions: (transactions || []).map(t => ({
          id: t.id,
          userId: t.user_id,
          type: t.type,
          amount: t.amount,
          status: t.status,
          description: t.description,
          projectId: t.project_id,
          timestamp: t.timestamp,
          paymentMethod: t.payment_method,
          transactionFee: t.transaction_fee,
          razorpayOrderId: t.razorpay_order_id,
          razorpayPaymentId: t.razorpay_payment_id,
          commissionAmount: t.commission_amount,
        })),
        platformCommissionBalance: platformSettings?.commission_balance || 0,
      });
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  },

  login: async (email: string, password: string, type: 'client' | 'translator') => {
    try {
      const { data: user } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('type', type)
        .maybeSingle();

      if (user) {
        const detectedCurrency = await detectAndSetCurrency();

        if (user.currency !== detectedCurrency) {
          await supabase
            .from('users')
            .update({ currency: detectedCurrency })
            .eq('id', user.id);
        }

        set({
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            type: user.type,
            avatar: user.avatar,
            walletBalance: user.wallet_balance,
            currency: detectedCurrency,
          },
        });

        await get().loadUserData(user.id);

        setTimeout(() => {
          get().addNotification({
            userId: user.id,
            type: 'status_change',
            title: 'Currency Auto-Detected',
            message: `Your currency has been set to ${detectedCurrency} based on your location.`,
          });
        }, 1000);

        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  },

  register: async (name: string, email: string, password: string, type: 'client' | 'translator') => {
    try {
      const detectedCurrency = await detectAndSetCurrency();

      const { data: newUser, error } = await supabase
        .from('users')
        .insert({
          name,
          email,
          type,
          wallet_balance: 0,
          currency: detectedCurrency,
        })
        .select()
        .single();

      if (error) throw error;

      if (type === 'translator') {
        await supabase
          .from('freelancer_profiles')
          .insert({
            user_id: newUser.id,
            languages: ['English', 'Spanish'],
            specializations: ['general'],
            rating: 5.0,
            completed_projects: 0,
            active_projects: 0,
            max_concurrent_projects: 3,
            is_available: true,
            price_per_word: 0.10,
            response_time: 4,
          });
      }

      set({
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          type: newUser.type,
          avatar: newUser.avatar,
          walletBalance: newUser.wallet_balance,
          currency: newUser.currency,
        },
      });

      await get().loadUserData(newUser.id);

      setTimeout(() => {
        get().addNotification({
          userId: newUser.id,
          type: 'status_change',
          title: 'Welcome to Lingua Solutions India',
          message: `Your account has been created. Currency set to ${detectedCurrency}.`,
        });
      }, 1000);

      return true;
    } catch (error) {
      console.error('Registration error:', error);
      return false;
    }
  },

  logout: () => {
    set({
      user: null,
      projects: [],
      messages: [],
      notifications: [],
      transactions: [],
    });
  },

  findBestTranslator: (project: Project) => {
    const profiles = get().freelancerProfiles;

    const eligibleTranslators = profiles.filter(profile => {
      const canHandleLanguages =
        profile.languages.includes(project.sourceLanguage) &&
        profile.languages.includes(project.targetLanguage);

      const hasCapacity =
        profile.isAvailable &&
        profile.activeProjects < profile.maxConcurrentProjects;

      return canHandleLanguages && hasCapacity;
    });

    if (eligibleTranslators.length === 0) {
      return null;
    }

    const scoredTranslators = eligibleTranslators.map(profile => {
      let score = 0;

      score += (profile.rating / 5) * 40;

      const experienceScore = Math.min(profile.completedProjects / 200, 1);
      score += experienceScore * 30;

      const availabilityScore = 1 - (profile.activeProjects / profile.maxConcurrentProjects);
      score += availabilityScore * 20;

      const responseScore = 1 - Math.min(profile.responseTime / 24, 1);
      score += responseScore * 10;

      return { profile, score };
    });

    scoredTranslators.sort((a, b) => b.score - a.score);
    return scoredTranslators[0].profile;
  },

  autoAssignProject: async (projectId: string) => {
    const state = get();
    const project = state.projects.find(p => p.id === projectId);

    if (!project || project.translatorId) {
      return false;
    }

    const bestTranslator = state.findBestTranslator(project);

    if (!bestTranslator) {
      console.log('No available translator found');
      return false;
    }

    const { data: translator } = await supabase
      .from('users')
      .select('*')
      .eq('id', bestTranslator.userId)
      .single();

    await supabase
      .from('projects')
      .update({
        translator_id: bestTranslator.userId,
        translator_name: translator.name,
        status: 'assigned',
        assigned_at: new Date().toISOString(),
        auto_assigned: true,
      })
      .eq('id', projectId);

    await supabase
      .from('freelancer_profiles')
      .update({
        active_projects: bestTranslator.activeProjects + 1,
      })
      .eq('id', bestTranslator.id);

    set(state => ({
      projects: state.projects.map(p =>
        p.id === projectId
          ? {
              ...p,
              translatorId: bestTranslator.userId,
              translatorName: translator.name,
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
      ),
    }));

    await state.addNotification({
      userId: project.clientId,
      type: 'project_assigned',
      title: 'Project Assigned',
      message: `Your project "${project.title}" has been assigned to ${translator.name}.`,
      projectId: project.id,
    });

    await state.addNotification({
      userId: bestTranslator.userId,
      type: 'project_assigned',
      title: 'New Project Assigned',
      message: `You have been assigned to project "${project.title}".`,
      projectId: project.id,
    });

    await state.sendMessage(
      project.id,
      `Hello! I've been assigned to your translation project. I'll start working on it right away.`
    );

    return true;
  },

  createProject: async (projectData) => {
    const user = get().user;
    if (!user) throw new Error('User not authenticated');

    const { data: project, error } = await supabase
      .from('projects')
      .insert({
        title: projectData.title,
        source_language: projectData.sourceLanguage,
        target_language: projectData.targetLanguage,
        status: projectData.status,
        word_count: projectData.wordCount,
        deadline: projectData.deadline,
        price: projectData.price,
        client_id: projectData.clientId,
        description: projectData.description || '',
      })
      .select()
      .single();

    if (error) throw error;

    const newProject: Project = {
      id: project.id,
      title: project.title,
      sourceLanguage: project.source_language,
      targetLanguage: project.target_language,
      status: project.status,
      wordCount: project.word_count,
      deadline: project.deadline,
      price: project.price,
      clientId: project.client_id,
      translatorId: project.translator_id,
      translatorName: project.translator_name,
      description: project.description,
      autoAssigned: project.auto_assigned,
      matchScore: project.match_score,
      assignedAt: project.assigned_at,
      createdAt: project.created_at,
      updatedAt: project.updated_at,
      files: [],
    };

    set(state => ({
      projects: [...state.projects, newProject],
    }));

    setTimeout(() => {
      get().autoAssignProject(project.id);
    }, 1000);

    return project.id;
  },

  updateProject: async (id, updates) => {
    const dbUpdates: any = {};

    if (updates.title) dbUpdates.title = updates.title;
    if (updates.status) dbUpdates.status = updates.status;
    if (updates.translatorId) dbUpdates.translator_id = updates.translatorId;
    if (updates.translatorName) dbUpdates.translator_name = updates.translatorName;

    await supabase
      .from('projects')
      .update(dbUpdates)
      .eq('id', id);

    const oldProject = get().projects.find(p => p.id === id);

    set(state => ({
      projects: state.projects.map(p =>
        p.id === id
          ? { ...p, ...updates, updatedAt: new Date().toISOString() }
          : p
      ),
    }));

    if (updates.status && oldProject && updates.status !== oldProject.status) {
      const project = get().projects.find(p => p.id === id);

      if (project?.status === 'completed' && project.translatorId) {
        await supabase
          .from('freelancer_profiles')
          .update({
            active_projects: Math.max(0, get().freelancerProfiles.find(fp => fp.userId === project.translatorId)!.activeProjects - 1),
            completed_projects: get().freelancerProfiles.find(fp => fp.userId === project.translatorId)!.completedProjects + 1,
          })
          .eq('user_id', project.translatorId);

        await get().addNotification({
          userId: project.clientId,
          type: 'project_completed',
          title: 'Project Completed',
          message: `Your project "${project.title}" has been completed.`,
          projectId: project.id,
        });
      }
    }
  },

  deleteProject: async (id) => {
    const project = get().projects.find(p => p.id === id);

    if (project?.translatorId) {
      await supabase
        .from('freelancer_profiles')
        .update({
          active_projects: Math.max(0, get().freelancerProfiles.find(fp => fp.userId === project.translatorId)!.activeProjects - 1),
        })
        .eq('user_id', project.translatorId);
    }

    await supabase
      .from('projects')
      .delete()
      .eq('id', id);

    set(state => ({
      projects: state.projects.filter(p => p.id !== id),
      messages: state.messages.filter(m => m.projectId !== id),
    }));
  },

  uploadFile: async (projectId, file) => {
    const user = get().user;
    if (!user) throw new Error('User not authenticated');

    const reader = new FileReader();

    return new Promise((resolve, reject) => {
      reader.onload = async () => {
        const { data: projectFile, error } = await supabase
          .from('project_files')
          .insert({
            project_id: projectId,
            name: file.name,
            size: file.size,
            type: file.type,
            data: reader.result as string,
            uploaded_by: user.id,
          })
          .select()
          .single();

        if (error) {
          reject(error);
          return;
        }

        set(state => ({
          projects: state.projects.map(p =>
            p.id === projectId
              ? {
                  ...p,
                  files: [
                    ...p.files,
                    {
                      id: projectFile.id,
                      name: projectFile.name,
                      size: projectFile.size,
                      type: projectFile.type,
                      uploadedAt: projectFile.uploaded_at,
                      uploadedBy: projectFile.uploaded_by,
                      data: projectFile.data,
                    },
                  ],
                }
              : p
          ),
        }));

        resolve();
      };

      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },

  deleteFile: async (projectId, fileId) => {
    await supabase
      .from('project_files')
      .delete()
      .eq('id', fileId);

    set(state => ({
      projects: state.projects.map(p =>
        p.id === projectId
          ? { ...p, files: p.files.filter(f => f.id !== fileId) }
          : p
      ),
    }));
  },

  sendMessage: async (projectId, text) => {
    const user = get().user;
    if (!user) return;

    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        project_id: projectId,
        sender_id: user.id,
        sender_name: user.name,
        text,
      })
      .select()
      .single();

    if (error) throw error;

    set(state => ({
      messages: [
        ...state.messages,
        {
          id: message.id,
          projectId: message.project_id,
          senderId: message.sender_id,
          senderName: message.sender_name,
          text: message.text,
          timestamp: message.timestamp,
          read: message.read,
        },
      ],
    }));

    const project = get().projects.find(p => p.id === projectId);
    if (project) {
      const recipientId = user.id === project.clientId ? project.translatorId : project.clientId;
      if (recipientId) {
        await get().addNotification({
          userId: recipientId,
          type: 'message',
          title: 'New Message',
          message: `${user.name} sent you a message in "${project.title}"`,
          projectId,
        });
      }
    }
  },

  markMessageAsRead: async (messageId) => {
    await supabase
      .from('messages')
      .update({ read: true })
      .eq('id', messageId);

    set(state => ({
      messages: state.messages.map(m =>
        m.id === messageId ? { ...m, read: true } : m
      ),
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

  addNotification: async (notification) => {
    const { data: newNotification, error } = await supabase
      .from('notifications')
      .insert({
        user_id: notification.userId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        project_id: notification.projectId,
      })
      .select()
      .single();

    if (error) throw error;

    set(state => ({
      notifications: [
        ...state.notifications,
        {
          id: newNotification.id,
          userId: newNotification.user_id,
          type: newNotification.type,
          title: newNotification.title,
          message: newNotification.message,
          projectId: newNotification.project_id,
          read: newNotification.read,
          timestamp: newNotification.timestamp,
        },
      ],
    }));
  },

  markNotificationAsRead: async (notificationId) => {
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);

    set(state => ({
      notifications: state.notifications.map(n =>
        n.id === notificationId ? { ...n, read: true } : n
      ),
    }));
  },

  getUnreadNotifications: () => {
    const user = get().user;
    if (!user) return [];

    return get().notifications.filter(n => n.userId === user.id && !n.read);
  },

  depositFunds: async (amount: number, paymentMethod: string) => {
    const user = get().user;
    if (!user || amount <= 0) return false;

    const platformFee = user.type === 'client' ? amount * 0.05 : 0;
    const totalCharged = amount + platformFee;

    const amountInSmallestUnit = Math.round(get().convertAmount(totalCharged, 'USD', 'INR') * 100);
    const commissionInSmallestUnit = Math.round(get().convertAmount(platformFee, 'USD', 'INR') * 100);

    try {
      const options = {
        key: RAZORPAY_CONFIG.keyId,
        amount: amountInSmallestUnit,
        currency: 'INR',
        name: 'Lingua Solutions India',
        description: 'Wallet Deposit',
        handler: async (response: any) => {
          const { data: transaction } = await supabase
            .from('transactions')
            .insert({
              user_id: user.id,
              type: 'deposit',
              amount,
              status: 'completed',
              description: `Deposit via ${paymentMethod}`,
              payment_method: paymentMethod,
              transaction_fee: platformFee > 0 ? platformFee : null,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              commission_amount: platformFee,
            })
            .select()
            .single();

          if (platformFee > 0) {
            await supabase
              .from('transactions')
              .insert({
                user_id: 'platform',
                type: 'commission',
                amount: platformFee,
                status: 'completed',
                description: `Platform commission from ${user.name}`,
                payment_method: 'razorpay_auto_credit',
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
              });

            const { data: settings } = await supabase
              .from('platform_settings')
              .select('*')
              .maybeSingle();

            await supabase
              .from('platform_settings')
              .update({
                commission_balance: (settings?.commission_balance || 0) + platformFee,
              })
              .eq('id', settings!.id);
          }

          await supabase
            .from('users')
            .update({
              wallet_balance: user.walletBalance + amount,
            })
            .eq('id', user.id);

          set(state => ({
            user: state.user ? { ...state.user, walletBalance: state.user.walletBalance + amount } : null,
          }));

          await get().loadUserData(user.id);

          await get().addNotification({
            userId: user.id,
            type: 'status_change',
            title: 'Funds Deposited',
            message: `Successfully added ${get().formatCurrency(amount)} to your wallet.`,
          });
        },
        prefill: {
          name: user.name,
          email: user.email,
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
      return false;
    }
  },

  withdrawFunds: async (amount: number, paymentMethod: string) => {
    const user = get().user;
    if (!user || amount <= 0) return false;

    const transactionFee = amount * 0.02;
    const amountReceived = amount - transactionFee;

    if (get().getWalletBalance() < amount) {
      await get().addNotification({
        userId: user.id,
        type: 'status_change',
        title: 'Withdrawal Failed',
        message: 'Insufficient balance.',
      });
      return false;
    }

    try {
      await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          type: 'withdrawal',
          amount,
          status: 'completed',
          description: `Withdrawal to ${paymentMethod}`,
          payment_method: paymentMethod,
          transaction_fee: transactionFee,
        });

      await supabase
        .from('transactions')
        .insert({
          user_id: 'platform',
          type: 'commission',
          amount: transactionFee,
          status: 'completed',
          description: `Withdrawal fee from ${user.name}`,
          payment_method: 'razorpay_auto_credit',
        });

      const { data: settings } = await supabase
        .from('platform_settings')
        .select('*')
        .maybeSingle();

      await supabase
        .from('platform_settings')
        .update({
          commission_balance: (settings?.commission_balance || 0) + transactionFee,
        })
        .eq('id', settings!.id);

      await supabase
        .from('users')
        .update({
          wallet_balance: user.walletBalance - amount,
        })
        .eq('id', user.id);

      set(state => ({
        user: state.user ? { ...state.user, walletBalance: state.user.walletBalance - amount } : null,
      }));

      await get().loadUserData(user.id);

      await get().addNotification({
        userId: user.id,
        type: 'status_change',
        title: 'Withdrawal Successful',
        message: `Withdrew ${get().formatCurrency(amount)}. You'll receive ${get().formatCurrency(amountReceived)}.`,
      });

      return true;
    } catch (error) {
      console.error('Withdrawal failed:', error);
      return false;
    }
  },

  processPayment: async (projectId: string, amount: number) => {
    const user = get().user;
    const project = get().projects.find(p => p.id === projectId);

    if (!user || !project) return false;

    if (user.type === 'client') {
      if (user.walletBalance < amount) {
        await get().addNotification({
          userId: user.id,
          type: 'status_change',
          title: 'Payment Failed',
          message: 'Insufficient wallet balance.',
        });
        return false;
      }

      await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          type: 'payment',
          amount,
          status: 'completed',
          description: `Payment for "${project.title}"`,
          project_id: projectId,
        });

      await supabase
        .from('users')
        .update({
          wallet_balance: user.walletBalance - amount,
        })
        .eq('id', user.id);

      set(state => ({
        user: state.user ? { ...state.user, walletBalance: state.user.walletBalance - amount } : null,
      }));

      if (project.status === 'completed' && project.translatorId) {
        await supabase
          .from('transactions')
          .insert({
            user_id: project.translatorId,
            type: 'earning',
            amount,
            status: 'completed',
            description: `Earnings from "${project.title}"`,
            project_id: projectId,
          });

        const { data: translator } = await supabase
          .from('users')
          .select('*')
          .eq('id', project.translatorId)
          .single();

        await supabase
          .from('users')
          .update({
            wallet_balance: translator.wallet_balance + amount,
          })
          .eq('id', project.translatorId);

        await get().addNotification({
          userId: project.translatorId,
          type: 'status_change',
          title: 'Payment Received',
          message: `You earned ${get().formatCurrency(amount)} from "${project.title}"`,
          projectId,
        });
      }

      await get().loadUserData(user.id);

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
    return user.walletBalance;
  },

  changeCurrency: async (currencyCode: string) => {
    const user = get().user;
    if (!user) return;

    const oldCurrency = user.currency;
    const oldBalance = user.walletBalance;

    const newBalance = get().convertAmount(oldBalance, oldCurrency, currencyCode);

    await supabase
      .from('users')
      .update({
        currency: currencyCode,
        wallet_balance: newBalance,
      })
      .eq('id', user.id);

    set(state => ({
      user: state.user ? { ...state.user, currency: currencyCode, walletBalance: newBalance } : null,
    }));

    await get().addNotification({
      userId: user.id,
      type: 'status_change',
      title: 'Currency Changed',
      message: `Your currency has been changed to ${currencyCode}.`,
    });
  },

  convertAmount: (amount: number, fromCurrency: string, toCurrency: string) => {
    if (fromCurrency === toCurrency) return amount;

    const fromRate = CURRENCIES.find(c => c.code === fromCurrency)?.rate || 1;
    const toRate = CURRENCIES.find(c => c.code === toCurrency)?.rate || 1;

    const usdAmount = amount / fromRate;
    const convertedAmount = usdAmount * toRate;

    return Math.round(convertedAmount * 100) / 100;
  },

  formatCurrency: (amount: number, currencyCode?: string) => {
    const user = get().user;
    const currency = CURRENCIES.find(c => c.code === (currencyCode || user?.currency || 'USD'));

    if (!currency) return `$${amount.toFixed(2)}`;

    if (currency.code === 'JPY' || currency.code === 'KRW') {
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
}));

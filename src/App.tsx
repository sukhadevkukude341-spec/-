/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, FormEvent } from 'react';
import { 
  Users, 
  Calendar, 
  LayoutDashboard, 
  MessageSquare, 
  Info, 
  Menu, 
  X, 
  ChevronRight, 
  Plus, 
  Search,
  Send,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  UserPlus,
  Edit,
  Trash2,
  CheckCircle2,
  Languages,
  ClipboardList,
  FileText,
  Eye,
  Settings,
  BookOpen,
  Download,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";
import { translations, Language } from './translations';
// @ts-ignore
import html2pdf from 'html2pdf.js';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy, 
  serverTimestamp,
  setDoc,
  getDoc
} from 'firebase/firestore';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { db, auth } from './lib/firebase';

// Types
interface Member {
  id: string;
  name: string;
  role: string;
  email: string;
  status: 'active' | 'inactive';
}

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

interface FormField {
  id: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select';
  required: boolean;
  options?: string[];
}

interface FormDefinition {
  id: string;
  title: string;
  description: string;
  fields: FormField[];
  createdAt: string;
}

interface FormSubmission {
  id: string;
  formId: string;
  submittedBy: string;
  submittedAt: string;
  data: Record<string, string>;
}

export default function App() {
  const [lang, setLang] = useState<Language>('mr');
  const t = (key: keyof typeof translations['mr']) => translations[lang][key] || key;
  const [user, setUser] = useState<any>(null);

  const [activeTab, setActiveTab] = useState<'dashboard' | 'members' | 'events' | 'ai' | 'forms' | 'ebooks'>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Stats State
  const [dashboardStats, setDashboardStats] = useState({
    totalFunds: 45200,
    memberCount: 0
  });

  // Forms State
  const [forms, setForms] = useState<FormDefinition[]>([]);
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [selectedBook, setSelectedBook] = useState<any | null>(null);
  const [selectedForm, setSelectedForm] = useState<FormDefinition | null>(null);

  // Members real-time listener
  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(collection(db, 'members'), (snapshot) => {
      const membersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Member[];
      setMembers(membersData);
      setDashboardStats(prev => ({ ...prev, memberCount: membersData.length }));
    }, (error) => {
      console.error("Members Listener Error:", error);
    });
    return () => unsub();
  }, [user]);

  // Forms real-time listener
  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(query(collection(db, 'forms'), orderBy('createdAt', 'desc')), (snapshot) => {
      setForms(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as FormDefinition[]);
    }, (error) => {
      console.error("Forms Listener Error:", error);
    });
    return () => unsub();
  }, [user]);

  // Stats listener
  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db, 'settings', 'stats'), (snapshot) => {
      if (snapshot.exists()) {
        setDashboardStats(prev => ({ ...prev, totalFunds: snapshot.data().totalFunds || 45200 }));
      }
    }, (error) => {
      console.error("Stats Listener Error:", error);
    });
    return () => unsub();
  }, [user]);

  // Auth
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
      } else {
        await signInAnonymously(auth);
      }
    });
    return () => unsub();
  }, []);

  const ebooks = [
    {
      id: '1',
      title: 'शेतकऱ्याचा असूड',
      author: 'महात्मा जोतीराव फुले',
      publisher: 'सत्यशोधक समाज',
      cover: 'https://picsum.photos/seed/book1/400/600',
      description: 'शेतकऱ्यांच्या दुरवस्थेचे चित्रण आणि त्यावरील उपाय योजनांचे सविस्तर वर्णन करणारे क्रांतीकारक पुस्तक.',
      content: 'शेतकऱ्याचा असूड हा ग्रंथ महात्मा जोतीराव फुले यांनी १८८३ साली लिहिला. या ग्रंथातून त्यांनी शेतकऱ्यांचे शोषण कसे होते हे मांडले आहे...'
    },
    {
      id: '2',
      title: 'गुलामगिरी',
      author: 'महात्मा जोतीराव फुले',
      publisher: 'सत्यशोधक समाज',
      cover: 'https://picsum.photos/seed/book2/400/600',
      description: 'सनातनी आणि ब्राह्मणी मानसिकतेच्या विरोधात उभे ठाकलेले महात्मा फुले यांचे ऐतिहासिक पुस्तक.',
      content: 'गुलामगिरी या ग्रंथात फुले यांनी शूद्र आणि अतिशूद्र यांच्यावरील अन्यायाचा पाढा वाचला आहे. हा ग्रंथ त्यांनी अमेरिकेतील निग्रो गुलामगिरीच्या विरोधात लढणाऱ्यांस अर्पण केला आहे.'
    },
    {
      id: '3',
      title: 'सार्वजनिक सत्यधर्म',
      author: 'महात्मा जोतीराव फुले',
      publisher: 'सत्यशोधक समाज',
      cover: 'https://picsum.photos/seed/book3/400/600',
      description: 'माणसाने माणसाशी कसे वागावे याचे नियम सांगणारे महात्मा फुले यांचे महत्त्वाचे पुस्तक.',
      content: 'सार्वजनिक सत्यधर्म हा ग्रंथ फुले यांच्या निधनानंतर १८९१ मध्ये प्रकाशित झाला. मानवनिष्ठ धर्माची मांडणी यातून करण्यात आली आहे.'
    },
    {
      id: '4',
      title: 'सावित्रीबाई फुले समग्र वाङ्मय',
      author: 'सावित्रीबाई फुले',
      publisher: 'महाराष्ट्र शासन',
      cover: 'https://picsum.photos/seed/book4/400/600',
      description: 'सावित्रीबाई फुले यांच्या काव्य आणि पत्रांचा संग्रह.',
      content: 'सावित्रीबाई फुले यांच्या साहित्यातून त्यांचे समाजाप्रती असलेले विचार आणि त्यांची तळमळ दिसून येते.'
    }
  ];
  const [isFormBuilderOpen, setIsFormBuilderOpen] = useState(false);
  const [newForm, setNewForm] = useState<Partial<FormDefinition>>({
    title: '',
    description: '',
    fields: []
  });
  const [submissionData, setSubmissionData] = useState<Record<string, string>>({});
  
  const ROLES = [
    { label: 'President/Chairman (अध्यक्ष)', value: 'President/Chairman' },
    { label: 'Vice President (उपाध्यक्ष)', value: 'Vice President' },
    { label: 'Secretary (सचिव)', value: 'Secretary' },
    { label: 'Treasurer (खजिनदार)', value: 'Treasurer' },
    { label: 'Board of Director (संचालक मंडळ)', value: 'Board of Director' },
    { label: 'Manager (व्यवस्थापक)', value: 'Manager' },
    { label: 'Executive Committee Member (कार्यकारी समिती सदस्य)', value: 'Member/Executive Committee' },
    { label: 'Staff (कर्मचारी)', value: 'Staff' }
  ];

  const [members, setMembers] = useState<Member[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [isIdCardModalOpen, setIsIdCardModalOpen] = useState(false);
  const [selectedIdCardMember, setSelectedIdCardMember] = useState<Member | null>(null);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [memberForm, setMemberForm] = useState<Partial<Member>>({
    name: '',
    role: '',
    email: '',
    status: 'active'
  });

  const currentUser = members[0] || { id: 'admin', name: 'व्यवस्थापक', role: 'President/Chairman', email: 'admin@organization.com', status: 'active' };

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSendMessage = async () => {
    if (!userInput.trim()) return;

    const userMsg: ChatMessage = { role: 'user', text: userInput };
    setChatMessages(prev => [...prev, userMsg]);
    setUserInput('');
    setIsAiLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          { role: 'user', parts: [{ text: `You are '${t('appName')} AI'. Your role is to help run a community organization (${t('appSub')}) efficiently. Answer in ${lang} or as requested. Always be polite. Query: ${userInput}` }] }
        ],
      });

      const aiMsg: ChatMessage = { role: 'model', text: response.text || 'क्षमस्व, काहीतरी त्रुटी आली आहे.' };
      setChatMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      console.error("AI Error:", error);
      setChatMessages(prev => [...prev, { role: 'model', text: 'क्षमस्व, एआय कनेक्ट करण्यात समस्या आली आहे.' }]);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleOpenIdCard = (member: Member) => {
    setSelectedIdCardMember(member);
    setIsIdCardModalOpen(true);
  };

  const handlePrintIdCard = () => {
    window.print();
  };

  const handleOpenAddModal = () => {
    setEditingMember(null);
    setMemberForm({ name: '', role: '', email: '', status: 'active' });
    setIsMemberModalOpen(true);
  };

  const handleOpenEditModal = (member: Member) => {
    setEditingMember(member);
    setMemberForm({ ...member });
    setIsMemberModalOpen(true);
  };

  const handleDeleteMember = async (id: string) => {
    if (confirm('तुम्हालाई खात्री छ कि तुम्ही हा सदस्य हटवू इच्छिता?')) {
      try {
        await deleteDoc(doc(db, 'members', id));
      } catch (err) {
        console.error("Delete Error:", err);
      }
    }
  };

  const handleSaveMember = async (e: FormEvent) => {
    e.preventDefault();
    if (!memberForm.name || !memberForm.role || !memberForm.email) return;

    try {
      if (editingMember) {
        await updateDoc(doc(db, 'members', editingMember.id), {
          ...memberForm,
          updatedAt: serverTimestamp()
        });
      } else {
        await addDoc(collection(db, 'members'), {
          ...memberForm,
          createdAt: serverTimestamp()
        });
      }
      setIsMemberModalOpen(false);
    } catch (err) {
      console.error("Save Error:", err);
    }
  };

  const handleDownloadBook = (book: any) => {
    const element = document.createElement('div');
    element.className = 'p-12 bg-white font-sans';
    element.innerHTML = `
      <div style="border-bottom: 4px solid #2563eb; padding-bottom: 20px; margin-bottom: 40px; text-align: center;">
        <h1 style="font-size: 32px; font-weight: 900; margin-bottom: 10px; color: #0f172a;">${book.title}</h1>
        <p style="font-size: 18px; color: #2563eb; font-weight: bold; text-transform: uppercase; margin: 0;">${book.author}</p>
      </div>
      <div style="margin-bottom: 40px; padding: 20px; background-color: #f8fafc; border-radius: 20px; border: 1px solid #e2e8f0;">
        <p style="font-size: 14px; font-weight: bold; color: #64748b; text-transform: uppercase;">सावित्री-ज्योतिबा लायब्ररी</p>
        <p style="font-size: 16px; color: #475569; margin-top: 5px;">${book.description}</p>
      </div>
      <div style="font-size: 18px; line-height: 1.8; color: #334155; white-space: pre-wrap;">
        ${book.content}
      </div>
      <div style="margin-top: 60px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; color: #94a3b8; font-size: 12px;">
        © 2026 Savitri-Jyotiba Project • www.savitrijyotiba.org
      </div>
    `;

    const opt = {
      margin:       1,
      filename:     `${book.title}.pdf`,
      image:        { type: 'jpeg' as const, quality: 0.98 },
      html2canvas:  { scale: 2 },
      jsPDF:        { unit: 'in' as const, format: 'letter', orientation: 'portrait' as const }
    };

    html2pdf().set(opt).from(element).save();
  };

  const filteredMembers = members.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const navItems = [
    { id: 'dashboard', label: t('dashboard'), icon: LayoutDashboard },
    { id: 'members', label: t('members'), icon: Users },
    { id: 'ebooks', label: t('ebooks'), icon: BookOpen },
    { id: 'forms', label: t('forms'), icon: ClipboardList },
    { id: 'events', label: t('events'), icon: Calendar },
    { id: 'ai', label: t('aiAssistant'), icon: Sparkles },
  ];

  const isAdmin = currentUser.role === 'President/Chairman';

  const handleCreateFormField = () => {
    const fieldId = 'f' + Math.random().toString(36).substr(2, 5);
    setNewForm(prev => ({
      ...prev,
      fields: [...(prev.fields || []), { id: fieldId, label: '', type: 'text', required: true }]
    }));
  };

  const handleUpdateField = (fieldId: string, updates: Partial<FormField>) => {
    setNewForm(prev => ({
      ...prev,
      fields: prev.fields?.map(f => f.id === fieldId ? { ...f, ...updates } : f)
    }));
  };

  const handleRemoveField = (fieldId: string) => {
    setNewForm(prev => ({
      ...prev,
      fields: prev.fields?.filter(f => f.id !== fieldId)
    }));
  };

  const handleSaveForm = async () => {
    if (!newForm.title || !newForm.fields?.length) return;
    try {
      await addDoc(collection(db, 'forms'), {
        title: newForm.title,
        description: newForm.description || '',
        fields: newForm.fields,
        createdAt: new Date().toISOString() // Using string for simple sorting but could be serverTimestamp
      });
      setIsFormBuilderOpen(false);
      setNewForm({ title: '', description: '', fields: [] });
    } catch (err) {
      console.error("Form Save Error:", err);
    }
  };

  const handleSubmitFormEntry = async (formId: string) => {
    try {
      await addDoc(collection(db, 'submissions'), {
        formId,
        submittedBy: currentUser.name,
        submittedAt: new Date().toISOString(),
        data: submissionData
      });
      setSelectedForm(null);
      setSubmissionData({});
    } catch (err) {
      console.error("Submission Error:", err);
    }
  };

  return (
    <div className="flex h-[100dvh] bg-[#f8fafc] text-slate-800 font-sans overflow-hidden">
      {/* Sidebar - Desktop */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transition-transform duration-300 lg:relative lg:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          <div className="p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-md shrink-0">
                <span className="text-white text-xl font-bold">स</span>
              </div>
              <div>
                <h1 className="font-bold text-xl text-slate-800 tracking-tight leading-tight">{t('appName')}</h1>
                <p className="text-[10px] uppercase tracking-widest text-blue-600 font-bold opacity-80 mt-1">{t('appSub')}</p>
              </div>
            </div>

            <div className="p-4 bg-blue-600/5 rounded-3xl border border-blue-100/50">
              <p className="text-[10px] font-bold text-blue-600 tracking-tight text-center">{t('revolutionaryTitle')}</p>
            </div>
          </div>

          <nav className="flex-1 px-4 space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id as any);
                  setIsSidebarOpen(false);
                }}
                className={`
                  w-full flex items-center gap-3 px-6 py-3.5 rounded-xl text-sm font-semibold transition-all
                  ${activeTab === item.id 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600'}
                `}
              >
                <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'text-blue-600' : 'text-slate-400'}`} />
                {item.label}
              </button>
            ))}
          </nav>

          <div className="p-6">
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Info className="w-4 h-4 text-blue-600" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{t('orgNotice')}</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                {t('noticeContent')}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Header */}
        <header className="h-16 sm:h-20 bg-white border-b border-slate-200 px-4 sm:px-8 flex items-center justify-between z-10 shadow-sm print:hidden">
          <div className="flex items-center gap-3 sm:gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 lg:hidden rounded-lg hover:bg-slate-100"
            >
              <Menu className="w-5 h-5 sm:w-6 sm:h-6 text-slate-600" />
            </button>
            <h2 className="text-lg sm:text-xl font-bold text-slate-800 tracking-tight line-clamp-1">
              {navItems.find(i => i.id === activeTab)?.label}
            </h2>
          </div>
          <div className="flex items-center gap-4">
              <button 
                onClick={() => window.location.reload()}
                className="p-2.5 sm:p-3 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all border border-slate-100 shadow-sm active:scale-95"
                title={t('refreshApp')}
              >
                <RefreshCw className="w-5 h-5" />
              </button>
              <div className="relative group">
                <button className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-slate-50 px-5 py-2.5 rounded-full border border-slate-200 hover:bg-slate-100 transition-all shadow-sm">
                  <Languages className="w-4 h-4 text-blue-500" />
                  <span>{t('changeLanguage')}</span>
                  <ChevronRight className="w-3 h-3 rotate-90 text-slate-400" />
                </button>
                <div className="absolute right-0 mt-2 w-44 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[120] ring-1 ring-slate-100">
                  <div className="px-4 py-2 border-b border-slate-50 mb-1">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Select Language</p>
                  </div>
                  {[
                    { id: 'mr', label: 'मराठी' },
                    { id: 'en', label: 'English' },
                    { id: 'hi', label: 'हिन्दी' },
                    { id: 'ur', label: 'اردو' },
                    { id: 'te', label: 'తెలుగు' }
                  ].map((l) => (
                    <button
                      key={l.id}
                      onClick={() => setLang(l.id as Language)}
                      className={`w-full text-left px-4 py-3 text-xs font-bold hover:bg-blue-50 transition-colors flex items-center justify-between ${lang === l.id ? 'text-blue-600' : 'text-slate-600'}`}
                    >
                      {l.label}
                      {lang === l.id && <CheckCircle2 className="w-3.5 h-3.5 shadow-sm" />}
                    </button>
                  ))}
                </div>
              </div>

              <button 
                onClick={() => handleOpenIdCard(currentUser)}
                className="hidden sm:flex items-center gap-2 text-xs font-bold text-blue-600 bg-blue-50 px-5 py-2.5 rounded-full border border-blue-100 hover:bg-blue-100 transition-all active:scale-95 shadow-sm"
              >
                <Users className="w-4 h-4" />
                {t('myIdCard')}
              </button>
              <div className="w-10 h-10 bg-slate-100 rounded-full border border-slate-200 flex items-center justify-center overflow-hidden">
                 <img src={`https://picsum.photos/seed/${currentUser.id}/100/100`} alt="User" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
          </div>
        </header>

        {/* Dynamic Canvas */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'dashboard' && (
                <div className="space-y-6 sm:space-y-10 pb-12">
                  <div className="bg-white p-8 sm:p-12 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-blue-50 rounded-full blur-[100px] -mr-48 -mt-48 opacity-50" />
                    
                    <div className="flex flex-col gap-4 sm:gap-6 relative">
                      <span className="text-blue-600 font-bold tracking-widest uppercase text-[10px] sm:text-xs">{t('idealLeadership')}</span>
                      <h3 className="text-3xl sm:text-5xl font-extrabold text-slate-900 leading-tight tracking-tight max-w-3xl">{t('revolutionaryTitle')}</h3>
                      <p className="text-slate-600 leading-relaxed max-w-3xl text-base sm:text-xl font-medium opacity-80">
                        {t('heroQuote')} {t('heroDescription')}
                      </p>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                      { val: dashboardStats.memberCount.toLocaleString(), label: t('statsVolunteers') },
                      { val: '५०+', label: t('statsProjects') },
                      { val: '१०,०००+', label: t('statsBeneficiaries') },
                      { val: `₹ ${dashboardStats.totalFunds.toLocaleString()}`, label: 'एकूण निधी' },
                    ].map((stat, i) => (
                      <div key={i} className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm text-center group hover:border-blue-200 transition-all hover:shadow-lg">
                        <h3 className="text-4xl font-bold text-blue-600 tracking-tight">{stat.val}</h3>
                        <p className="text-slate-500 text-xs mt-2 font-bold uppercase tracking-wider">{stat.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Main Content Sections */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <section className="lg:col-span-12 xl:col-span-8 bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                      <div className="p-5 sm:p-8 border-b border-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/20">
                        <h4 className="font-bold text-lg sm:text-xl text-slate-900">{t('members')}</h4>
                        <button className="bg-white border border-slate-200 text-slate-800 font-bold text-[10px] sm:text-xs py-2 px-6 rounded-full hover:bg-slate-50 transition-all shadow-sm active:scale-95 text-center">{t('viewReport')}</button>
                      </div>
                      <div className="divide-y divide-slate-50">
                        {members.slice(0, 4).map(m => (
                          <div key={m.id} className="p-6 flex items-center gap-6 hover:bg-slate-50/50 transition-colors cursor-pointer group">
                            <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center font-bold text-slate-400 border border-slate-100 group-hover:border-blue-100 group-hover:bg-blue-50/30 transition-all">
                              {m.name[0]}
                            </div>
                            <div className="flex-1">
                              <p className="font-bold text-base text-slate-800 group-hover:text-blue-600 transition-colors">{m.name}</p>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{m.role}</p>
                            </div>
                            <div className="hidden sm:block">
                               <span className={`text-[10px] font-bold py-1.5 px-4 rounded-full border ${m.status === 'active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                                  {m.status === 'active' ? t('active') : t('inactive')}
                               </span>
                            </div>
                            <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-400 transition-all" />
                          </div>
                        ))}
                      </div>
                    </section>

                    <section className="lg:col-span-12 xl:col-span-4 flex flex-col gap-6">
                      <div className="bg-slate-900 text-white p-6 sm:p-10 rounded-[1.5rem] sm:rounded-[2rem] shadow-2xl flex flex-col justify-between min-h-[300px] sm:min-h-[340px] relative overflow-hidden group">
                         <div className="absolute top-0 right-0 w-48 h-48 bg-blue-600 rounded-full blur-[100px] opacity-20 group-hover:opacity-40 transition-opacity" />
                         <div className="z-10">
                            <span className="text-blue-400 font-bold text-[10px] uppercase tracking-widest mb-6 block">{t('aiAssistant')}</span>
                            <h4 className="font-bold text-2xl mb-4 leading-tight">{t('welcomeAi')}</h4>
                            <p className="text-slate-400 text-sm leading-relaxed mb-8 italic font-medium opacity-80">{t('aiQuote')}</p>
                         </div>
                         <button 
                            onClick={() => setActiveTab('ai')}
                            className="bg-blue-600 text-white font-bold py-4 px-8 rounded-xl shadow-lg flex items-center justify-center gap-3 hover:bg-blue-700 active:scale-95 transition-all w-full z-10"
                          >
                            <Sparkles className="w-5 h-5" />
                            {t('aiAssistant')}
                          </button>
                      </div>
                      
                      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex-1 flex flex-col justify-center gap-4 hover:border-blue-100 transition-all">
                         <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center border border-blue-100/50">
                            <TrendingUp className="text-blue-600 w-7 h-7" />
                         </div>
                         <div>
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">{t('totalFund')}</p>
                              <ArrowUpRight className="text-blue-400 w-4 h-4" />
                            </div>
                            <h3 className="text-4xl font-bold text-slate-900 tracking-tight">₹ {dashboardStats.totalFunds.toLocaleString()}</h3>
                         </div>
                      </div>
                    </section>
                  </div>
                </div>
              )}

              {activeTab === 'members' && (
                <div className="space-y-8 pb-12">
                  <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="relative w-full md:w-96">
                      <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        type="text" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={t('searchPlaceholder')} 
                        className="w-full pl-12 pr-6 py-4 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-blue-600/5 shadow-sm transition-all"
                      />
                    </div>
                    <button 
                      onClick={handleOpenAddModal}
                      className="w-full md:w-auto bg-slate-900 text-white font-bold py-4 px-10 rounded-xl shadow-xl flex items-center justify-center gap-3 hover:bg-slate-800 active:scale-95 transition-all"
                    >
                      <UserPlus className="w-5 h-5" />
                      {t('addMember')}
                    </button>
                  </div>

                  <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden overflow-x-auto ring-1 ring-slate-100">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-100">
                          <th className="px-8 py-6 text-[10px] font-bold uppercase tracking-widest text-slate-500">{t('name')}</th>
                          <th className="px-8 py-6 text-[10px] font-bold uppercase tracking-widest text-slate-500">{t('role')}</th>
                          <th className="px-8 py-6 text-[10px] font-bold uppercase tracking-widest text-slate-500">{t('email')}</th>
                          <th className="px-8 py-6 text-[10px] font-bold uppercase tracking-widest text-slate-500">{t('status')}</th>
                          <th className="px-8 py-6 text-[10px] font-bold uppercase tracking-widest text-slate-500 text-right">{t('actions')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {filteredMembers.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-8 py-12 text-center text-slate-400 font-medium">
                              {t('noMembers')}
                            </td>
                          </tr>
                        ) : (
                          filteredMembers.map(member => (
                            <tr key={member.id} className="hover:bg-slate-50/20 transition-all group cursor-pointer">
                              <td className="px-8 py-6">
                                <span className="font-bold text-slate-800 text-base group-hover:text-blue-600 transition-colors">{member.name}</span>
                              </td>
                              <td className="px-8 py-6">
                                 <span className="text-[10px] bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-slate-400 font-bold uppercase tracking-widest leading-none block w-fit shadow-sm group-hover:border-blue-200 group-hover:text-blue-500 transition-all">{member.role}</span>
                              </td>
                              <td className="px-8 py-6 text-slate-500 text-sm font-medium">
                                 {member.email}
                              </td>
                              <td className="px-8 py-6">
                                 <div className="flex items-center gap-2.5">
                                    <div className={`w-2 h-2 rounded-full ${member.status === 'active' ? 'bg-emerald-500 shadow-sm shadow-emerald-200' : 'bg-slate-300'}`} />
                                    <span className={`text-[10px] font-bold uppercase tracking-widest ${member.status === 'active' ? 'text-emerald-600' : 'text-slate-400'}`}>
                                      {member.status === 'active' ? t('active') : t('inactive')}
                                    </span>
                                 </div>
                              </td>
                              <td className="px-8 py-6 text-right">
                                 <div className="flex items-center justify-end gap-2">
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); handleOpenEditModal(member); }}
                                    className="p-2.5 text-slate-400 hover:text-blue-600 rounded-xl hover:bg-blue-50 transition-all"
                                  >
                                      <Edit className="w-5 h-5" />
                                  </button>
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); handleDeleteMember(member.id); }}
                                    className="p-2.5 text-slate-400 hover:text-red-600 rounded-xl hover:bg-red-50 transition-all"
                                  >
                                      <Trash2 className="w-5 h-5" />
                                  </button>
                                 </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'events' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-12">
                  {[
                    { title: 'वार्षिक सर्वसाधारण सभा', date: '२५ मे, २०२६', type: 'मीटिंग', location: 'संस्था कार्यालय' },
                    { title: 'कार्यशाळा: डिजिटल साक्षरता', date: '१० जून, २०२६', type: 'कार्यशाळा', location: 'ऑनलाइन' },
                    { title: 'रक्तदान शिबिर', date: '२ जुलै, २०२६', type: 'सामाजिक', location: 'शाळा मैदान' },
                  ].map((event, idx) => (
                    <div key={idx} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm group hover:border-blue-200 hover:shadow-2xl hover:shadow-blue-900/5 transition-all cursor-pointer flex flex-col min-h-[280px]">
                      <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-blue-600 group-hover:text-white transition-all text-blue-600 shadow-sm border border-blue-100/50">
                         <Calendar className="w-7 h-7" />
                      </div>
                      <h4 className="font-bold text-2xl mb-3 text-slate-900 leading-tight flex-1 tracking-tight">{event.title}</h4>
                      <div className="space-y-4 pt-6 border-t border-slate-50 mt-4">
                        <p className="text-blue-600 text-xs font-bold uppercase tracking-widest">{event.date} • {event.type}</p>
                        <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider opacity-60">
                           <Info className="w-4 h-4" />
                           <span>{event.location}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  <button className="bg-slate-50 border-2 border-dashed border-slate-200 p-8 rounded-[2.5rem] flex flex-col items-center justify-center gap-5 text-slate-400 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50/20 transition-all group min-h-[280px]">
                     <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-lg border border-slate-100 group-hover:bg-blue-600 group-hover:text-white transition-all group-hover:shadow-blue-900/10">
                        <Plus className="w-7 h-7" />
                     </div>
                     <span className="text-xs font-bold uppercase tracking-widest text-slate-500 group-hover:text-blue-600 transition-colors">कार्यक्रम जोडा</span>
                  </button>
                </div>
              )}

              {activeTab === 'ai' && (
                <div className="h-[calc(100vh-16rem)] max-w-4xl mx-auto flex flex-col bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl overflow-hidden mb-12 ring-8 ring-slate-50/50">
                   {/* Chat Header */}
                   <div className="p-8 border-b border-slate-50 flex items-center gap-5 bg-white/80 backdrop-blur-md">
                      <div className="w-14 h-14 bg-blue-600 rounded-[1.25rem] flex items-center justify-center shadow-xl shadow-blue-200">
                         <Sparkles className="text-white w-7 h-7" />
                      </div>
                      <div>
                         <h4 className="font-extrabold text-slate-900 text-lg tracking-tight">{t('aiAssistant')}</h4>
                         <div className="flex items-center gap-1.5 mt-1.5">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-sm shadow-emerald-200" />
                            <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest">Always Active</span>
                         </div>
                      </div>
                   </div>

                   {/* Messages */}
                   <div className="flex-1 overflow-y-auto p-4 sm:p-10 space-y-6 sm:space-y-10 bg-white shadow-inner">
                      {chatMessages.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-center space-y-8">
                           <div className="w-28 h-28 bg-slate-50 rounded-full flex items-center justify-center border border-slate-100 shadow-sm">
                              <MessageSquare className="w-12 h-12 text-slate-200" />
                           </div>
                           <div className="max-w-sm">
                              <h5 className="font-bold text-slate-900 mb-2 text-xl tracking-tight">{t('aiGreeting')}</h5>
                              <p className="text-base text-slate-400 leading-relaxed font-medium opacity-80">{t('aiDescription')}</p>
                           </div>
                        </div>
                      )}
                      {chatMessages.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                           <div className={`
                              max-w-[80%] px-8 py-5 rounded-[1.75rem] text-sm leading-relaxed font-bold shadow-sm transition-all
                              ${msg.role === 'user' 
                                ? 'bg-blue-600 text-white rounded-tr-none shadow-blue-900/10' 
                                : 'bg-slate-50 text-slate-700 border border-slate-100 rounded-tl-none'}
                           `}>
                              {msg.text}
                           </div>
                        </div>
                      ))}
                      {isAiLoading && (
                        <div className="flex justify-start">
                           <div className="bg-slate-50 px-6 py-4 rounded-[1.25rem] flex gap-2 border border-slate-100 shadow-sm">
                              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0s'}} />
                              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s'}} />
                              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s'}} />
                           </div>
                        </div>
                      )}
                      <div ref={chatEndRef} />
                   </div>

                   {/* Input */}
                   <div className="p-8 bg-slate-50/30 border-t border-slate-50">
                      <div className="relative max-w-3xl mx-auto">
                        <input 
                          type="text" 
                          value={userInput}
                          onChange={(e) => setUserInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                          placeholder={t('aiPlaceholder')}
                          className="w-full pl-8 pr-16 py-5 bg-white border border-slate-200 rounded-[1.5rem] text-sm font-bold text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-8 focus:ring-blue-600/5 shadow-lg shadow-slate-900/5 transition-all"
                        />
                        <button 
                          onClick={handleSendMessage}
                          disabled={!userInput.trim() || isAiLoading}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-3 bg-blue-600 text-white rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 active:scale-95 transition-all shadow-xl shadow-blue-600/20"
                        >
                          <Send className="w-5 h-5" />
                        </button>
                      </div>
                   </div>
                </div>
              )}

              {activeTab === 'forms' && (
                <div className="space-y-8 pb-12">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div>
                      <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">{isAdmin ? t('forms') : t('staffForms')}</h3>
                      <p className="text-slate-500 font-medium text-sm mt-1">{isAdmin ? 'सक्रिय फॉर्म्स आणि मॅनेजमेंट' : 'निवडलेले फॉर्म्स भरा'}</p>
                    </div>
                    {isAdmin && !isFormBuilderOpen && !selectedForm && (
                      <button 
                        onClick={() => setIsFormBuilderOpen(true)}
                        className="w-full md:w-auto bg-slate-900 text-white font-bold py-4 px-10 rounded-xl shadow-xl flex items-center justify-center gap-3 hover:bg-slate-800 transition-all hover:shadow-slate-200"
                      >
                        <Plus className="w-5 h-5" />
                        {t('createForm')}
                      </button>
                    )}
                  </div>

                  {selectedForm ? (
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden max-w-2xl mx-auto ring-8 ring-slate-50/50">
                       <div className="p-10 border-b border-slate-50 bg-slate-50/30">
                          <button onClick={() => setSelectedForm(null)} className="text-slate-400 hover:text-blue-600 transition-colors mb-4 flex items-center gap-2 font-bold text-xs uppercase tracking-widest">
                            <Plus className="w-4 h-4 rotate-45" /> {t('cancel')}
                          </button>
                          <h4 className="text-2xl font-black text-slate-900">{selectedForm.title}</h4>
                          <p className="text-slate-500 mt-2 font-medium">{selectedForm.description}</p>
                       </div>
                       <div className="p-10 space-y-8">
                          {selectedForm.fields.map(field => (
                            <div key={field.id} className="space-y-3">
                              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest px-1">{field.label} {field.required && <span className="text-rose-500">*</span>}</label>
                              <input 
                                type={field.type} 
                                required={field.required}
                                className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-600/5 transition-all text-sm font-medium"
                                onChange={(e) => setSubmissionData(prev => ({ ...prev, [field.id]: e.target.value }))}
                              />
                            </div>
                          ))}
                          <button 
                            onClick={() => handleSubmitFormEntry(selectedForm.id)}
                            className="w-full bg-blue-600 text-white font-black py-5 rounded-2xl shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95 text-lg"
                          >
                            {t('submitForm')}
                          </button>
                       </div>
                    </div>
                  ) : isFormBuilderOpen ? (
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden max-w-2xl mx-auto ring-8 ring-slate-50/50">
                      <div className="p-10 border-b border-slate-50 bg-slate-50/30">
                        <div className="flex items-center justify-between mb-8">
                           <h4 className="text-2xl font-black text-slate-900">{t('createForm')}</h4>
                           <button onClick={() => setIsFormBuilderOpen(false)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl transition-all">
                             <X className="w-6 h-6" />
                           </button>
                        </div>
                        <div className="space-y-6">
                          <div className="space-y-3">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('formTitle')}</label>
                            <input 
                              type="text" 
                              value={newForm.title}
                              onChange={(e) => setNewForm(prev => ({ ...prev, title: e.target.value }))}
                              className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold shadow-sm"
                              placeholder="e.g. Daily Progress Report"
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-10 space-y-8">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{t('formFields')}</p>
                          <button onClick={handleCreateFormField} className="text-blue-600 text-xs font-bold flex items-center gap-1.5 px-4 py-2 hover:bg-blue-50 rounded-full transition-all">
                            <Plus className="w-4 h-4" /> {t('addField')}
                          </button>
                        </div>

                        <div className="space-y-4 max-h-[300px] overflow-y-auto px-1 pr-4 custom-scrollbar">
                          {newForm.fields?.map((field) => (
                            <div key={field.id} className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex gap-4">
                              <div className="flex-1 space-y-4">
                                <input 
                                  type="text"
                                  placeholder={t('fieldLabel')}
                                  value={field.label}
                                  onChange={(e) => handleUpdateField(field.id, { label: e.target.value })}
                                  className="w-full px-4 py-2 text-xs font-bold bg-transparent border-b border-slate-200 focus:border-blue-600 focus:outline-none transition-colors"
                                />
                                <select 
                                  value={field.type}
                                  onChange={(e) => handleUpdateField(field.id, { type: e.target.value as any })}
                                  className="text-[10px] font-bold bg-white border border-slate-100 rounded-lg px-3 py-1.5 focus:outline-none shadow-sm"
                                >
                                  <option value="text">{t('text')}</option>
                                  <option value="number">{t('number')}</option>
                                  <option value="date">{t('date')}</option>
                                </select>
                              </div>
                              <button onClick={() => handleRemoveField(field.id)} className="p-2 text-slate-300 hover:text-rose-500 self-center">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="p-10 bg-slate-50/50 border-t border-slate-50">
                        <button 
                          onClick={handleSaveForm}
                          disabled={!newForm.title || !newForm.fields?.length}
                          className="w-full bg-slate-900 text-white font-black py-5 rounded-[1.5rem] shadow-xl hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                          {t('saveForm')}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {forms.map(form => (
                        <div key={form.id} className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:border-blue-100 transition-all group flex flex-col justify-between">
                           <div>
                              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 border border-blue-100/50 shadow-sm group-hover:bg-blue-600 transition-all group-hover:shadow-blue-200 group-hover:shadow-lg">
                                 <FileText className="w-6 h-6 text-blue-600 group-hover:text-white transition-colors" />
                              </div>
                              <h5 className="font-extrabold text-xl text-slate-900 mb-2 leading-tight group-hover:text-blue-600 transition-colors">{form.title}</h5>
                              <p className="text-slate-400 text-sm font-medium line-clamp-2">{form.description}</p>
                           </div>
                           <div className="mt-8 flex items-center justify-between">
                              <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{form.fields.length} {t('formFields')}</span>
                              <button 
                                onClick={() => setSelectedForm(form)}
                                className="bg-slate-50 text-slate-800 text-xs font-black py-3 px-6 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                              >
                                {isAdmin ? t('submissions') : t('submitForm')}
                              </button>
                           </div>
                        </div>
                      ))}
                      
                      {isAdmin && (
                        <button 
                          onClick={() => setIsFormBuilderOpen(true)}
                          className="bg-slate-50 border-2 border-dashed border-slate-200 p-8 rounded-[2rem] flex flex-col items-center justify-center gap-4 text-slate-300 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50/20 transition-all group min-h-[220px]"
                        >
                          <Plus className="w-6 h-6" />
                          <span className="text-xs font-bold uppercase tracking-widest">{t('createForm')}</span>
                        </button>
                      )}
                    </div>
                  )}

                  {isAdmin && submissions.length > 0 && !selectedForm && !isFormBuilderOpen && (
                    <div className="mt-12 space-y-6">
                       <div className="flex items-center gap-3 mb-6">
                         <Eye className="w-5 h-5 text-blue-600" />
                         <h4 className="text-xl font-bold text-slate-900 uppercase tracking-tight">{t('submissions')}</h4>
                       </div>
                       <div className="grid grid-cols-1 gap-4">
                          {submissions.map(sub => (
                            <div key={sub.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                              <div>
                                <p className="font-bold text-slate-800">{forms.find(f => f.id === sub.formId)?.title}</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Submitted by: <span className="text-blue-600">{sub.submittedBy}</span> • {new Date(sub.submittedAt).toLocaleString()}</p>
                              </div>
                              <button className="p-2 text-slate-400 hover:bg-slate-50 rounded-lg transition-all">
                                <ChevronRight className="w-5 h-5" />
                              </button>
                            </div>
                          ))}
                       </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'ebooks' && (
                <div className="space-y-8 pb-12">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div>
                      <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">{t('ebooks')}</h3>
                      <p className="text-slate-500 font-medium text-sm mt-1">शिका, संघटित व्हा आणि संघर्ष करा - महात्मा फुले यांचे विचार</p>
                    </div>
                  </div>

                  {selectedBook ? (
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden max-w-4xl mx-auto ring-8 ring-slate-50/50 min-h-[60vh] flex flex-col">
                      <div className="p-8 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between">
                        <button 
                          onClick={() => setSelectedBook(null)} 
                          className="text-slate-500 hover:text-blue-600 transition-colors flex items-center gap-2 font-bold text-xs uppercase tracking-widest"
                        >
                          <ChevronRight className="w-4 h-4 rotate-180" /> {t('backToLibrary')}
                        </button>
                        <h4 className="text-xl font-bold text-slate-900">{selectedBook.title}</h4>
                        <button 
                          onClick={() => handleDownloadBook(selectedBook)}
                          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-700 transition-all shadow-md"
                        >
                          <Download className="w-4 h-4" /> {t('downloadBook')}
                        </button>
                      </div>
                      <div className="flex-1 overflow-y-auto p-10 bg-white">
                        <div className="max-w-prose mx-auto prose prose-slate">
                          <h1 className="text-3xl font-black mb-8 text-slate-900">{selectedBook.title}</h1>
                          <div className="mb-12 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-2">{t('bookAuthor')}</p>
                            <p className="text-lg font-bold text-slate-900">{selectedBook.author}</p>
                            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-4 mb-2">{t('bookPublisher')}</p>
                            <p className="text-slate-700">{selectedBook.publisher}</p>
                          </div>
                          <div className="text-slate-700 leading-loose text-lg whitespace-pre-wrap font-medium">
                            {selectedBook.content}
                            
                            {/* Larger placeholder text to simulate a book */}
                            <p className="mt-8 text-slate-400 italic">
                              [हे पुस्तक मोफत वाचनासाठी उपलब्ध आहे. पूर्ण पुस्तक वाचण्यासाठी कृपया संस्थेच्या ग्रंथालयाशी संपर्क साधावा किंवा अधिकृत पीडीएफ आवृत्ती डाउनलोड करावी.]
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {ebooks.map(book => (
                        <div key={book.id} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:border-blue-100 transition-all group overflow-hidden flex flex-col">
                          <div className="h-64 overflow-hidden relative">
                            <img 
                              src={book.cover} 
                              alt={book.title} 
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent flex items-end p-6">
                              <span className="bg-blue-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">Free</span>
                            </div>
                          </div>
                          <div className="p-8 flex flex-col flex-1">
                            <h5 className="font-extrabold text-xl text-slate-900 mb-2 leading-tight group-hover:text-blue-600 transition-colors">{book.title}</h5>
                            <p className="text-blue-600 text-xs font-bold uppercase tracking-widest mb-4">{book.author}</p>
                            <p className="text-slate-500 text-sm font-medium line-clamp-3 mb-6 flex-1">
                              {book.description}
                            </p>
                            <div className="flex gap-3">
                              <button 
                                onClick={() => setSelectedBook(book)}
                                className="flex-1 bg-slate-50 text-slate-800 text-xs font-bold py-4 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm flex items-center justify-center gap-2"
                              >
                                <BookOpen className="w-4 h-4" />
                                {t('readNow')}
                              </button>
                              <button 
                                onClick={() => handleDownloadBook(book)}
                                title={t('downloadBook')}
                                className="p-4 bg-slate-50 text-slate-500 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-all shadow-sm flex items-center justify-center"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* ID Card Modal */}
      <AnimatePresence>
        {isIdCardModalOpen && selectedIdCardMember && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsIdCardModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              className="relative w-full max-w-sm flex flex-col gap-4 sm:gap-8 print:p-0"
            >
              {/* Actual ID Card */}
              <div id="id-card" className="bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-slate-100 flex flex-col items-center text-center relative portrait-card">
                 {/* Top Branding Section */}
                 <div className="w-full bg-blue-600 p-8 text-white relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10" />
                    <div className="flex flex-col items-center gap-2 relative z-10">
                       <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-blue-600 font-bold text-xl shadow-lg">स</div>
                       <h5 className="font-bold text-md tracking-tight">{t('appName')}</h5>
                       <p className="text-[8px] uppercase tracking-[0.1em] font-bold opacity-80">{t('appSub')}</p>
                    </div>
                 </div>

                 {/* Member Details Section */}
                 <div className="p-8 w-full flex flex-col items-center gap-6">
                    <div className="w-32 h-32 bg-slate-50 rounded-[2rem] border-4 border-white shadow-xl -mt-24 relative z-20 overflow-hidden ring-1 ring-slate-100">
                       <img src={`https://picsum.photos/seed/${selectedIdCardMember.id}/200/200`} alt="Photo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>

                    <div className="space-y-1">
                       <h6 className="font-extrabold text-2xl text-slate-900 tracking-tight">{selectedIdCardMember.name}</h6>
                       <p className="text-blue-600 text-xs font-bold uppercase tracking-widest">{selectedIdCardMember.role}</p>
                    </div>

                    <div className="w-full h-px bg-slate-100 my-2" />

                    <div className="grid grid-cols-2 w-full gap-4 text-left">
                       <div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{t('email')}</p>
                          <p className="text-[10px] font-bold text-slate-700 truncate">{selectedIdCardMember.email}</p>
                       </div>
                       <div className="text-right">
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">आयडी</p>
                          <p className="text-[10px] font-bold text-slate-700 uppercase">SAN-{selectedIdCardMember.id.toUpperCase()}</p>
                       </div>
                    </div>

                    <div className="w-24 h-24 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center p-3 mt-2">
                       <div className="w-full h-full border-2 border-slate-200 border-dashed rounded-lg opacity-40 flex flex-col items-center justify-center gap-1">
                          <div className="w-8 h-8 opacity-20"><Info className="w-full h-full" /></div>
                          <span className="text-[8px] font-bold uppercase">QR VALID</span>
                       </div>
                    </div>

                    <div className="flex flex-col items-center gap-1.5 opacity-60">
                       <p className="text-[8px] font-bold uppercase tracking-widest text-slate-400">अध्यक्षांची स्वाक्षरी</p>
                       <div className="h-0.5 w-16 bg-slate-200" />
                    </div>
                 </div>
                 
                 {/* Footer Line */}
                 <div className="w-full bg-slate-50 py-3 text-[8px] font-bold text-slate-400 uppercase tracking-widest border-t border-slate-100">
                    www.savitrijyotiba.org • 2026-27
                 </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 px-4 sm:px-0 print:hidden">
                 <button 
                  onClick={() => setIsIdCardModalOpen(false)}
                  className="flex-1 py-4 px-8 bg-white/10 backdrop-blur-md text-white font-bold rounded-2xl border border-white/20 transition-all hover:bg-white/20 active:scale-95 text-sm"
                 >
                    {t('cancel')}
                 </button>
                 <button 
                  onClick={handlePrintIdCard}
                  className="flex-1 py-4 px-8 bg-blue-600 text-white font-bold rounded-2xl shadow-xl shadow-blue-500/20 transition-all hover:bg-blue-700 active:scale-95 text-sm flex items-center justify-center gap-2"
                 >
                    <Plus className="w-4 h-4 rotate-45" />
                    {t('download')}
                 </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Member Add/Edit Modal */}
      <AnimatePresence>
        {isMemberModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMemberModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90dvh]"
            >
               <div className="p-6 sm:p-10 overflow-y-auto">
                <div className="flex items-center justify-between mb-10">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200 text-white">
                      <UserPlus className="w-7 h-7" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-2xl text-slate-900 tracking-tight">
                        {editingMember ? t('editMember') : t('addMember')}
                      </h4>
                      <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mt-1">
                        Member Registration
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsMemberModalOpen(false)}
                    className="p-3 text-slate-400 hover:text-slate-600 rounded-2xl hover:bg-slate-50 transition-all"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleSaveMember} className="space-y-8">
                  <div className="space-y-6">
                    <div className="group">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-1">पूर्ण नाव</label>
                      <input 
                        type="text" 
                        required
                        value={memberForm.name}
                        onChange={(e) => setMemberForm({ ...memberForm, name: e.target.value })}
                        placeholder="उदा. महेश पाटील"
                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-blue-600/5 focus:bg-white focus:border-blue-200 transition-all shadow-sm"
                      />
                    </div>
                    
                    <div className="group">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-1">{t('positionLabel')} (Position)</label>
                      <select 
                        required
                        value={memberForm.role}
                        onChange={(e) => setMemberForm({ ...memberForm, role: e.target.value })}
                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-600/5 focus:bg-white focus:border-blue-200 transition-all shadow-sm appearance-none cursor-pointer"
                      >
                        <option value="" disabled>पद निवडा...</option>
                        {ROLES.map((role) => (
                          <option key={role.value} value={role.value}>
                            {role.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="group">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-1">{t('emailLabel')}</label>
                      <input 
                        type="email" 
                        required
                        value={memberForm.email}
                        onChange={(e) => setMemberForm({ ...memberForm, email: e.target.value })}
                        placeholder="उदा. example@mail.com"
                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-blue-600/5 focus:bg-white focus:border-blue-200 transition-all shadow-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 px-1">{t('statusLabel')}</label>
                      <div className="flex gap-4">
                        {['active', 'inactive'].map((status) => (
                          <button
                            key={status}
                            type="button"
                            onClick={() => setMemberForm({ ...memberForm, status: status as any })}
                            className={`
                              flex-1 py-4 px-6 rounded-2xl border text-sm font-bold transition-all flex items-center justify-center gap-2
                              ${memberForm.status === status 
                                ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200' 
                                : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'}
                            `}
                          >
                            {status === 'active' && <CheckCircle2 className={`w-4 h-4 ${memberForm.status === status ? 'text-white' : 'text-slate-200'}`} />}
                            {status === 'active' ? t('active') : t('inactive')}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button 
                      type="button"
                      onClick={() => setIsMemberModalOpen(false)}
                      className="flex-1 py-5 px-8 bg-slate-50 text-slate-500 font-bold rounded-2xl hover:bg-slate-100 active:scale-95 transition-all text-sm"
                    >
                      {t('cancel')}
                    </button>
                    <button 
                      type="submit"
                      className="flex-1 py-5 px-8 bg-blue-600 text-white font-bold rounded-2xl shadow-xl shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all text-sm"
                    >
                      {t('save')}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
}


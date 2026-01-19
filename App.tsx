
import React, { useState, useEffect, useMemo } from 'react';
import { Customer, Expense, AuthState, Transaction } from './types';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

// --- Constants ---
const VALID_USER = "JAHID";
const VALID_PASS = "1234";
const OWNER_RESET_KEY = "MD JAHIDUL ISLAM";

// --- Translations ---
const translations = {
  bn: {
    appName: "SHIKDER GROUP",
    secureTracker: "সুরক্ষিত আর্থিক ট্র্যাকার",
    authOnly: "শুধুমাত্র অনুমোদিত প্রবেশ",
    username: "ইউজার নেম",
    password: "পাসওয়ার্ড",
    login: "লগইন",
    loginError: "ভুল ইউজার নেম বা পাসওয়ার্ড!",
    totalIncome: "টোটাল ইনকাম",
    totalExpense: "টোটাল খরচ",
    balance: "অবশিষ্ট জমা (Balance)",
    custEntryTitle: "কাস্টমার এন্ট্রি (স্মার্ট)",
    custName: "কাস্টমারের নাম",
    cardQty: "কার্ড সংখ্যা",
    amount: "টাকা জমা",
    save: "সেভ করুন",
    expTitle: "খরচ এড করুন",
    expReason: "খরচের বিবরণ",
    expAmount: "টাকার পরিমাণ",
    addExp: "খরচ এড করুন",
    search: "সার্চ কাস্টমার...",
    pdfBtn: "সম্পূর্ণ রিপোর্ট PDF",
    tableSl: "SL",
    tableName: "নাম",
    tableUpdate: "সর্বশেষ আপডেট",
    tableCards: "টোটাল কার্ড",
    tableAmount: "টোটাল জমা",
    tableAction: "ইতিহাস PDF",
    noRecords: "কোন রেকর্ড পাওয়া যায়নি",
    resetTitle: "রেকর্ড অক্ষুণ্ণ রেখে ব্যালেন্স ০ করতে মালিকের নাম লিখুন",
    resetBtn: "অবশিষ্ট জমা রিসেট করুন",
    ownerPlaceholder: "মালিকের নাম লিখুন",
    logout: "লগআউট",
    loggedInAs: "লগইন করা আছে:",
    langToggle: "English",
    alertBalanceZero: "ব্যালেন্স ইতিমধ্যেই ০!",
    confirmReset: "অবশিষ্ট জমা রিসেট করতে চান?",
    resetSuccess: "হিসাব ক্লোজ হয়েছে।",
    resetWrongOwner: "সঠিক মালিকের নাম লিখুন!",
    addCustSuccess: "কাস্টমারের তথ্য সফলভাবে আপডেট হয়েছে।",
    historyPdfTitle: "লেনদেনের ইতিহাস",
    date: "তারিখ",
    dailyReportsTitle: "দৈনিক রিপোর্ট (শেষ ২ দিন)",
    dayIncome: "দিনের ইনকাম",
    dayExpense: "দিনের খরচ",
    dayBalance: "দিনের ব্যালেন্স",
    downloadDailyPdf: "ডাউনলোড",
    entries: "এন্ট্রি সমূহ",
    reason: "বিবরণ",
    searchByDate: "পুরানো রিপোর্ট খুঁজুন",
    clearSearch: "রিসেট",
    recentReports: "সাম্প্রতিক রিপোর্ট",
    noDailyRecord: "নির্বাচিত তারিখে কোন রেকর্ড পাওয়া যায়নি।"
  },
  en: {
    appName: "SHIKDER GROUP",
    secureTracker: "Secure Financial Tracker",
    authOnly: "Authorized Access Only",
    username: "Username",
    password: "Password",
    login: "Login",
    loginError: "Incorrect username or password!",
    totalIncome: "Total Income",
    totalExpense: "Total Expense",
    balance: "Balance",
    custEntryTitle: "Customer Entry (Smart)",
    custName: "Customer Name",
    cardQty: "Card Qty",
    amount: "Deposit Amount",
    save: "Save",
    expTitle: "Add Expense",
    expReason: "Expense Detail",
    expAmount: "Amount",
    addExp: "Add Expense",
    search: "Search Customers...",
    pdfBtn: "FULL DATA PDF",
    tableSl: "SL",
    tableName: "Name",
    tableUpdate: "Last Update",
    tableCards: "Total Cards",
    tableAmount: "Total Deposit",
    tableAction: "History PDF",
    noRecords: "No Records Found",
    resetTitle: "Enter owner's name to reset balance while keeping records",
    resetBtn: "Reset Balance",
    ownerPlaceholder: "Enter Owner's Name",
    logout: "Logout",
    loggedInAs: "Logged in as:",
    langToggle: "বাংলা",
    alertBalanceZero: "Balance is already 0!",
    confirmReset: "Do you want to reset the remaining balance?",
    resetSuccess: "Account closed successfully.",
    resetWrongOwner: "Enter correct owner name!",
    addCustSuccess: "Customer info updated successfully.",
    historyPdfTitle: "Transaction History",
    date: "Date",
    dailyReportsTitle: "Daily Reports (Last 2 Days)",
    dayIncome: "Day Income",
    dayExpense: "Day Expense",
    dayBalance: "Day Balance",
    downloadDailyPdf: "Download",
    entries: "Entries",
    reason: "Reason",
    searchByDate: "Search Older Reports",
    clearSearch: "Reset",
    recentReports: "Recent Reports",
    noDailyRecord: "No records found for the selected date."
  }
};

const App: React.FC = () => {
  // --- State ---
  const [lang, setLang] = useState<'bn' | 'en'>(() => {
    const saved = localStorage.getItem('sg_lang');
    return (saved as 'bn' | 'en') || 'bn';
  });

  const [auth, setAuth] = useState<AuthState>(() => {
    const saved = sessionStorage.getItem('sg_auth');
    return saved ? JSON.parse(saved) : { isLoggedIn: false, username: '' };
  });

  const [loginForm, setLoginForm] = useState({ user: '', pass: '' });
  const [loginError, setLoginError] = useState(false);

  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem('sg_cust_v2');
    return saved ? JSON.parse(saved) : [];
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem('sg_exp_v2');
    return saved ? JSON.parse(saved) : [];
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [reportSearchDate, setReportSearchDate] = useState('');

  const [custForm, setCustForm] = useState({ name: '', date: new Date().toISOString().split('T')[0], cards: '', amount: '' });
  const [expForm, setExpForm] = useState({ reason: '', date: new Date().toISOString().split('T')[0], amount: '' });
  const [ownerPass, setOwnerPass] = useState('');

  const t = translations[lang];

  // --- Effects ---
  useEffect(() => {
    localStorage.setItem('sg_cust_v2', JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem('sg_exp_v2', JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    sessionStorage.setItem('sg_auth', JSON.stringify(auth));
  }, [auth]);

  useEffect(() => {
    localStorage.setItem('sg_lang', lang);
  }, [lang]);

  // --- Helpers ---
  const totalIncome = useMemo(() => customers.reduce((s, c) => s + c.amount, 0), [customers]);
  const totalExpense = useMemo(() => expenses.reduce((s, e) => s + e.amount, 0), [expenses]);
  const balance = totalIncome - totalExpense;

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [customers, searchQuery]);

  const uniqueNames = useMemo(() => Array.from(new Set(customers.map(c => c.name))), [customers]);

  const allDailyReports = useMemo(() => {
    const reports: Record<string, { income: number; expense: number; customerEntries: any[]; dailyExpenses: any[] }> = {};
    customers.forEach(c => {
      (c.history || []).forEach(tr => {
        if (!reports[tr.date]) reports[tr.date] = { income: 0, expense: 0, customerEntries: [], dailyExpenses: [] };
        reports[tr.date].income += tr.amount;
        reports[tr.date].customerEntries.push({ name: c.name, cards: tr.cards, amount: tr.amount });
      });
    });
    expenses.forEach(e => {
      if (!reports[e.date]) reports[e.date] = { income: 0, expense: 0, customerEntries: [], dailyExpenses: [] };
      reports[e.date].expense += e.amount;
      reports[e.date].dailyExpenses.push({ reason: e.reason, amount: e.amount });
    });
    return Object.entries(reports).sort((a, b) => b[0].localeCompare(a[0]));
  }, [customers, expenses]);

  const displayedReports = useMemo(() => {
    if (reportSearchDate) return allDailyReports.filter(([date]) => date === reportSearchDate);
    return allDailyReports.slice(0, 2);
  }, [allDailyReports, reportSearchDate]);

  // --- Actions ---
  const handleLogin = () => {
    if (loginForm.user === VALID_USER && loginForm.pass === VALID_PASS) {
      setAuth({ isLoggedIn: true, username: loginForm.user });
      setLoginError(false);
    } else {
      setLoginError(true);
    }
  };

  const handleLogout = () => {
    setAuth({ isLoggedIn: false, username: '' });
    sessionStorage.removeItem('sg_auth');
  };

  const toggleLang = () => {
    setLang(prev => prev === 'bn' ? 'en' : 'bn');
  };

  const addCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!custForm.name || !custForm.amount) return;
    const cardsNum = Number(custForm.cards);
    const amountNum = Number(custForm.amount);
    const entryDate = custForm.date;
    const newTransaction: Transaction = { date: entryDate, cards: cardsNum, amount: amountNum };
    const existingIndex = customers.findIndex(c => c.name.toLowerCase() === custForm.name.toLowerCase());
    if (existingIndex > -1) {
      const updated = [...customers];
      const target = updated[existingIndex];
      updated[existingIndex] = {
        ...target,
        cards: target.cards + cardsNum,
        amount: target.amount + amountNum,
        date: entryDate,
        history: [...(target.history || []), newTransaction]
      };
      setCustomers(updated);
    } else {
      setCustomers([...customers, { id: Date.now().toString(), name: custForm.name, date: entryDate, cards: cardsNum, amount: amountNum, history: [newTransaction] }]);
    }
    setCustForm({ name: '', date: new Date().toISOString().split('T')[0], cards: '', amount: '' });
  };

  const addExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expForm.reason || !expForm.amount) return;
    setExpenses([...expenses, { id: Date.now().toString(), date: expForm.date, reason: expForm.reason, amount: Number(expForm.amount) }]);
    setExpForm({ reason: '', date: new Date().toISOString().split('T')[0], amount: '' });
  };

  const resetAccount = () => {
    if (ownerPass === OWNER_RESET_KEY) {
      if (balance === 0) { alert(t.alertBalanceZero); return; }
      if (window.confirm(`${t.confirmReset} (৳${balance})`)) {
        setExpenses([...expenses, { id: Date.now().toString(), date: new Date().toISOString().split('T')[0], reason: "Account Reset Adjustment", amount: balance }]);
        setOwnerPass('');
        alert(t.resetSuccess);
      }
    } else { alert(t.resetWrongOwner); }
  };

  const generatePDF = () => {
    const doc = new jsPDF() as any;
    doc.text(`${t.appName} REPORT`, 14, 15);
    doc.autoTable({
      head: [[t.tableSl, t.tableName, t.tableUpdate, t.tableCards, t.tableAmount]],
      body: customers.map((c, i) => [i + 1, c.name, c.date, c.cards, `৳${c.amount}`])
    });
    doc.save(`${t.appName}_Report_${new Date().toLocaleDateString()}.pdf`);
  };

  const generateCustomerHistoryPDF = (customer: Customer) => {
    const doc = new jsPDF() as any;
    doc.text(`${t.appName} - ${customer.name}`, 14, 15);
    doc.text(t.historyPdfTitle, 14, 25);
    doc.autoTable({
      startY: 30,
      head: [[t.tableSl, t.date, t.tableCards, t.tableAmount]],
      body: (customer.history || []).map((h, i) => [i + 1, h.date, h.cards, `৳${h.amount}`]),
      foot: [['', t.balance, customer.cards, `৳${customer.amount}`]]
    });
    doc.save(`${customer.name}_History_${new Date().toLocaleDateString()}.pdf`);
  };

  const generateDailyPDF = (date: string, data: any) => {
    const doc = new jsPDF() as any;
    doc.text(`${t.appName} - ${t.dailyReportsTitle}`, 14, 15);
    doc.text(`${t.date}: ${date}`, 14, 25);
    doc.text(t.custEntryTitle, 14, 35);
    doc.autoTable({ startY: 40, head: [[t.tableSl, t.tableName, t.tableCards, t.tableAmount]], body: data.customerEntries.map((e: any, i: number) => [i + 1, e.name, e.cards, `৳${e.amount}`]) });
    const nextY = (doc as any).lastAutoTable.finalY + 10;
    doc.text(t.expTitle, 14, nextY);
    doc.autoTable({ startY: nextY + 5, head: [[t.tableSl, t.reason, t.amount]], body: data.dailyExpenses.map((ex: any, i: number) => [i + 1, ex.reason, `৳${ex.amount}`]) });
    const lastY = (doc as any).lastAutoTable.finalY + 15;
    doc.text(`${t.dayIncome}: ৳${data.income}`, 14, lastY);
    doc.text(`${t.dayExpense}: ৳${data.expense}`, 14, lastY + 10);
    doc.text(`${t.dayBalance}: ৳${data.income - data.expense}`, 14, lastY + 20);
    doc.save(`Report_${date}.pdf`);
  };

  // --- Render ---
  if (!auth.isLoggedIn) {
    return (
      <div className="fixed inset-0 bg-dark flex items-center justify-center p-4">
        <div className="absolute top-6 right-6"><button onClick={toggleLang} className="text-xs gold-gradient px-4 py-2 rounded-full font-black text-black hover:scale-110 transition-transform shadow-xl">{t.langToggle}</button></div>
        <div className="glass-effect bg-dark-glass p-10 rounded-[2.5rem] w-full max-w-md border-t-4 border-gold text-center animate-in fade-in zoom-in duration-500">
          <h1 className="text-4xl font-cinzel text-gold mb-2">{t.appName}</h1>
          <p className="text-gold/50 text-[0.65rem] tracking-[0.4em] uppercase mb-10 font-bold">{t.authOnly}</p>
          <div className="space-y-5">
            <input type="text" placeholder={t.username} className="w-full bg-[#1a1a1a] border border-gold/20 p-4 rounded-2xl outline-none text-gold font-sans" value={loginForm.user} onChange={e => setLoginForm({...loginForm, user: e.target.value})} />
            <input type="password" placeholder={t.password} className="w-full bg-[#1a1a1a] border border-gold/20 p-4 rounded-2xl outline-none text-gold font-sans" value={loginForm.pass} onChange={e => setLoginForm({...loginForm, pass: e.target.value})} />
            <button onClick={handleLogin} className="gold-gradient w-full py-4 rounded-2xl font-black uppercase text-sm hover:scale-[1.03] text-black">{t.login}</button>
          </div>
          {loginError && <p className="text-red-500 mt-6 text-sm font-bold animate-pulse">{t.loginError}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen pb-20 bg-dark ${lang === 'bn' ? 'font-bengali' : ''}`}>
      <nav className="glass-effect sticky top-0 z-50 bg-dark-glass/80 p-4 px-6 flex justify-between items-center border-b border-gold/10">
        <div><h1 className="text-xl md:text-2xl font-cinzel text-gold tracking-tight">{t.appName}</h1><p className="text-[0.6rem] text-gold/60 uppercase tracking-widest font-bold">{t.secureTracker}</p></div>
        <div className="flex items-center gap-2">
          <button onClick={toggleLang} className="text-[0.6rem] gold-gradient px-3 py-1.5 rounded-full font-black text-black uppercase">{t.langToggle}</button>
          <button onClick={handleLogout} className="text-[0.6rem] uppercase tracking-tighter text-red-500 px-4 py-1.5 border border-red-900/30 rounded-full font-bold">{t.logout}</button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 mt-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="glass-effect p-8 rounded-3xl text-center"><p className="text-xs uppercase text-gold/60 mb-1">{t.totalIncome}</p><h2 className="text-4xl font-bold text-green-500 font-sans">৳{totalIncome.toLocaleString()}</h2></div>
          <div className="glass-effect p-8 rounded-3xl text-center"><p className="text-xs uppercase text-gold/60 mb-1">{t.totalExpense}</p><h2 className="text-4xl font-bold text-red-500 font-sans">৳{totalExpense.toLocaleString()}</h2></div>
          <div className="gold-gradient p-8 rounded-3xl text-center text-black"><p className="text-xs uppercase font-black opacity-60 mb-1">{t.balance}</p><h2 className="text-4xl font-black font-sans">৳{balance.toLocaleString()}</h2></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <div className="glass-effect p-8 rounded-[2rem] border-t-2 border-gold/20">
            <h3 className="font-cinzel text-gold text-xl mb-6">{t.custEntryTitle}</h3>
            <form onSubmit={addCustomer} className="space-y-4">
              <input type="text" placeholder={t.custName} list="nameList" required className="w-full bg-[#151515] border border-gold/10 p-4 rounded-2xl text-gold font-sans outline-none" value={custForm.name} onChange={e => setCustForm({...custForm, name: e.target.value})} />
              <datalist id="nameList">{uniqueNames.map(name => <option key={name} value={name} />)}</datalist>
              <div className="grid grid-cols-2 gap-4">
                <input type="date" required className="bg-[#151515] border border-gold/10 p-4 rounded-2xl text-gold font-sans" value={custForm.date} onChange={e => setCustForm({...custForm, date: e.target.value})} />
                <input type="number" placeholder={t.cardQty} required className="bg-[#151515] border border-gold/10 p-4 rounded-2xl text-gold font-sans" value={custForm.cards} onChange={e => setCustForm({...custForm, cards: e.target.value})} />
              </div>
              <input type="number" placeholder={t.amount} required className="w-full bg-[#151515] border border-gold/10 p-4 rounded-2xl text-gold font-sans" value={custForm.amount} onChange={e => setCustForm({...custForm, amount: e.target.value})} />
              <button type="submit" className="gold-gradient w-full py-4 rounded-2xl font-black text-black uppercase">{t.save}</button>
            </form>
          </div>
          <div className="glass-effect p-8 rounded-[2rem] border-t-2 border-red-900/40">
            <h3 className="font-cinzel text-red-500 text-xl mb-6">{t.expTitle}</h3>
            <form onSubmit={addExpense} className="space-y-4">
              <input type="date" required className="w-full bg-[#151515] border border-red-900/20 p-4 rounded-2xl text-red-400 font-sans" value={expForm.date} onChange={e => setExpForm({...expForm, date: e.target.value})} />
              <input type="text" placeholder={t.expReason} required className="w-full bg-[#151515] border border-red-900/20 p-4 rounded-2xl text-red-400" value={expForm.reason} onChange={e => setExpForm({...expForm, reason: e.target.value})} />
              <input type="number" placeholder={t.expAmount} required className="w-full bg-[#151515] border border-red-900/20 p-4 rounded-2xl text-red-400 font-sans" value={expForm.amount} onChange={e => setExpForm({...expForm, amount: e.target.value})} />
              <button type="submit" className="w-full py-4 rounded-2xl border-2 border-red-500 text-red-500 font-black uppercase">{t.addExp}</button>
            </form>
          </div>
        </div>

        {/* Daily Reports Section */}
        <div className="mb-12">
           <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <h3 className="font-cinzel text-gold text-2xl flex items-center gap-3">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/></svg>
                {t.dailyReportsTitle}
              </h3>
              <div className="flex items-center gap-2 bg-gold/5 p-2 rounded-2xl border border-gold/10">
                <p className="text-[0.6rem] text-gold/60 font-black uppercase px-2">{t.searchByDate}:</p>
                <input type="date" className="bg-dark/50 border border-gold/20 p-2 rounded-xl text-gold font-sans text-xs outline-none" value={reportSearchDate} onChange={e => setReportSearchDate(e.target.value)} />
                {reportSearchDate && <button onClick={() => setReportSearchDate('')} className="text-[0.6rem] font-black text-red-500 bg-red-500/10 px-3 py-2 rounded-xl uppercase">{t.clearSearch}</button>}
              </div>
           </div>
           <div className="space-y-6">
              {displayedReports.length > 0 ? displayedReports.map(([date, data]) => (
                <div key={date} className="glass-effect rounded-[2rem] overflow-hidden border border-gold/10 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="bg-gold/5 p-6 flex flex-col md:flex-row justify-between items-center gap-4">
                    <h4 className="font-sans font-black text-gold text-lg">{date}</h4>
                    <div className="flex gap-4 text-xs font-bold uppercase tracking-widest"><span className="text-green-500">{t.dayIncome}: ৳{data.income}</span><span className="text-red-500">{t.dayExpense}: ৳{data.expense}</span><span className="text-gold">{t.dayBalance}: ৳{data.income - data.expense}</span></div>
                    <button onClick={() => generateDailyPDF(date, data)} className="bg-gold text-black px-5 py-2 rounded-xl text-[0.6rem] font-black uppercase hover:scale-105 transition-transform">{t.downloadDailyPdf} PDF</button>
                  </div>
                  <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div><p className="text-[0.65rem] uppercase font-black text-gold/40 mb-3">{t.entries}</p><ul className="space-y-2 text-sm">{data.customerEntries.map((e: any, idx: number) => (<li key={idx} className="flex justify-between border-b border-gold/5 pb-1"><span>{e.name} ({e.cards} pcs)</span><span className="font-sans font-bold text-gold">৳{e.amount}</span></li>))}</ul></div>
                    <div><p className="text-[0.65rem] uppercase font-black text-red-500/40 mb-3">{t.expTitle}</p><ul className="space-y-2 text-sm">{data.dailyExpenses.map((ex: any, idx: number) => (<li key={idx} className="flex justify-between border-b border-red-900/10 pb-1"><span>{ex.reason}</span><span className="font-sans font-bold text-red-400">৳{ex.amount}</span></li>))}</ul></div>
                  </div>
                </div>
              )) : <div className="glass-effect p-12 rounded-[2rem] text-center italic text-gold/20 font-sans">{reportSearchDate ? t.noDailyRecord : t.noRecords}</div>}
           </div>
        </div>

        {/* Customer Table */}
        <div className="glass-effect rounded-[2.5rem] overflow-hidden bg-dark-glass">
          <div className="p-6 border-b border-gold/10 flex flex-col md:flex-row justify-between items-center gap-4 bg-gold/5">
            <input type="text" placeholder={t.search} className="w-full md:w-1/2 bg-dark/50 border border-gold/10 p-3 rounded-xl text-gold font-sans outline-none" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            <button onClick={generatePDF} className="w-full md:w-auto text-[0.7rem] font-black border border-gold/30 text-gold px-6 py-3 rounded-xl uppercase">{t.pdfBtn}</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead><tr className="bg-gold text-black text-[0.7rem] uppercase font-black"><th className="p-5">{t.tableSl}</th><th className="p-5">{t.tableName}</th><th className="p-5">{t.tableUpdate}</th><th className="p-5">{t.tableCards}</th><th className="p-5">{t.tableAmount}</th><th className="p-5 text-right">{t.tableAction}</th></tr></thead>
              <tbody className="divide-y divide-gold/5">
                {filteredCustomers.map((c, i) => (
                  <tr key={c.id} className="hover:bg-gold/5 transition-colors group">
                    <td className="p-5 text-gold/40 font-sans text-sm">#{i + 1}</td>
                    <td className="p-5 font-bold text-gold-light">{c.name}</td>
                    <td className="p-5 text-xs font-sans">{c.date}</td>
                    <td className="p-5 font-sans">{c.cards}</td>
                    <td className="p-5 font-bold text-gold font-sans">৳{c.amount.toLocaleString()}</td>
                    <td className="p-5 text-right"><button onClick={() => generateCustomerHistoryPDF(c)} className="text-[0.6rem] px-3 py-1.5 border border-gold/20 rounded-lg text-gold font-black">PDF</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Account Reset */}
        <div className="mt-20 max-w-sm mx-auto glass-effect p-8 rounded-[2.5rem] text-center border-t-4 border-red-600">
          <p className="text-[0.6rem] mb-6 opacity-60 uppercase font-bold">{t.resetTitle}</p>
          <input type="password" placeholder={t.ownerPlaceholder} className="w-full bg-dark/50 border border-red-900/20 p-4 rounded-2xl mb-6 text-center text-red-500 font-sans outline-none" value={ownerPass} onChange={e => setOwnerPass(e.target.value)} />
          <button onClick={resetAccount} className="w-full bg-red-600 text-white py-4 rounded-2xl font-black uppercase text-xs hover:bg-red-700 transition-colors">{t.resetBtn}</button>
        </div>
      </div>
    </div>
  );
};

export default App;

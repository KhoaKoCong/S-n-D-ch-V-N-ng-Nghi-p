/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import { AgriProvider, useAgri } from './context/AgriContext';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { HomeScreen } from './components/HomeScreen';
import { NewsScreen } from './components/NewsScreen';
import { CreatePostScreen } from './components/CreatePostScreen';
import { TransactionsScreen } from './components/TransactionsScreen';
import { ProfileScreen } from './components/ProfileScreen';
import { AdminDashboardScreen } from './components/AdminDashboardScreen';
import { PostDetailModal } from './components/PostDetailModal';
import { ChatDrawerModal } from './components/ChatDrawerModal';
import { TopUpModal } from './components/TopUpModal';
import { OnboardingModal } from './components/OnboardingModal';
import { AuthModal } from './components/AuthModal';
import { SyncModal } from './components/SyncModal';
import { AiAssistantWidget } from './components/AiAssistantWidget';

const MainLayout: React.FC = () => {
  const { activeTab } = useAgri();
  const mainScrollRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('agri_theme_mode');
      if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else if (savedTheme === 'light') {
        document.documentElement.classList.remove('dark');
      }
    } catch {}
  }, []);

  useEffect(() => {
    mainScrollRef.current?.scrollTo({ top: 0 });
    window.scrollTo({ top: 0 });
  }, [activeTab]);

  return (
    <div className="h-[100dvh] lg:h-auto lg:min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col overflow-hidden lg:overflow-visible transition-colors selection:bg-emerald-500 selection:text-white">
      {/* Persistent Top Header */}
      <Header />

      {/* Scrollable Content Region on Mobile / Standard Flow on Desktop */}
      <main
        ref={mainScrollRef}
        id="app-main-scroll"
        className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-y-contain lg:overflow-visible w-full"
      >
        <div className="max-w-7xl w-full mx-auto px-3 sm:px-6 pt-4 sm:pt-6">
          {activeTab === 'home' && <HomeScreen />}
          {activeTab === 'news' && <NewsScreen />}
          {activeTab === 'create' && <CreatePostScreen />}
          {activeTab === 'transactions' && <TransactionsScreen />}
          {activeTab === 'profile' && <ProfileScreen />}
          {activeTab === 'admin' && <AdminDashboardScreen />}
        </div>
      </main>

      {/* Always-Visible Mobile Bottom Navigation */}
      <BottomNav />

      {/* Floating AI Agricultural Assistant Bubble & Chat Panel */}
      <AiAssistantWidget />

      {/* Global Modals */}
      <PostDetailModal />
      <ChatDrawerModal />
      <TopUpModal />
      <OnboardingModal />
      <AuthModal />
      <SyncModal />
    </div>
  );
};

export default function App() {
  return (
    <AgriProvider>
      <MainLayout />
    </AgriProvider>
  );
}

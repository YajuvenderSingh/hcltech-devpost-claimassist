import './components/config/awsConfig';

import React, { useState, useEffect, useCallback } from 'react';
import { Toaster } from 'react-hot-toast';
import { AnimatePresence } from 'framer-motion';
import RealLogin from './components/auth/RealLogin';
import MainLayout from './components/layout/MainLayout';
import Dashboard from './components/Dashboard';
import MatchingClaims from './components/MatchingClaims';
import DocumentUpload from './components/DocumentUpload';
import ContentExtraction from './components/ContentExtraction';
import Verification from './components/Verification';
import ClaimMatching from './components/ClaimMatching';
import DecisionMaking from './components/DecisionMaking';
import DMSUpdate from './components/DMSUpdate';
import LoadingSpinner from './components/ui/LoadingSpinner';
import ChatBot from './components/ChatBot';
import { realAuthService, AuthUser } from './services/realAuth';

export type Step = 'login' | 'dashboard' | 'upload' | 'extract' | 'verify' | 'matching' | 'matching-claims' | 'dms' | 'decision';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'Uploader' | 'Adjuster';
  avatar?: string;
  token: string;
}

export interface AppState {
  currentStep: Step;
  user: User | null;
  documents: any[];
  extractedData: any[];
  selectedClaim: any;
  selectedDocId: string | null;
  employeeData: any | null;
  sidebarOpen: boolean;
  loading: boolean;
  chatBotOpen: boolean;
}

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    currentStep: 'login',
    user: null,
    documents: [],
    extractedData: [],
    selectedClaim: null,
    selectedDocId: null,
    employeeData: null,
    sidebarOpen: false,
    loading: false,
    chatBotOpen: false
  });

  const updateState = (updates: Partial<AppState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

const handleRealLogin = (user: AuthUser) => {
  console.log('🔐 Real auth login successful:', { id: user.id, role: user.role, email: user.email });
  
  const appUser: User = {
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.email.split('@')[0],
    token: user.token,
    avatar: undefined
  };
  
  // Route based on role
  const nextStep = user.role === 'Adjuster' ? 'dashboard' : 'upload';
  console.log('🎯 Routing to:', nextStep, 'for role:', user.role);
  
  updateState({ 
    user: appUser, 
    currentStep: nextStep
  });
};

const checkAuthState = useCallback(async () => {
  try {
    updateState({ loading: true });
    
    // Check for existing real auth session
    const sessions = localStorage.getItem('realAuth_sessions');
    if (sessions) {
      const sessionsArray = JSON.parse(sessions);
      const sessionsMap = new Map(sessionsArray);
      
      // Find any valid session
      for (const [token, authUser] of sessionsArray) {
        if (authUser && authUser.email && authUser.role && authUser.verified) {
          console.log('🔍 Restored real auth user:', authUser);
          
          const appUser: User = {
            id: authUser.id,
            email: authUser.email,
            role: authUser.role,
            name: authUser.email.split('@')[0],
            token: authUser.token,
            avatar: undefined
          };
          
          const nextStep = authUser.role === 'Adjuster' ? 'dashboard' : 'upload';
          console.log('🎯 Routing restored user to:', nextStep, 'for role:', authUser.role);
          
          updateState({
            user: appUser,
            currentStep: nextStep,
            loading: false
          });
          return;
        }
      }
    }
    
    // No valid session found
    updateState({ loading: false });
    
    // Clean up old simpleAuth storage to prevent conflicts
    localStorage.removeItem('currentUser');
    localStorage.removeItem('authToken');
  } catch (error) {
    console.error('❌ Auth state check error:', error);
    updateState({ loading: false });
  }
}, []);

useEffect(() => {
  checkAuthState();
}, [checkAuthState]);


 const handleLogout = async () => {
  try {
    if (state.user?.token) {
      await realAuthService.signOut(state.user.token);
    }
    setState({
      currentStep: 'login',
      user: null,
      documents: [],
      extractedData: [],
      selectedClaim: null,
      selectedDocId: null,
      employeeData: null,
      sidebarOpen: false,
      loading: false,
      chatBotOpen: false
    });
  } catch (error) {
    // Handle logout error silently or show user-friendly message
    console.error('Logout error:', error);
  }
};

const toggleChatBot = () => {
  updateState({ chatBotOpen: !state.chatBotOpen });
};

const handleNavigate = (step: Step) => {
  // Clear selectedDocId when navigating away from extract page
  if (step !== 'extract') {
    updateState({ currentStep: step, selectedDocId: null });
  } else {
    updateState({ currentStep: step });
  }
};

  const handleClaimsNavigate = (employeeData: any) => {
    updateState({ 
      currentStep: 'matching-claims',
      employeeData: employeeData
    });
  };

  const handleDocIdSelect = (docId: string) => {
    updateState({ selectedDocId: docId });
  };

  const handleUploadNext = (docs: any[]) => {
    updateState({ documents: docs, currentStep: 'extract' });
  };

  const handleExtractionNext = (data: any[]) => {
    updateState({ extractedData: data, currentStep: 'verify' });
  };

  const handleVerificationNext = () => {
    const nextStep = state.user?.role === 'Adjuster' ? 'decision' : 'upload';
    updateState({ 
      currentStep: nextStep,
      ...(nextStep === 'upload' && { documents: [], extractedData: [] })
    });
  };

  const handleMatchingNext = (matchedClaim: any) => {
    updateState({ selectedClaim: matchedClaim, currentStep: 'dms' });
  };

  const handleDMSNext = () => {
    updateState({ currentStep: 'decision' });
  };

  const handleDecisionComplete = () => {
    updateState({ 
      currentStep: 'dashboard',
      documents: [],
      extractedData: [],
      selectedClaim: null
    });
  };

  const renderCurrentStep = () => {
    if (state.loading) {
      return <LoadingSpinner fullScreen />;
    }

    if (!state.user) {
      return <RealLogin onLogin={handleRealLogin} />;
    }

    const content = (() => {
      switch (state.currentStep) {
        case 'dashboard':
          return (
            <Dashboard 
              onNavigate={handleNavigate}
              onDocIdSelect={handleDocIdSelect}
              onClaimsNavigate={handleClaimsNavigate}
              userRole={state.user.role === 'Adjuster' ? 'adjuster' : 'uploader'}
            />
          );
        case 'upload':
          return <DocumentUpload onNext={handleUploadNext} />;
        case 'extract':
          return <ContentExtraction files={state.documents} selectedDocId={state.selectedDocId} userRole={state.user?.role} onNext={handleExtractionNext} onDocIdSelect={handleDocIdSelect} />;
        case 'verify':
          return <Verification extractedData={state.extractedData} onNext={handleVerificationNext} />;
        case 'matching':
          return <ClaimMatching onNext={handleMatchingNext} />;
        case 'matching-claims':
          return (
            <MatchingClaims 
              onNavigate={handleNavigate}
              onDocIdSelect={handleDocIdSelect}
              employeeData={state.employeeData}
              docId={state.employeeData?.docId}
            />
          );
        case 'dms':
          return <DMSUpdate documents={state.documents} onNext={handleDMSNext} />;
        case 'decision':
          return <DecisionMaking onComplete={handleDecisionComplete} />;
        default:
          return (
            <Dashboard 
              onNavigate={handleNavigate}
              onDocIdSelect={handleDocIdSelect}
              onClaimsNavigate={handleClaimsNavigate}
              userRole={state.user.role === 'Adjuster' ? 'adjuster' : 'uploader'}
            />
          );
      }
    })();

    return (
      <MainLayout 
        user={state.user} 
        currentStep={state.currentStep} 
        onLogout={handleLogout}
        sidebarOpen={state.sidebarOpen}
        setSidebarOpen={(open) => updateState({ sidebarOpen: open })}
        onNavigate={handleNavigate}
      >
        <AnimatePresence mode="wait">
          {content}
        </AnimatePresence>
      </MainLayout>
    );
  };

  return (
    <div className="App min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {renderCurrentStep()}
      
      {/* AI ChatBot - Only available when DOC ID is selected */}
      {state.user && state.selectedDocId && (
        <ChatBot
          isOpen={state.chatBotOpen}
          onToggle={toggleChatBot}
          currentDocId={state.selectedDocId || undefined}
          userRole={state.user.role}
          currentStep={state.currentStep}
          hasDocuments={state.documents.length > 0}
        />
      )}
      
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#ffffff',
            color: '#1f2937',
            borderRadius: '8px',
            padding: '12px 16px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            border: '1px solid #e5e7eb',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </div>
  );
};

export default App;
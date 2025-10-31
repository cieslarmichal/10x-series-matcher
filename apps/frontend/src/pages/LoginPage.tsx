import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import LoginForm from '../components/LoginForm';
import RegisterForm from '../components/RegisterForm';
import { Button } from '@/components/ui/Button';

export default function LoginPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab');
  const redirect = searchParams.get('redirect');

  const [activeTab, setActiveTab] = useState<'login' | 'register'>(tab === 'register' ? 'register' : 'login');
  const [isRegistrationSuccess, setIsRegistrationSuccess] = useState(false);

  useEffect(() => {
    if (tab === 'register') {
      setActiveTab('register');
    } else {
      setActiveTab('login');
    }
    setIsRegistrationSuccess(false);
  }, [tab]);

  const handleTabChange = (newTab: 'login' | 'register') => {
    setActiveTab(newTab);
    const params: Record<string, string> = { tab: newTab };
    if (redirect) params.redirect = redirect;
    setSearchParams(params);
    setIsRegistrationSuccess(false);
  };

  const handleRegistrationSuccess = () => {
    setIsRegistrationSuccess(true);
  };

  const handleBackToLogin = () => {
    setIsRegistrationSuccess(false);
    setActiveTab('login');
    const params: Record<string, string> = { tab: 'login' };
    if (redirect) params.redirect = redirect;
    setSearchParams(params);
  };

  const getTabContent = () => {
    if (activeTab === 'login') {
      return {
        title: 'Log into your account',
        content: <LoginForm />,
      };
    }

    if (activeTab === 'register') {
      if (isRegistrationSuccess) {
        return {
          title: 'Account Created Successfully!',
          content: (
            <div className="px-6 text-center space-y-6">
              <div className="space-y-4">
                <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto border-2 border-border">
                  <svg
                    className="w-8 h-8 text-foreground"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-foreground tracking-tight">Welcome aboard!</h3>
                <p className="text-muted-foreground">
                  Your account has been created successfully. You can now sign in with your credentials.
                </p>
              </div>
              <Button
                onClick={handleBackToLogin}
                className="w-full h-11"
                data-testid="back-to-sign-in-button"
              >
                Back to Sign In
              </Button>
            </div>
          ),
        };
      }
      return {
        title: 'Create Account',
        content: <RegisterForm onSuccess={handleRegistrationSuccess} />,
      };
    }

    return { title: '', content: null };
  };

  const { title, content } = getTabContent();

  return (
    <div className="min-h-screen bg-background flex justify-center pt-32">
      {/* Subtle grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:4rem_4rem]" />

      <div className="w-full max-w-md space-y-8 relative z-10 px-4">
        {/* Header */}
        <div className="text-center flex flex-col justify-end pb-2">
          <h2 className="text-3xl font-bold text-foreground tracking-tight">{title}</h2>
        </div>

        {/* Tab Navigation */}
        {!isRegistrationSuccess && (
          <div className="flex justify-center">
            <div className="bg-secondary p-1 rounded-lg border border-border">
              <Button
                variant="ghost"
                className={`px-6 py-2.5 text-sm font-medium rounded-md transition-all duration-200 ${
                  activeTab === 'login'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => handleTabChange('login')}
                data-testid="login-tab-button"
              >
                Sign In
              </Button>
              <Button
                variant="ghost"
                className={`px-6 py-2.5 text-sm font-medium rounded-md transition-all duration-200 ${
                  activeTab === 'register'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => handleTabChange('register')}
                data-testid="register-tab-button"
              >
                Sign Up
              </Button>
            </div>
          </div>
        )}

        {/* Form Container */}
        <div className="bg-card rounded-lg border border-border p-8 shadow-sm">{content}</div>
      </div>
    </div>
  );
}

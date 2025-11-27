/**
 * @fileoverview Registration Page
 * @module app/(auth)/register
 * 
 * OVERVIEW:
 * User registration page with state selection and perk display.
 * Creates new user account with firstName, lastName, state fields.
 * Shows state economic perks to help users make strategic choice.
 * Auto-signs in after successful registration.
 * 
 * @created 2025-11-21
 * @author ECHO v1.1.0
 */

'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button, Input, Card, CardBody, Divider, Link } from '@heroui/react';
import AvatarSelector from '@/components/shared/AvatarSelector';
import type { AvatarSelection, Gender, Ethnicity } from '@/lib/types/portraits';
import StateSelector from '@/components/auth/StateSelector';
import StatePerkPanel from '@/components/auth/StatePerkPanel';
import TermsOfServiceModal from '@/components/legal/TermsOfServiceModal';
import PrivacyPolicyModal from '@/components/legal/PrivacyPolicyModal';
import type { StateAbbreviation } from '@/lib/utils/stateHelpers';

/**
 * RegisterPage - New user registration with state selection
 * 
 * Features:
 * - First name, last name, username, email, password fields
 * - State selection with perk display
 * - Password confirmation validation
 * - Client-side and server-side validation
 * - Auto sign-in after successful registration
 * - Error handling and loading states
 * 
 * @returns Registration page component
 */
export default function RegisterPage() {
  const router = useRouter();
  const search = useSearchParams();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    state: null as StateAbbreviation | null,
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong' | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);
  const [emailSuggestions, setEmailSuggestions] = useState<string[]>([]);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [suggestedState, setSuggestedState] = useState<StateAbbreviation | null>(null);
  const [fieldErrors, setFieldErrors] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showTOS, setShowTOS] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [avatar, setAvatar] = useState<AvatarSelection | null>(null);
  const [gender, setGender] = useState<Gender | null>(null);
  const [ethnicity, setEthnicity] = useState<Ethnicity | null>(null);
  const [dateOfBirth, setDateOfBirth] = useState<string>('');

  // Map raw error codes or messages to friendlier user-facing descriptions
  const getFriendlyError = (raw: string): string => {
    const code = raw.trim();
    switch (code) {
      case 'CredentialsSignin':
        return 'Sign in failed. Check your email and password.';
      case 'AccessDenied':
        return 'Access denied. Please contact support if this persists.';
      case 'OAuthAccountNotLinked':
        return 'Account exists with same email. Please sign in using original method.';
      case 'EmailSignin':
        return 'Magic link sign-in issue. Request a new link.';
      case 'Verification':
        return 'Verification token invalid or expired.';
      case 'RateLimit':
        return 'Too many attempts. Please wait a moment and try again.';
      case 'RegistrationDisabled':
        return 'Registration is temporarily disabled. Please try later.';
      default:
        // If it's a long sentence already, return as-is. Otherwise provide generic.
        if (code.length > 15) return code;
        return 'An error occurred. Please review your information and try again.';
    }
  };

  // Auto-restore form data from localStorage
  useEffect(() => {
    const savedData = localStorage.getItem('registrationFormData');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        // Don't restore passwords for security
        setFormData((prev) => ({
          ...prev,
          firstName: parsed.firstName || '',
          lastName: parsed.lastName || '',
          email: parsed.email || '',
          state: parsed.state || null,
        }));
      } catch (e) {
        // Invalid data, ignore
      }
    }
    
    // Auto-focus first name field
    const firstInput = document.querySelector('input[aria-label="First Name"]') as HTMLInputElement;
    if (firstInput) {
      setTimeout(() => firstInput.focus(), 100);
    }
    
    // Geolocation state suggestion
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const response = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${position.coords.latitude}&longitude=${position.coords.longitude}&localityLanguage=en`
            );
            const data = await response.json();
            const stateCode = data.principalSubdivisionCode?.split('-')[1];
            if (stateCode) {
              setSuggestedState(stateCode as StateAbbreviation);
            }
          } catch (e) {
            // Geolocation failed, ignore
          }
        },
        () => {
          // User denied geolocation, ignore
        }
      );
    }
    // If redirected from login with an error, show it as a friendly banner
    const qsError = search?.get('error');
    if (qsError) {
      setError(getFriendlyError(qsError));
    }
  }, []);

  const handleChange = (field: string) => (value: string) => {
    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);
    
    // Auto-save to localStorage (excluding passwords)
    const saveData = {
      firstName: newFormData.firstName,
      lastName: newFormData.lastName,
      email: newFormData.email,
      state: newFormData.state,
    };
    localStorage.setItem('registrationFormData', JSON.stringify(saveData));
    
    // Clear field error when user starts typing
    if (field in fieldErrors) {
      setFieldErrors((prev) => ({ ...prev, [field]: '' }));
    }
    
    // Update password strength indicator
    if (field === 'password') {
      setPasswordStrength(calculatePasswordStrength(value));
    }
    
    // Email domain autocomplete suggestions
    if (field === 'email' && value.includes('@') && !value.includes('.')) {
      const localPart = value.split('@')[0];
      const domainPart = value.split('@')[1] || '';
      const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com', 'protonmail.com'];
      const matches = domains
        .filter(domain => domain.startsWith(domainPart.toLowerCase()))
        .map(domain => `${localPart}@${domain}`);
      setEmailSuggestions(matches.slice(0, 3));
    } else {
      setEmailSuggestions([]);
    }
  };
  
  const handleStateChange = (state: StateAbbreviation | null) => {
    setFormData((prev) => ({ ...prev, state }));
    setSuggestedState(null); // Clear suggestion once user selects
  };

  const generateStrongPassword = (): string => {
    const length = 16;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    const upperCase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowerCase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const special = '!@#$%^&*';
    
    let password = '';
    password += upperCase[Math.floor(Math.random() * upperCase.length)];
    password += lowerCase[Math.floor(Math.random() * lowerCase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += special[Math.floor(Math.random() * special.length)];
    
    for (let i = password.length; i < length; i++) {
      password += charset[Math.floor(Math.random() * charset.length)];
    }
    
    return password.split('').sort(() => Math.random() - 0.5).join('');
  };

  const handleGeneratePassword = () => {
    const newPassword = generateStrongPassword();
    setFormData((prev) => ({ ...prev, password: newPassword, confirmPassword: newPassword }));
    setPasswordStrength(calculatePasswordStrength(newPassword));
    setShowPassword(true);
    setShowConfirmPassword(true);
  };

  const handleCapsLockCheck = (e: React.KeyboardEvent) => {
    setCapsLockOn(e.getModifierState('CapsLock'));
  };

  const calculatePasswordStrength = (password: string): 'weak' | 'medium' | 'strong' | null => {
    if (password.length === 0) return null;
    if (password.length < 6) return 'weak';
    
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;
    
    if (strength <= 2) return 'weak';
    if (strength <= 4) return 'medium';
    return 'strong';
  };

  const validateEmail = (email: string): boolean => {
    // More comprehensive email regex
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return emailRegex.test(email);
  };
  
  const suggestEmailCorrection = (email: string): string | null => {
    const commonTypos: Record<string, string> = {
      'gmial.com': 'gmail.com',
      'gmai.com': 'gmail.com',
      'gmil.com': 'gmail.com',
      'yahooo.com': 'yahoo.com',
      'yaho.com': 'yahoo.com',
      'outlok.com': 'outlook.com',
      'hotmial.com': 'hotmail.com',
      'hotmil.com': 'hotmail.com',
    };
    
    const parts = email.split('@');
    if (parts.length !== 2) return null;
    
    const domain = parts[1].toLowerCase();
    if (commonTypos[domain]) {
      return `${parts[0]}@${commonTypos[domain]}`;
    }
    
    return null;
  };

  const containsProfanity = (text: string): boolean => {
    const profanityList = [
      // Extremely offensive slurs (racial/ethnic)
      'nigger', 'nigga', 'nig', 'n1g', 'n1gg', 'chink', 'gook', 'kike', 'wetback', 'spic', 
      'beaner', 'towelhead', 'sandnigger', 'raghead', 'paki', 'coon', 'jigaboo', 'zipperhead',
      
      // Homophobic/transphobic slurs
      'fag', 'faggot', 'fagot', 'f4g', 'dyke', 'tranny', 'shemale', 'heshe', 'trannie',
      
      // Ableist slurs
      'retard', 'retarded', 'tard', 'r3tard', 'spaz', 'spastic', 'mong', 'mongoloid',
      
      // Sexual/anatomical profanity
      'fuck', 'fucker', 'fucking', 'fck', 'fuk', 'f*ck', 'f**k', 'fvck', 'phuck',
      'shit', 'shite', 'sh1t', 'shyt', 'bullshit', 'horseshit', 'chickenshit',
      'bitch', 'b1tch', 'biatch', 'bytch', 'bitches', 'son of a bitch', 'sob',
      'cunt', 'c*nt', 'cvnt', 'kunt',
      'cock', 'c0ck', 'cawk', 'cok', 'penis', 'dick', 'd1ck', 'dik',
      'pussy', 'puss', 'pussies', 'vagina', 'vag',
      'ass', 'arse', 'a$$', 'azz', 'asshole', 'a**hole', 'arsehole', 'butthole',
      'piss', 'p1ss', 'pissed', 'pissing',
      'bastard', 'basterd', 'bast4rd',
      'slut', 'slutty', 'sl*t', 'whore', 'wh0re', 'prostitute', 'hoe', 'ho',
      'tits', 'tit', 'boobs', 'boobies', 'titties',
      
      // Scatological
      'turd', 'crap', 'cr4p', 'poop', 'feces', 'dung', 'dump',
      
      // Religious profanity
      'damn', 'damned', 'd4mn', 'goddamn', 'goddam', 'hell', 'h3ll',
      
      // Derogatory terms
      'douche', 'douchebag', 'scumbag', 'jackass', 'jerk', 'dumbass', 'dipshit',
      'moron', 'idiot', 'imbecile', 'stupid', 'dumb', 'loser', 'freak',
      
      // Sexual acts
      'rape', 'molest', 'pedophile', 'pedo', 'sodomize', 'fellatio', 'cunnilingus',
      
      // Common leetspeak variants
      'fvck', 'phuk', 'fck', 'sht', 'btch', 'cnt', 'dck', 'pss', 'dmn',
      
      // Other offensive terms
      'nazi', 'hitler', 'genocide', 'kkk', 'white power', 'supremacy',
      'terrorist', 'jihad', 'suicide bomber',
      
      // Variations and combinations
      'motherfucker', 'motherf*cker', 'mofo', 'mf', 'mfer',
      'sonofabitch', 'soab',
      'piece of shit', 'pos', 'pieceofshit',
      'bullcrap', 'horsecrap', 'chickencrap',
    ];
    
    const lowerText = text.toLowerCase();
    
    // Use word boundary regex for better matching - avoids false positives like "Fame" matching "fag"
    return profanityList.some(word => {
      // Escape special regex characters in the word
      const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      // Match as whole word or as part of compound words (allow letters/numbers before/after)
      const regex = new RegExp(`\\b${escapedWord}\\b`, 'i');
      return regex.test(lowerText);
    });
  };

  const validateField = (field: string, value: string): string => {
    switch (field) {
      case 'firstName':
        if (value.length === 0) return '';
        if (value.length > 50) return 'Too long (max 50)';
        if (containsProfanity(value)) return 'Inappropriate language';
        return '';
      case 'lastName':
        if (value.length === 0) return '';
        if (value.length > 50) return 'Too long (max 50)';
        if (containsProfanity(value)) return 'Inappropriate language';
        return '';
      case 'email':
        if (value.length === 0) return '';
        if (!validateEmail(value)) {
          const suggestion = suggestEmailCorrection(value);
          if (suggestion) {
            return `Did you mean ${suggestion}?`;
          }
          return 'Invalid email format';
        }
        return '';
      case 'password':
        if (value.length === 0) return '';
        if (value.length < 6) return 'Min 6 characters';
        return '';
      case 'confirmPassword':
        if (value.length === 0) return '';
        if (value !== formData.password) return 'Passwords do not match';
        return '';
      default:
        return '';
    }
  };

  const isFieldValid = (field: string, value: string): boolean | null => {
    if (value.length === 0) return null; // Not yet entered
    return validateField(field, value) === '';
  };

  const validateForm = (): string | null => {
    if (formData.firstName.length < 1 || formData.firstName.length > 50) {
      return 'First name must be 1-50 characters';
    }
    if (containsProfanity(formData.firstName)) {
      return 'First name contains inappropriate language';
    }
    if (formData.lastName.length < 1 || formData.lastName.length > 50) {
      return 'Last name must be 1-50 characters';
    }
    if (containsProfanity(formData.lastName)) {
      return 'Last name contains inappropriate language';
    }
    if (!validateEmail(formData.email)) {
      return 'Please enter a valid email address';
    }
    if (formData.password.length < 6) {
      return 'Password must be at least 6 characters';
    }
    if (formData.password !== formData.confirmPassword) {
      return 'Passwords do not match';
    }
    if (!formData.state) {
      return 'Please select your home state';
    }
    if (!acceptTerms) {
      return 'You must accept the Terms of Service and Privacy Policy';
    }
    if (!gender) {
      return 'Please select your gender';
    }
    if (!ethnicity) {
      return 'Please select your ethnicity';
    }
    if (!dateOfBirth) {
      return 'Please enter your date of birth';
    }
    // Validate age >= 18
    const dob = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    if (age < 18) {
      return 'You must be at least 18 years old to register';
    }
    if (!avatar) {
      return 'Please select an avatar (preset or upload)';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Client-side validation
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);

    try {
      // Call registration API
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
          state: formData.state,
          gender: gender,
          ethnicity: ethnicity,
          dateOfBirth: dateOfBirth,
          // Optional avatar payload (backend may ignore if unsupported)
          avatar: avatar ? {
            type: avatar.type,
            imageUrl: avatar.imageUrl,
            portraitId: avatar.portraitId,
            uploadUrl: avatar.uploadUrl,
          } : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Registration failed');
        setIsLoading(false);
        return;
      }

      // Success - show animation then redirect to /login with success message
      localStorage.removeItem('registrationFormData');
      setShowSuccess(true);
      
      setTimeout(() => {
        router.push('/login?success=Account created');
        router.refresh();
      }, 1200);
    } catch (err) {
      setError('An error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-white/10">
        <CardBody className="gap-6 p-8">
          {/* Global Error Banner (query param sourced or validation) */}
          {error && !showSuccess && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
              <p className="text-red-400 text-sm font-medium">{error}</p>
            </div>
          )}
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-emerald-100 to-emerald-200 bg-clip-text text-transparent">
              Create Account
            </h1>
            <p className="text-slate-400">
              Join the business empire today
            </p>
          </div>

          <Divider className="bg-white/10" />

          {/* Success Animation */}
          {showSuccess && (
            <div className="text-center space-y-3 py-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 animate-pulse">
                <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-emerald-400 font-semibold text-lg">Account Created Successfully!</p>
              <p className="text-slate-400 text-sm">Redirecting to your dashboard...</p>
            </div>
          )}

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-4" style={{ display: showSuccess ? 'none' : 'block' }}>
            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Input
                  type="text"
                  placeholder="First Name"
                  value={formData.firstName}
                  onValueChange={handleChange('firstName')}
                  isRequired
                  variant="bordered"
                  color={isFieldValid('firstName', formData.firstName) === false ? 'danger' : isFieldValid('firstName', formData.firstName) === true ? 'success' : 'default'}
                  errorMessage={validateField('firstName', formData.firstName)}
                  disabled={isLoading}
                  aria-label="First Name"
                  autoComplete="given-name"
                  classNames={{
                    input: 'text-white',
                    inputWrapper: 'border-white/20 bg-slate-900/50 hover:border-emerald-400/50 data-[focus=true]:border-emerald-400',
                  }}
                />
                <div className="text-xs text-slate-500 text-right">{formData.firstName.length}/50</div>
              </div>
              
              <div className="space-y-1">
                <Input
                  type="text"
                  placeholder="Last Name"
                  value={formData.lastName}
                  onValueChange={handleChange('lastName')}
                  isRequired
                  variant="bordered"
                  color={isFieldValid('lastName', formData.lastName) === false ? 'danger' : isFieldValid('lastName', formData.lastName) === true ? 'success' : 'default'}
                  errorMessage={validateField('lastName', formData.lastName)}
                  disabled={isLoading}
                  aria-label="Last Name"
                  autoComplete="family-name"
                  classNames={{
                    input: 'text-white',
                    inputWrapper: 'border-white/20 bg-slate-900/50 hover:border-emerald-400/50 data-[focus=true]:border-emerald-400',
                  }}
                />
                <div className="text-xs text-slate-500 text-right">{formData.lastName.length}/50</div>
              </div>
            </div>


            {/* Email with Autocomplete */}
            <div className="space-y-1 relative">
              <Input
                type="email"
                placeholder="Email"
                value={formData.email}
                onValueChange={handleChange('email')}
                isRequired
                variant="bordered"
                color={isFieldValid('email', formData.email) === false ? 'danger' : isFieldValid('email', formData.email) === true ? 'success' : 'default'}
                errorMessage={validateField('email', formData.email)}
                disabled={isLoading}
                aria-label="Email Address"
                autoComplete="email"
                classNames={{
                  input: 'text-white [&:-webkit-autofill]:[-webkit-text-fill-color:white_!important] [&:-webkit-autofill]:[-webkit-box-shadow:0_0_0px_1000px_#1e293b_inset_!important] [&:-webkit-autofill]:[transition:background-color_5000s_ease-in-out_0s] [&:-webkit-autofill:hover]:[-webkit-text-fill-color:white_!important] [&:-webkit-autofill:hover]:[-webkit-box-shadow:0_0_0px_1000px_#1e293b_inset_!important] [&:-webkit-autofill:focus]:[-webkit-text-fill-color:white_!important] [&:-webkit-autofill:focus]:[-webkit-box-shadow:0_0_0px_1000px_#1e293b_inset_!important]',
                  inputWrapper: 'border-white/20 bg-slate-900/50 hover:border-emerald-400/50 data-[focus=true]:border-emerald-400',
                }}
              />
              
              {/* Email Domain Suggestions */}
              {emailSuggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-slate-800 border border-white/20 rounded-lg overflow-hidden shadow-lg">
                  {emailSuggestions.map((suggestion, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, email: suggestion }));
                        setEmailSuggestions([]);
                      }}
                      className="w-full px-4 py-2 text-left text-white hover:bg-emerald-600/20 transition-colors text-sm"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>


            {/* Password with Strength Indicator */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={formData.password}
                  onValueChange={handleChange('password')}
                  onKeyDown={handleCapsLockCheck}
                  onKeyUp={handleCapsLockCheck}
                  isRequired
                  variant="bordered"
                  color={isFieldValid('password', formData.password) === false ? 'danger' : isFieldValid('password', formData.password) === true ? 'success' : 'default'}
                  errorMessage={validateField('password', formData.password)}
                  disabled={isLoading}
                  aria-label="Password"
                  autoComplete="new-password"
                  endContent={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="focus:outline-none text-slate-400 hover:text-white transition-colors"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  }
                  classNames={{
                    input: 'text-white [&:-webkit-autofill]:[-webkit-text-fill-color:white_!important] [&:-webkit-autofill]:[-webkit-box-shadow:0_0_0px_1000px_#1e293b_inset_!important] [&:-webkit-autofill]:[transition:background-color_5000s_ease-in-out_0s] [&:-webkit-autofill:hover]:[-webkit-text-fill-color:white_!important] [&:-webkit-autofill:hover]:[-webkit-box-shadow:0_0_0px_1000px_#1e293b_inset_!important] [&:-webkit-autofill:focus]:[-webkit-text-fill-color:white_!important] [&:-webkit-autofill:focus]:[-webkit-box-shadow:0_0_0px_1000px_#1e293b_inset_!important]',
                    inputWrapper: 'border-white/20 bg-slate-900/50 hover:border-emerald-400/50 data-[focus=true]:border-emerald-400',
                  }}
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={handleGeneratePassword}
                  className="bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 border border-emerald-600/30"
                  disabled={isLoading}
                >
                  Generate
                </Button>
              </div>
              
              {/* Caps Lock Warning */}
              {capsLockOn && (
                <div className="flex items-center gap-2 text-yellow-400 text-xs">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>Caps Lock is on</span>
                </div>
              )}
              
              {/* Password Strength Indicator */}
              {formData.password.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          passwordStrength === 'weak' ? 'w-1/3 bg-red-500' :
                          passwordStrength === 'medium' ? 'w-2/3 bg-yellow-500' :
                          passwordStrength === 'strong' ? 'w-full bg-emerald-500' :
                          'w-0'
                        }`}
                      />
                    </div>
                    <span className={`text-xs font-medium ${
                      passwordStrength === 'weak' ? 'text-red-400' :
                      passwordStrength === 'medium' ? 'text-yellow-400' :
                      passwordStrength === 'strong' ? 'text-emerald-400' :
                      'text-slate-400'
                    }`}>
                      {passwordStrength === 'weak' ? 'Weak' :
                       passwordStrength === 'medium' ? 'Medium' :
                       passwordStrength === 'strong' ? 'Strong' : ''}
                    </span>
                  </div>
                  
                  {/* Password Requirements Checklist */}
                  <div className="text-xs space-y-1 text-slate-400">
                    <div className={formData.password.length >= 6 ? 'text-emerald-400' : ''}>
                      {formData.password.length >= 6 ? '✓' : '○'} {formData.password.length}/6 characters minimum
                    </div>
                    <div className={formData.password.length >= 8 ? 'text-emerald-400' : ''}>
                      {formData.password.length >= 8 ? '✓' : '○'} 8+ characters (recommended)
                    </div>
                    <div className={/[a-z]/.test(formData.password) && /[A-Z]/.test(formData.password) ? 'text-emerald-400' : ''}>
                      {/[a-z]/.test(formData.password) && /[A-Z]/.test(formData.password) ? '✓' : '○'} Upper & lowercase letters
                    </div>
                    <div className={/[0-9]/.test(formData.password) ? 'text-emerald-400' : ''}>
                      {/[0-9]/.test(formData.password) ? '✓' : '○'} Contains a number
                    </div>
                  </div>
                </div>
              )}
            </div>


            <Input
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onValueChange={handleChange('confirmPassword')}
              onKeyDown={handleCapsLockCheck}
              onKeyUp={handleCapsLockCheck}
              isRequired
              variant="bordered"
              color={isFieldValid('confirmPassword', formData.confirmPassword) === false ? 'danger' : isFieldValid('confirmPassword', formData.confirmPassword) === true ? 'success' : 'default'}
              errorMessage={validateField('confirmPassword', formData.confirmPassword)}
              disabled={isLoading}
              aria-label="Confirm Password"
              autoComplete="new-password"
              description={
                formData.confirmPassword.length > 0 && formData.confirmPassword === formData.password 
                  ? <span className="text-emerald-400 text-xs">✓ Passwords match</span>
                  : undefined
              }
              endContent={
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="focus:outline-none text-slate-400 hover:text-white transition-colors"
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              }
              classNames={{
                input: 'text-white [&:-webkit-autofill]:[-webkit-text-fill-color:white_!important] [&:-webkit-autofill]:[-webkit-box-shadow:0_0_0px_1000px_#1e293b_inset_!important] [&:-webkit-autofill]:[transition:background-color_5000s_ease-in-out_0s] [&:-webkit-autofill:hover]:[-webkit-text-fill-color:white_!important] [&:-webkit-autofill:hover]:[-webkit-box-shadow:0_0_0px_1000px_#1e293b_inset_!important] [&:-webkit-autofill:focus]:[-webkit-text-fill-color:white_!important] [&:-webkit-autofill:focus]:[-webkit-box-shadow:0_0_0px_1000px_#1e293b_inset_!important]',
                inputWrapper: 'border-white/20 bg-slate-900/50 hover:border-emerald-400/50 data-[focus=true]:border-emerald-400',
              }}
            />
            
            {/* State Selection */}
            <div className="space-y-3">
              {suggestedState && !formData.state && (
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <p className="text-emerald-400 text-sm mb-2">📍 Detected location</p>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setFormData(prev => ({ ...prev, state: suggestedState }))}
                    className="bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 border border-emerald-600/30"
                  >
                    Use {suggestedState}
                  </Button>
                </div>
              )}
              
              <StateSelector
                value={formData.state}
                onChange={handleStateChange}
                required
              />
              
              {/* Show perk panel when state selected */}
              {formData.state && (
                <StatePerkPanel stateAbbr={formData.state} />
              )}
            </div>

            {/* Terms of Service Checkbox */}
              {/* Appearance: Gender, Ethnicity, Avatar Selection */}
              <div className="space-y-4">
                <p className="text-sm text-slate-300">Appearance</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400">Gender</label>
                    <select
                      className="w-full rounded-md bg-slate-900/50 border border-white/20 px-3 py-2 text-white"
                      value={gender ?? ''}
                      onChange={(e) => setGender((e.target.value || null) as Gender | null)}
                      required
                    >
                      <option value="">Select gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400">Ethnicity</label>
                    <select
                      className="w-full rounded-md bg-slate-900/50 border border-white/20 px-3 py-2 text-white"
                      value={ethnicity ?? ''}
                      onChange={(e) => setEthnicity((e.target.value || null) as Ethnicity | null)}
                      required
                    >
                      <option value="">Select ethnicity</option>
                      <option value="White">White</option>
                      <option value="Black">Black</option>
                      <option value="Asian">Asian</option>
                      <option value="Hispanic">Hispanic</option>
                      <option value="Native American">Native American</option>
                      <option value="Middle Eastern">Middle Eastern</option>
                      <option value="Pacific Islander">Pacific Islander</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
                <AvatarSelector
                  selectedGender={gender ?? 'Male'}
                  selectedEthnicity={ethnicity ?? undefined}
                  currentAvatar={avatar ?? undefined}
                  onAvatarChange={setAvatar}
                />
                {/* Date of Birth */}
                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Date of Birth</label>
                  <input
                    type="date"
                    className="w-full rounded-md bg-slate-900/50 border border-white/20 px-3 py-2 text-white"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    aria-label="Date of Birth"
                    max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                    required
                  />
                  <p className="text-xs text-slate-500">Must be 18 years or older</p>
                </div>
              </div>

              {/* Terms of Service Checkbox */}
            <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/50 border border-white/10">
              <input
                type="checkbox"
                id="acceptTerms"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="mt-1 w-4 h-4 rounded border-white/20 bg-slate-900/50 text-emerald-600 focus:ring-emerald-500 focus:ring-offset-0"
              />
              <label htmlFor="acceptTerms" className="text-sm text-slate-300 flex-1">
                I agree to the{' '}
                <button
                  type="button"
                  onClick={() => setShowTOS(true)}
                  className="text-emerald-400 hover:text-emerald-300 underline cursor-pointer"
                >
                  Terms of Service
                </button>
                {' '}and{' '}
                <button
                  type="button"
                  onClick={() => setShowPrivacy(true)}
                  className="text-emerald-400 hover:text-emerald-300 underline cursor-pointer"
                >
                  Privacy Policy
                </button>
              </label>
            </div>

            {/* (Error banner moved to top for visibility) */}

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 transition-all duration-300"
              size="lg"
              isLoading={isLoading}
              disabled={
                !acceptTerms ||
                !formData.firstName ||
                !formData.lastName ||
                !formData.email ||
                !formData.password ||
                !formData.confirmPassword ||
                formData.password !== formData.confirmPassword ||
                !formData.state ||
                !gender ||
                !ethnicity ||
                !dateOfBirth ||
                !avatar
              }
            >
              Create Account
            </Button>
            
            <p className="text-center text-xs text-slate-500">Press Enter to submit</p>
          </form>

          <Divider className="bg-white/10" />

          {/* Login Link */}
          <div className="text-center">
            <p className="text-slate-300 text-sm">
              Already have an account?{' '}
              <Link 
                href="/login" 
                className="text-emerald-400 hover:text-emerald-300 transition-colors font-medium"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </CardBody>
      </Card>

      {/* Legal Document Modals */}
      <TermsOfServiceModal isOpen={showTOS} onClose={() => setShowTOS(false)} />
      <PrivacyPolicyModal isOpen={showPrivacy} onClose={() => setShowPrivacy(false)} />
    </div>
  );
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. **Enhanced Fields**: firstName, lastName, state added to registration
 * 2. **State Selection**: StateSelector component with search functionality
 * 3. **Perk Display**: StatePerkPanel shows when state selected
 * 4. **Validation**: Client-side validation includes all new fields
 * 5. **Auto Sign-In**: Automatically signs in user after registration
 * 6. **Error Handling**: Displays specific error messages
 * 7. **Security**: Password hashing handled server-side
 * 8. **UX**: Loading states prevent double submission
 * 9. **Premium UI**: Emerald gradient matching success theme
 * 10. **Strategic Choice**: State perks help users make informed decision
 * 
 * VALIDATION RULES:
 * - First Name: 1-50 characters
 * - Last Name: 1-50 characters
 * - Username: 3-30 characters
 * - Email: Valid email format
 * - Password: Minimum 6 characters
 * - Password confirmation must match
 * - State: Required, must be valid StateAbbreviation
 */

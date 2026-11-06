/**
 * CONTROLLER: Oceanic Marine Login Business Logic & Authentication Handler
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext.js';
import { 
  LoginRole, 
  validateLoginInput, 
  DEFAULT_PRESET_CREDENTIALS,
  loadRememberedUser,
  saveRememberedUser,
  clearRememberedUser
} from '../model/loginModel.js';

export function useLoginController() {
  const { login, quickLogin, isLoading: authLoading } = useAuth();

  const [activeRole, setActiveRole] = useState<LoginRole>('admin');
  const [identifier, setIdentifier] = useState(DEFAULT_PRESET_CREDENTIALS.admin.identifier);
  const [password, setPassword] = useState(DEFAULT_PRESET_CREDENTIALS.admin.password);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize from saved credentials or default role
  useEffect(() => {
    const saved = loadRememberedUser();
    if (saved) {
      setActiveRole(saved.role);
      setIdentifier(saved.identifier);
      setPassword(DEFAULT_PRESET_CREDENTIALS[saved.role].password);
      setRememberMe(true);
    }
  }, []);

  // When switching between Admin and Manager tabs
  const switchRole = (newRole: LoginRole) => {
    setActiveRole(newRole);
    setErrorMsg(null);
    setIdentifier(DEFAULT_PRESET_CREDENTIALS[newRole].identifier);
    setPassword(DEFAULT_PRESET_CREDENTIALS[newRole].password);
  };

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(prev => !prev);
  };

  // Execute login action
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const validation = validateLoginInput(identifier, password);
    if (!validation.isValid) {
      setErrorMsg(validation.errorMessage || 'Invalid credentials');
      return;
    }

    setIsSubmitting(true);
    try {
      if (rememberMe) {
        saveRememberedUser({ identifier: identifier.trim(), role: activeRole });
      } else {
        clearRememberedUser();
      }

      await login(identifier.trim(), password);
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick preset click for instant test sign-in
  const handleDirectPresetLogin = async (role: LoginRole) => {
    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      await quickLogin(role);
    } catch (err: any) {
      setErrorMsg(err.message || 'Direct sign-in failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    activeRole,
    identifier,
    password,
    showPassword,
    rememberMe,
    errorMsg,
    isLoading: authLoading || isSubmitting,
    setIdentifier,
    setPassword,
    setRememberMe,
    switchRole,
    togglePasswordVisibility,
    handleSubmit,
    handleDirectPresetLogin
  };
}

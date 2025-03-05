import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import Toast from './Toast';
import { Lock, Mail, Eye, EyeOff } from 'lucide-react';

const Login = ({ setIsAuthenticated }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, email, password);
        console.log('Bruker registrert');
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        console.log('Bruker logget inn');
      }
      
      setIsAuthenticated(true);
      navigate('/');
    } catch (error) {
      console.error('Auth error:', error);
      // Mer brukervennlige feilmeldinger
      switch (error.code) {
        case 'auth/email-already-in-use':
          setError('En bruker med denne e-postadressen eksisterer allerede');
          break;
        case 'auth/invalid-email':
          setError('Ugyldig e-postadresse');
          break;
        case 'auth/operation-not-allowed':
          setError('E-post/passord innlogging er ikke aktivert');
          break;
        case 'auth/weak-password':
          setError('Passordet er for svakt');
          break;
        case 'auth/user-not-found':
        case 'auth/wrong-password':
          setError('Feil e-post eller passord');
          break;
        default:
          setError('En feil oppstod. Prøv igjen senere.');
      }
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Skriv inn e-postadressen din først');
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      setToastMessage('E-post med tilbakestilling av passord er sendt');
      setShowToast(true);
      setError('');
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        setError('Finner ingen bruker med denne e-postadressen');
      } else {
        setError('Kunne ikke sende e-post for tilbakestilling av passord');
      }
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      {showToast && (
        <Toast 
          message={toastMessage} 
          onClose={() => setShowToast(false)} 
        />
      )}
      
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-xl">
        <div className="flex flex-col items-center justify-center">
          <img 
            src="/Logolean.png" 
            alt="ICE Meeting Logo" 
            className="h-16 w-auto mb-4" 
          />
          <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">
            ICE-Møte
          </h1>
          <h2 className="text-xl font-medium text-center text-gray-600 mb-6">
            {isRegistering ? 'Registrer ny konto' : 'Logg inn for å fortsette'}
          </h2>
          {error && (
            <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-center text-sm text-red-600">
                {error}
              </p>
            </div>
          )}
        </div>
        
        <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md space-y-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail size={18} className="text-gray-400" />
              </div>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="appearance-none rounded-lg relative block w-full pl-10 pr-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="E-post"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock size={18} className="text-gray-400" />
              </div>
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                required
                className="appearance-none rounded-lg relative block w-full pl-10 pr-10 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Passord"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={togglePasswordVisibility}
              >
                {showPassword ? (
                  <EyeOff size={18} className="text-gray-400 hover:text-gray-600" />
                ) : (
                  <Eye size={18} className="text-gray-400 hover:text-gray-600" />
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end">
            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors"
            >
              Glemt passord?
            </button>
          </div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors shadow-md"
            >
              {isRegistering ? 'Registrer' : 'Logg inn'}
            </button>
          </div>
        </form>
        
        <div className="mt-6 pt-6 border-t border-gray-200 text-center">
          <button
            onClick={() => setIsRegistering(!isRegistering)}
            className="text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors"
          >
            {isRegistering 
              ? 'Har du allerede en konto? Logg inn' 
              : 'Ny bruker? Registrer deg'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login; 
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import Toast from './Toast';

const Login = ({ setIsAuthenticated }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      {showToast && (
        <Toast 
          message={toastMessage} 
          onClose={() => setShowToast(false)} 
        />
      )}
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
        <div>
          <h2 className="text-center text-3xl font-bold text-gray-900">
            {isRegistering ? 'Registrer ny konto' : 'Logg inn på ICE Meeting'}
          </h2>
          {error && (
            <p className="mt-2 text-center text-sm text-red-600">
              {error}
            </p>
          )}
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="email" className="sr-only">E-post</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="E-post"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Passord</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Passord"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-sm font-medium text-blue-600 hover:text-blue-500"
            >
              Glemt passord?
            </button>
          </div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {isRegistering ? 'Registrer' : 'Logg inn'}
            </button>
          </div>
        </form>
        
        <div className="text-center">
          <button
            onClick={() => setIsRegistering(!isRegistering)}
            className="text-sm text-blue-600 hover:text-blue-500"
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
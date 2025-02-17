import React, { useEffect, useState } from 'react';
import { CheckCircle } from 'lucide-react';

function Toast({ message, onClose }) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const fadeTimeout = setTimeout(() => {
      setIsVisible(false);
    }, 1000);

    const closeTimeout = setTimeout(() => {
      onClose();
    }, 1300); // Venter litt lengre enn fade-out for å sikre at animasjonen er ferdig

    return () => {
      clearTimeout(fadeTimeout);
      clearTimeout(closeTimeout);
    };
  }, [onClose]);

  return (
    <div className={`fixed top-4 right-4 z-50 transition-all duration-300 ${
      isVisible 
        ? 'opacity-100 translate-y-0' 
        : 'opacity-0 -translate-y-2'
    }`}>
      <div className="bg-green-100 border border-green-200 text-green-800 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2">
        <CheckCircle className="h-5 w-5" />
        <p className="font-medium">{message}</p>
      </div>
    </div>
  );
}

export default Toast; 
import React from 'react';
import { AlertTriangle } from 'lucide-react';

function ConfirmDialog({ isOpen, onClose, onConfirm, title, message }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4 animate-fade-in">
        <div className="flex items-start mb-4">
          <div className="flex-shrink-0">
            <AlertTriangle className="h-6 w-6 text-yellow-500" />
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-medium text-gray-900">
              {title}
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              {message}
            </p>
          </div>
        </div>
        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Nei, gå tilbake
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Ja, lagre endringer
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog; 
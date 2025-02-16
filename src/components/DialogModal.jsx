import { XCircle } from 'lucide-react';

function DialogModal({ isOpen, onClose, onSave, title, message, confirmText = 'OK', cancelText = 'Avbryt' }) {
  if (!isOpen) return null;

  const handleSave = () => {
    if (onSave) {
      onSave();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XCircle size={20} />
          </button>
        </div>
        
        <div className="p-4">
          <p className="text-gray-600">{message}</p>
        </div>
        
        <div className="flex justify-end gap-3 p-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            {cancelText}
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600 transition-colors"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default DialogModal; 
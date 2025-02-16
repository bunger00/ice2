import { Dialog } from '@headlessui/react';
import { X } from 'lucide-react';

function DialogModal({ isOpen, onClose, title, message, buttons, autoClose }) {
  // Hvis autoClose er true, ikke vis noen knapper
  const dialogButtons = autoClose ? [] : (buttons || [
    {
      text: "OK",
      onClick: onClose,
      primary: true
    }
  ]);

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      className="relative z-50"
    >
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-sm rounded-lg bg-white p-6 shadow-xl">
          <div className="flex justify-between items-center mb-4">
            <Dialog.Title className="text-lg font-medium">
              {title}
            </Dialog.Title>
            {!autoClose && (
              <button 
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            )}
          </div>
          
          <p className="text-gray-600 mb-6">
            {message}
          </p>
          
          {!autoClose && (
            <div className="flex flex-col gap-2">
              {dialogButtons.map((button, index) => (
                <button
                  key={index}
                  onClick={button.onClick}
                  className={`px-4 py-2 rounded-md text-sm transition-colors ${
                    button.primary
                      ? 'bg-blue-500 text-white hover:bg-blue-600'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                  }`}
                >
                  {button.text}
                </button>
              ))}
            </div>
          )}
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}

export default DialogModal; 
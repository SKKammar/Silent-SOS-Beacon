
import React from 'react';
import { Contact } from '../types';
import { TrashIcon, UserIcon } from './icons/IconComponents';

interface ContactListProps {
  contacts: Contact[];
  onDelete: (id: string) => void;
}

const ContactList: React.FC<ContactListProps> = ({ contacts, onDelete }) => {
  if (contacts.length === 0) {
    return <div className="text-center text-gray-400 py-10">No contacts added yet.</div>;
  }

  return (
    <ul className="space-y-3">
      {contacts.map((contact) => (
        <li
          key={contact.id}
          className="flex items-center justify-between bg-gray-700 p-3 rounded-lg shadow"
        >
          <div className="flex items-center">
            <div className="p-2 bg-gray-600 rounded-full mr-3">
              <UserIcon className="w-5 h-5 text-gray-300" />
            </div>
            <div>
              <p className="font-semibold text-white">{contact.name}</p>
              <p className="text-sm text-gray-400">{contact.phone}</p>
            </div>
          </div>
          <button
            onClick={() => onDelete(contact.id)}
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-gray-600 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
            aria-label={`Delete ${contact.name}`}
          >
            <TrashIcon className="w-5 h-5" />
          </button>
        </li>
      ))}
    </ul>
  );
};

export default ContactList;

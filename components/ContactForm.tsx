
import React, { useState } from 'react';
import { Contact } from '../types';
import { PlusIcon } from './icons/IconComponents';

interface ContactFormProps {
  onAdd: (contact: Omit<Contact, 'id'>) => void;
}

const ContactForm: React.FC<ContactFormProps> = ({ onAdd }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && phone.trim()) {
      onAdd({ name, phone });
      setName('');
      setPhone('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-gray-900 rounded-lg">
      <h2 className="text-lg font-semibold text-gray-300 mb-3">Add New Contact</h2>
      <div className="space-y-3">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
          className="w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          required
        />
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Phone Number"
          className="w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          required
        />
      </div>
      <button
        type="submit"
        className="mt-4 w-full flex items-center justify-center px-4 py-2 bg-indigo-600 text-white font-bold rounded-md hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-indigo-500 disabled:bg-gray-500"
        disabled={!name.trim() || !phone.trim()}
      >
        <PlusIcon className="w-5 h-5 mr-2" />
        Add Contact
      </button>
    </form>
  );
};

export default ContactForm;

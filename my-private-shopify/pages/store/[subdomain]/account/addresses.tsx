import React from 'react';

const AddressesPage: React.FC = () => {
  // Placeholder for saved addresses management
  // In a real app, fetch and manage addresses from your backend (Supabase)
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">My Addresses</h1>
      {/* TODO: List, add, and remove saved addresses */}
      <div className="bg-white rounded shadow p-6">
        <p>No saved addresses. Add your shipping addresses for faster checkout.</p>
      </div>
    </div>
  );
};

export default AddressesPage;

import React from 'react';
import { withAuth } from '@/lib/withAuth';
import Link from 'next/link';
import { useRouter } from 'next/router';

function CollectionsPage() {
  const router = useRouter();
  const { subdomain } = router.query;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Collections</h1>
        <p className="mb-4 text-gray-600">This is the collections management page. Here you will be able to create, edit, and manage product collections for your store.</p>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-500">No collections yet. This page is under construction.</p>
        </div>
        <div className="mt-8">
          <Link href={`/store/${subdomain}/admin/dashboard`} className="text-blue-600 hover:underline">&larr; Back to Dashboard</Link>
        </div>
      </div>
    </div>
  );
}

export default withAuth(CollectionsPage);

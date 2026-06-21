import React from 'react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar - TODO: Create sidebar component */}
      <aside className="w-64 bg-white shadow">
        <nav className="p-4">
          <h1 className="text-2xl font-bold mb-8">Member System</h1>
          {/* Navigation items */}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {/* Header - TODO: Create header component */}
        <header className="bg-white shadow">
          <div className="px-6 py-4">
            {/* Header content */}
          </div>
        </header>

        {/* Page content */}
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}

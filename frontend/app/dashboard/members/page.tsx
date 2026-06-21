'use client';

import { useMembers } from '@/hooks/useMembers';

export default function MembersPage() {
  const { data, isLoading, error } = useMembers({ page: 1, limit: 20 });

  if (isLoading) return <div>Loading members...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Members</h1>

      {/* Members table - TODO: Create reusable table component */}
      <div className="bg-white rounded-lg shadow">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="px-6 py-3 text-left">Name</th>
              <th className="px-6 py-3 text-left">Email</th>
              <th className="px-6 py-3 text-left">Phone</th>
              <th className="px-6 py-3 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {data?.data.map((member) => (
              <tr key={member.id} className="border-b hover:bg-gray-50">
                <td className="px-6 py-3">
                  {member.firstName} {member.lastName}
                </td>
                <td className="px-6 py-3">{member.email}</td>
                <td className="px-6 py-3">{member.phone}</td>
                <td className="px-6 py-3">{member.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination - TODO: Create pagination component */}
      {data && (
        <div className="mt-4 flex justify-between items-center">
          <p>
            Total: {data.total} | Page: {data.page} of {data.totalPages}
          </p>
        </div>
      )}
    </div>
  );
}

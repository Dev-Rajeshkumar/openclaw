import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Forms — Dashboard',
};

const mockForms = [
  { id: '1', name: 'Contact Form', slug: 'contact', responses: 42, createdAt: '2024-12-01' },
  { id: '2', name: 'Feedback Survey', slug: 'feedback', responses: 18, createdAt: '2025-01-05' },
  { id: '3', name: 'Newsletter Signup', slug: 'newsletter-signup', responses: 312, createdAt: '2024-11-15' },
];

const mockResponses = [
  { id: '1', formName: 'Contact Form', data: { name: 'John Doe', email: 'john@example.com', message: 'Great platform!' }, submittedAt: '2025-01-15T10:30:00Z' },
  { id: '2', formName: 'Contact Form', data: { name: 'Jane Smith', email: 'jane@example.com', message: 'I have a question about pricing.' }, submittedAt: '2025-01-14T14:22:00Z' },
  { id: '3', formName: 'Feedback Survey', data: { name: 'Bob', rating: 5, comment: 'Love the new features!' }, submittedAt: '2025-01-13T09:15:00Z' },
];

export default function FormsPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Forms</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Build forms, collect responses, and export data
          </p>
        </div>
        <button className="btn-primary">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Form
        </button>
      </div>

      {/* Form Builder / List */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Form List */}
        <div className="lg:col-span-1 space-y-3">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Your Forms</h2>
          {mockForms.map((form) => (
            <div key={form.id} className="card p-4 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">{form.name}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">/{form.slug}</p>
                </div>
                <span className="text-xs bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 px-2 py-0.5 rounded-full">
                  {form.responses} responses
                </span>
              </div>
              <div className="flex gap-2 mt-3">
                <Link href={`/dashboard/forms/${form.id}`} className="text-xs text-primary-600 hover:underline">Edit</Link>
                <Link href={`/dashboard/forms/${form.id}/responses`} className="text-xs text-primary-600 hover:underline">Responses</Link>
                <button className="text-xs text-gray-500 hover:text-red-600">Delete</button>
              </div>
            </div>
          ))}

          {/* Create New Form Card */}
          <div className="card p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 text-center hover:border-primary-400 dark:hover:border-primary-500 transition-colors cursor-pointer">
            <svg className="w-8 h-8 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Create New Form</p>
            <p className="text-xs text-gray-400 mt-1">Drag & drop builder</p>
          </div>
        </div>

        {/* Form Builder / Responses */}
        <div className="lg:col-span-2 space-y-6">
          {/* Drag-and-Drop Builder Preview */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold mb-4">Form Builder</h2>
            <p className="text-sm text-gray-500 mb-4">Drag fields from the sidebar to build your form.</p>

            <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg p-8 min-h-[200px] flex items-center justify-center">
              <div className="text-center">
                <svg className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-gray-400 text-sm">Drop form fields here</p>
                <p className="text-gray-300 dark:text-gray-600 text-xs mt-1">or click a form to edit it</p>
              </div>
            </div>

            {/* Field Palette */}
            <div className="mt-4">
              <p className="text-xs font-medium text-gray-500 mb-2">Available Fields</p>
              <div className="flex flex-wrap gap-2">
                {['Text', 'Email', 'Textarea', 'Select', 'Checkbox', 'Radio', 'File Upload', 'Date'].map((field) => (
                  <span key={field} className="px-3 py-1.5 text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-md border border-gray-200 dark:border-gray-700 cursor-grab hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                    {field}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Responses */}
          <div className="card overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Recent Responses</h2>
              <button className="btn-ghost text-xs">
                <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export CSV
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <th className="text-left py-2 px-4 font-medium text-gray-500">Form</th>
                    <th className="text-left py-2 px-4 font-medium text-gray-500 hidden sm:table-cell">Data</th>
                    <th className="text-right py-2 px-4 font-medium text-gray-500">Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {mockResponses.map((response) => (
                    <tr key={response.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="py-2 px-4 font-medium">{response.formName}</td>
                      <td className="py-2 px-4 hidden sm:table-cell">
                        <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
                          {JSON.stringify(response.data).slice(0, 60)}...
                        </code>
                      </td>
                      <td className="py-2 px-4 text-right text-gray-500 text-xs">
                        {new Date(response.submittedAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

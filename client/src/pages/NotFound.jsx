import { Link } from 'react-router-dom';
import { FileQuestion } from 'lucide-react';
import { EmptyState } from '../components/ui.jsx';

export default function NotFound() {
  return (
    <EmptyState
      icon={FileQuestion}
      title="Page not found"
      description="The page you are looking for does not exist or has moved."
      action={
        <Link to="/dashboard" className="text-sm font-semibold text-brand-700 hover:underline">
          Back to the dashboard
        </Link>
      }
    />
  );
}

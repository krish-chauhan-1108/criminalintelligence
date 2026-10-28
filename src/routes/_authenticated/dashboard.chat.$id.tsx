import { createFileRoute } from '@tanstack/react-router';
import { ChatView } from './dashboard.chat';

export const Route = createFileRoute('/_authenticated/dashboard/chat/$id')({
  head: () => ({
    meta: [
      { title: 'Legal Chat Session TRANA' },
      { name: 'description', content: 'Statutory AI legal advisor session with verified citations.' },
      { property: 'og:title', content: 'Legal Chat Session TRANA' },
    ],
  }),
  component: ChatView,
});

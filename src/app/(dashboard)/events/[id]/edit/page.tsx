import { notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import EventEditForm from '@/components/event-edit-form';

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return notFound();
  }

  const event = await prisma.event.findUnique({
    where: {
      id,
      userId,
    },
  });

  if (!event) {
    return notFound();
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Edit Event</h1>
      <EventEditForm event={event} />
    </div>
  );
}
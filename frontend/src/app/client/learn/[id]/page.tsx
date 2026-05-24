interface LearnPageProps {
  params: { id: string };
}

export default function LearnPage({ params }: LearnPageProps) {
  return (
    <main>
      <h1>Lesson {params.id}</h1>
      <p>Mock learning viewer page.</p>
    </main>
  );
}

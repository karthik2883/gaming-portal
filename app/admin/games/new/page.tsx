import Link from 'next/link';
import GameForm from '@/components/admin/GameForm';

export default function NewGamePage() {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
        <Link href="/admin/games" className="btn btn-ghost btn-sm">← Back</Link>
        <h1 style={{ fontFamily: 'Orbitron', fontSize: 'clamp(1.1rem, 3vw, 1.6rem)' }}>
          ➕ Add New Game
        </h1>
      </div>
      <GameForm />
    </div>
  );
}

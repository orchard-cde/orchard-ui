import GroveDetailView from './GroveDetailView';

export async function generateStaticParams() {
  return [{ id: '_' }];
}

export default function GroveDetailPage() {
  return <GroveDetailView />;
}

import Link from 'next/link';
import Image from 'next/image';
import { Item, STATUS_COLORS, STATUS_LABELS } from '@/types';

interface Props {
  item: Item;
}

export function ItemCard({ item }: Props) {
  return (
    <Link href={`/items/${item.id}`}>
      <div className="flex items-center gap-3 p-3 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
        <div className="relative w-14 h-14 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
          {item.imageUrl ? (
            <Image
              src={item.imageUrl}
              alt={item.name}
              fill
              className="object-cover"
              sizes="56px"
              unoptimized
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl">
              {item.catalogue?.icon ?? '📦'}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 truncate">{item.name}</p>
          {item.author && (
            <p className="text-sm text-gray-500 truncate">{item.author}</p>
          )}
          {!item.author && item.manufacturer && (
            <p className="text-sm text-gray-500 truncate">{item.manufacturer}</p>
          )}
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-gray-400">{item.catalogue?.name}</span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[item.status]}`}
            >
              {STATUS_LABELS[item.status]}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

import type {Folder} from '../../types';
import {Icon, resolveItemIcon} from '../../ui/Icon';
import {tileClassFor} from './libraryModel';

interface FolderBannerProps {
  folder: Folder;
  size: 'hero' | 'compact';
}

const SIZE_CLASS = {
  hero: 'aspect-[16/5] max-h-56 w-full',
  compact: 'h-32 w-full md:h-36',
} as const;

/** Folder cover: the chosen image, or a generated pastel banner (tile colour + dots + big icon). */
export function FolderBanner({folder, size}: FolderBannerProps) {
  const box = `${SIZE_CLASS[size]} overflow-hidden ${size === 'compact' ? 'rounded-card' : ''}`;
  if (folder.coverImage) {
    return <img src={folder.coverImage} alt="" className={`${box} object-cover`} />;
  }
  return (
    <div aria-hidden="true" className={`relative ${box} ${tileClassFor(folder.id)}`}>
      <div
        className="absolute inset-0 text-ink opacity-[0.12]"
        style={{backgroundImage: 'radial-gradient(currentColor 1px, transparent 1.5px)', backgroundSize: '16px 16px'}}
      />
      <Icon
        name={resolveItemIcon(folder.icon, 'folder')}
        weight="duotone"
        className="absolute -bottom-4 right-6 size-28 text-ink opacity-25 md:size-32"
      />
    </div>
  );
}

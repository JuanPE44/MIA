import type {Folder} from '../../types';
import {Icon, resolveItemIcon} from '../../ui/Icon';
import {tileClassFor} from './libraryModel';

interface FolderThumbProps {
  folder: Folder;
}

/** Small rounded folder cover: the chosen image, or a tile colour with the folder icon. */
export function FolderBanner({folder}: FolderThumbProps) {
  const box = 'size-12 shrink-0 overflow-hidden rounded-control border border-rule';
  if (folder.coverImage) {
    return <img src={folder.coverImage} alt="" className={`${box} object-cover`} />;
  }
  return (
    <span aria-hidden="true" className={`flex items-center justify-center ${box} ${tileClassFor(folder.id)}`}>
      <Icon name={resolveItemIcon(folder.icon, 'folder')} weight="duotone" className="size-6 text-ink" />
    </span>
  );
}

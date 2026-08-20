import type { User } from '../../types';

interface Props {
  user: Pick<User, 'username' | 'avatarUrl' | 'isOnline'>;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

const sizes = {
  xs: 'w-7 h-7 text-xs',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
};

const dotSizes = {
  xs: 'w-2 h-2',
  sm: 'w-2 h-2',
  md: 'w-2.5 h-2.5',
  lg: 'w-3 h-3',
};

export default function Avatar({ user, size = 'md' }: Props) {
  return (
    <div className="relative flex-shrink-0">
      {user.avatarUrl ? (
        <img
          src={user.avatarUrl}
          alt={user.username}
          className={`${sizes[size]} rounded-full object-cover`}
        />
      ) : (
        <div
          className={`${sizes[size]} rounded-full bg-avatar flex items-center justify-center font-semibold text-white flex-shrink-0`}
        >
          {user.username[0].toUpperCase()}
        </div>
      )}
      {user.isOnline && (
        <span
          className={`absolute bottom-0 right-0 ${dotSizes[size]} bg-online rounded-full border-2 border-navy-950`}
        />
      )}
    </div>
  );
}
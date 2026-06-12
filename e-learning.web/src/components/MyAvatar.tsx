// hooks
import useAuth from '../hooks/useAuth';
// utils
import createAvatar from '../utils/createAvatar';
//
import Avatar, { Props as AvatarProps } from './Avatar';

// ----------------------------------------------------------------------

export default function MyAvatar({ ...other }: AvatarProps) {
  const { user } = useAuth();
  const displayName = user?.displayName || '';
  const photoURL = user?.photoURL || undefined;

  return (
    <Avatar
      src={photoURL}
      alt={displayName}
      color={photoURL ? 'default' : createAvatar(displayName).color}
      {...other}
    >
      {createAvatar(displayName).name}
    </Avatar>
  );
}

// @mui
import { Grid, Stack, Box, Typography } from '@mui/material';
// @types
import { Profile as UserProfile, UserPost } from '../../../../@types/user';
//
import ProfileAbout from './ProfileAbout';

// ----------------------------------------------------------------------

type Props = {
  myProfile: UserProfile;
};

export default function Profile({ myProfile }: Props) {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={4}>
        <Stack spacing={3}>
          <ProfileAbout profile={myProfile} />
        </Stack>
      </Grid>

      <Grid item xs={12} md={8}>
        <Stack spacing={3}>
           <Box sx={{ p: 3, bgcolor: 'background.neutral', borderRadius: 1.5, textAlign: 'center', border: '1px dashed', borderColor: 'divider' }}>
             <Typography variant="body2" sx={{ color: 'text.secondary' }}>
               Bảng tin hoạt động hiện đang trống.
             </Typography>
           </Box>
        </Stack>
      </Grid>
    </Grid>
  );
}

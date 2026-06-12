// @mui
import { styled } from '@mui/material/styles';
import { Box, Typography } from '@mui/material';
// @types
import { Profile } from '../../../../@types/user';
// utils
import cssStyles from '../../../../utils/cssStyles';
// hooks
import useAuth from '../../../../hooks/useAuth';
// components
import MyAvatar from '../../../../components/MyAvatar';
import Image from '../../../../components/Image';
import Iconify from '../../../../components/Iconify';

// ----------------------------------------------------------------------

const RootStyle = styled('div')(({ theme }) => ({
  '&:before': {
    ...cssStyles().bgBlur({ blur: 2, color: theme.palette.primary.darker }),
    top: 0,
    zIndex: 9,
    content: "''",
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
}));

const InfoStyle = styled('div')(({ theme }) => ({
  left: 0,
  right: 0,
  zIndex: 99,
  position: 'absolute',
  marginTop: theme.spacing(5),
  [theme.breakpoints.up('md')]: {
    right: 'auto',
    display: 'flex',
    alignItems: 'center',
    left: theme.spacing(3),
    bottom: theme.spacing(3),
  },
}));

// ----------------------------------------------------------------------

type Props = {
  myProfile: Profile;
};

export default function ProfileCover({ myProfile }: Props) {
  const { user } = useAuth();
    const { position, cover, quote, country, email, company, school } = myProfile;

    return (
      <RootStyle>
        <InfoStyle>
          <MyAvatar
            sx={{
              mx: 'auto',
              borderWidth: 2,
              borderStyle: 'solid',
              borderColor: 'common.white',
              width: { xs: 80, md: 128 },
              height: { xs: 80, md: 128 },
            }}
          />
          <Box
            sx={{
              ml: { md: 3 },
              mt: { xs: 1, md: 0 },
              color: 'common.white',
              textAlign: { xs: 'center', md: 'left' },
            }}
          >
            <Typography variant="h4">{user?.displayName}</Typography>
            <Typography sx={{ opacity: 0.8, mb: 1 }}>{position}</Typography>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 1 }}>
              {country && (
                <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center' }}>
                  <Iconify icon="eva:pin-fill" sx={{ mr: 0.5, width: 16, height: 16 }} />
                  {country}
                </Typography>
              )}
              {email && (
                <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center' }}>
                  <Iconify icon="eva:email-fill" sx={{ mr: 0.5, width: 16, height: 16 }} />
                  {email}
                </Typography>
              )}
              {company && (
                <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center' }}>
                  <Iconify icon="ic:round-business-center" sx={{ mr: 0.5, width: 16, height: 16 }} />
                  {company}
                </Typography>
              )}
            </Box>
          </Box>
        </InfoStyle>
        <Image
          alt="profile cover"
          src={cover}
          sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />
      </RootStyle>
    );
  }

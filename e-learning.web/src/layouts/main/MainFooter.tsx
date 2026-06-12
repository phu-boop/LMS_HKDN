// @mui
import { styled } from '@mui/material/styles';
import { Grid, Link, Divider, Container, Typography, Stack } from '@mui/material';
// routes
import { PATH_PAGE } from '../../routes/paths';
// components
import Logo from '../../components/Logo';
import SocialsButton from '../../components/SocialsButton';

// ----------------------------------------------------------------------

const LINKS = [
  {
    headline: 'Minimal',
    children: [
      { name: 'About us', href: PATH_PAGE.about },
      { name: 'Contact us', href: PATH_PAGE.contact },
      { name: 'FAQs', href: PATH_PAGE.faqs },
    ],
  },
  {
    headline: 'Legal',
    children: [
      { name: 'Terms and Condition', href: '#' },
      { name: 'Privacy Policy', href: '#' },
    ],
  },
  {
    headline: 'Contact',
    children: [
      { name: 'Hotline: 034 5274 789', href: 'tel:0345274789' },
      { name: '140 Trương Văn Bang, phường Cát Lái, TP. HCM', href: '#' },
      { name: 'Website: aigedu.vn', href: 'https://aigedu.vn/' },
    ],
  },
];

const RootStyle = styled('div')(({ theme }) => ({
  position: 'relative',
  backgroundColor: theme.palette.background.default,
}));

// ----------------------------------------------------------------------

export default function MainFooter() {
  return (
    <RootStyle>
      <Divider />

      <Container sx={{ pt: 10 }}>
        <Grid
          container
          justifyContent={{ xs: 'center', md: 'space-between' }}
          sx={{ textAlign: { xs: 'center', md: 'left' } }}
        >
          <Grid item xs={12} sx={{ mb: 3 }}>
            <Logo sx={{ mx: { xs: 'auto', md: 'inherit' } }} />
          </Grid>

          <Grid item xs={8} md={3}>
            <Typography variant="body2" sx={{ pr: { md: 5 } }}>
              Hệ thống LMS của AIG Education đóng vai trò là trục cốt lõi trong chuyển đổi số giáo dục, kết nối chặt chẽ giữa Nhà trường - Giáo viên - Học sinh.
            </Typography>

            <Stack
              direction="row"
              justifyContent={{ xs: 'center', md: 'flex-start' }}
              sx={{ mt: 5, mb: { xs: 5, md: 0 } }}
            >
              <SocialsButton sx={{ mx: 0.5 }} />
            </Stack>
          </Grid>

          <Grid item xs={12} md={7}>
            <Stack
              spacing={5}
              direction={{ xs: 'column', md: 'row' }}
              justifyContent="space-between"
            >
              {LINKS.map((list) => (
                <Stack key={list.headline} spacing={2}>
                  <Typography component="p" variant="overline">
                    {list.headline}
                  </Typography>

                  {list.children.map((link) => (
                    <Link
                      key={link.name}
                      color="inherit"
                      variant="body2"
                      href={link.href}
                      sx={{ display: 'block' }}
                    >
                      {link.name}
                    </Link>
                  ))}
                </Stack>
              ))}
            </Stack>
          </Grid>
        </Grid>

        <Typography
          component="p"
          variant="body2"
          sx={{
            mt: 10,
            pb: 5,
            fontSize: 13,
            textAlign: { xs: 'center', md: 'left' },
          }}
        >
          © 2026 CÔNG TY CỔ PHẦN ĐẦU TƯ CÔNG NGHỆ AIG VIỆT NAM. All rights reserved
        </Typography>
      </Container>
    </RootStyle>
  );
}

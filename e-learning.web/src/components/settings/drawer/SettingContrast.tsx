// @mui
import { styled } from '@mui/material/styles';
import { Grid, RadioGroup, CardActionArea } from '@mui/material';
// hooks
import useSettings from '../../../hooks/useSettings';
//
import Iconify from '../../Iconify';
import BoxMask from './BoxMask';

// ----------------------------------------------------------------------

const BoxStyle = styled(CardActionArea)(({ theme }) => ({
  height: 72,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: theme.palette.text.disabled,
  border: `solid 1px ${theme.palette.grey[500_12]}`,
  borderRadius: Number(theme.shape.borderRadius) * 1.25,
}));

// ----------------------------------------------------------------------

export default function SettingContrast() {
  const { themeContrast, onChangeContrast } = useSettings();

  return (
    <RadioGroup name="themeContrast" value={themeContrast} onChange={onChangeContrast}>
      <Grid dir="ltr" container spacing={2.5}>
        {['default', 'medium', 'bold', 'ultra'].map((contrast) => {
          const isSelected = themeContrast === contrast;

          const getIcon = (val: string) => {
            switch (val) {
              case 'medium':
                return 'mdi:contrast-circle';
              case 'bold':
                return 'ion:contrast-outline';
              case 'ultra':
                return 'mdi:contrast';
              default:
                return 'cil:contrast';
            }
          };

          return (
            <Grid key={contrast} item xs={6}>
              <BoxStyle
                sx={{
                  ...(isSelected && {
                    color: 'primary.main',
                    boxShadow: (theme) => theme.customShadows.z20,
                  }),
                }}
              >
                <Iconify
                  icon={getIcon(contrast)}
                  width={28}
                  height={28}
                />
                <BoxMask value={contrast} />
              </BoxStyle>
            </Grid>
          );
        })}
      </Grid>
    </RadioGroup>
  );
}

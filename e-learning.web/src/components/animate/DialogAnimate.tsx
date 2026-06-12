import { m, AnimatePresence } from 'framer-motion';
// @mui
import { Dialog, Box, Paper, DialogProps } from '@mui/material';
//
import { varFade } from './variants';

// ----------------------------------------------------------------------

export interface Props extends DialogProps {
  variants?: Record<string, unknown>;
  onClose?: VoidFunction;
}

export default function DialogAnimate({
  open = false,
  variants,
  onClose,
  children,
  sx,
  ...other
}: Props) {
  return (
    <AnimatePresence>
      {open && (
        <Dialog
          fullWidth
          maxWidth="xs"
          open={open}
          onClose={onClose}
          PaperComponent={(props) => {
            const defaultMotion = varFade({
              distance: 120,
              durationIn: 0.32,
              durationOut: 0.24,
              easeIn: 'easeInOut',
            }).inUp;

            return (
              <m.div
                {...((variants as any) || (defaultMotion as any))}
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Box onClick={onClose} sx={{ width: '100%', height: '100%', position: 'fixed' }} />
                <Paper sx={sx} {...props}>
                  {props.children}
                </Paper>
              </m.div>
            );
          }}
          {...other}
        >
          {children}
        </Dialog>
      )}
    </AnimatePresence>
  );
}

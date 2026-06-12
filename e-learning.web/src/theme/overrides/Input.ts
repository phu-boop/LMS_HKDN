import { Theme } from '@mui/material/styles';

// ----------------------------------------------------------------------

export default function Input(theme: Theme) {
  return {
    MuiInputBase: {
      styleOverrides: {
        root: {
          '&.Mui-disabled': {
            '& svg': { color: theme.palette.text.disabled },
          },
        },
        input: {
          '&::placeholder': {
            opacity: 1,
            color: theme.palette.text.disabled,
          },
          '&:-webkit-autofill': {
            WebkitBoxShadow: `0 0 0 1000px ${theme.palette.background.paper} inset !important`,
            WebkitTextFillColor: `${theme.palette.text.primary} !important`,
            caretColor: theme.palette.text.primary,
          },
          '&::-webkit-calendar-picker-indicator': {
            filter: theme.palette.mode === 'dark' ? 'invert(1)' : 'none',
            cursor: 'pointer',
          },
          '&::-webkit-inner-spin-button, &::-webkit-outer-spin-button': {
            WebkitAppearance: 'none',
            margin: 0,
          },
        },
      },
    },
    MuiInput: {
      styleOverrides: {
        underline: {
          '&:before': {
            borderBottomColor: theme.palette.grey[500_56],
          },
        },
      },
    },
    MuiFilledInput: {
      styleOverrides: {
        root: {
          backgroundColor: theme.palette.grey[500_12],
          '&:hover': {
            backgroundColor: theme.palette.grey[500_16],
          },
          '&.Mui-focused': {
            backgroundColor: theme.palette.action.focus,
          },
          '&.Mui-disabled': {
            backgroundColor: theme.palette.action.disabledBackground,
          },
        },
        underline: {
          '&:before': {
            borderBottomColor: theme.palette.grey[500_56],
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: theme.palette.grey[500_32],
          },
          '&.Mui-disabled': {
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: theme.palette.action.disabledBackground,
            },
          },
          '& input::-webkit-calendar-picker-indicator': {
            filter: theme.palette.mode === 'dark' ? 'invert(1)' : 'none',
            cursor: 'pointer',
          },
        },
      },
    },
  };
}

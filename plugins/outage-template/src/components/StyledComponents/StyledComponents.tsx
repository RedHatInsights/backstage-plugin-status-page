import {
  Backdrop,
  BackdropProps,
  Box,
  BoxProps,
  styled,
} from '@material-ui/core';

export const StyledBackdrop = styled((props: BackdropProps) => (
  <Backdrop {...props}>{props.children}</Backdrop>
))(({ theme }) => ({
  color: '#fff',
  zIndex: theme.zIndex.drawer + 1,
}));

export const IncidentsPageStyledBox = styled((props: BoxProps) => (
  <Box {...props} />
))(({ theme }) => ({
  width: '50%',
  minWidth: 700,
  margin: theme.spacing(3),
  padding: theme.spacing(3),
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius * 2,
  border: `1px solid`,
  borderColor: theme.palette.divider,
  paddingBottom: '3rem',
}));

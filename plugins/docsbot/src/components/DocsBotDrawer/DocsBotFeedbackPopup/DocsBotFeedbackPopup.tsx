import {
  Backdrop,
  Box,
  Button,
  Fade,
  Modal,
  TextField,
  Typography,
} from '@material-ui/core';
import React, { useState } from 'react';
import useStyles from './DocsBotFeedbackPopup.styles';

interface DocsBotFeedbackPopupProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (description: string) => void;
}

const DocsBotFeedbackPopup: React.FC<DocsBotFeedbackPopupProps> = ({
  open,
  onClose,
  onSubmit,
}) => {
  const classes = useStyles();
  const [description, setDescription] = useState<string>('');
  const charLimit = 300;

  const handleSubmit = () => {
    onSubmit(description);
    setDescription('');
    onClose();
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value.length <= charLimit) {
      setDescription(e.target.value);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      className={classes.modal}
      closeAfterTransition
      BackdropComponent={Backdrop}
      BackdropProps={{
        timeout: 500,
      }}
    >
      <Fade in={open}>
        <Box className={classes.paper}>
          <Typography variant="h6" component="h2">
            Would you like to add a description for your feedback?
          </Typography>
          <TextField
            className={classes.textarea}
            label="(Optional): Describe your feedback here"
            fullWidth
            multiline
            rows={6}
            variant="outlined"
            value={description}
            onChange={handleDescriptionChange}
          />
          <Typography className={classes.charCounter}>
            {description.length}/{charLimit}
          </Typography>
          <div className={classes.actions}>
            <Button onClick={onClose} color="primary">
              Cancel
            </Button>
            <Button onClick={handleSubmit} variant="contained" color="primary">
              Submit Feedback
            </Button>
          </div>
        </Box>
      </Fade>
    </Modal>
  );
};

export default DocsBotFeedbackPopup;

import { EntityLink } from '@backstage/catalog-model';
import {
  alertApiRef,
  IconComponent,
  useApi,
  useApp,
} from '@backstage/core-plugin-api';
import {
  ArtEntity,
  WorkstreamEntity,
} from '@compass/backstage-plugin-workstream-automation-common';
import {
  Button,
  createStyles,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  makeStyles,
  Popover,
  TextField,
  Tooltip,
  Typography,
} from '@material-ui/core';
import ExpandLessRounded from '@material-ui/icons/ExpandLessRounded';
import ExpandMoreRounded from '@material-ui/icons/ExpandMoreRounded';
import RemoveCircleOutlineOutlinedIcon from '@material-ui/icons/RemoveCircleOutlineOutlined';
import { Autocomplete } from '@material-ui/lab';
import { capitalize } from 'lodash';
import { useState } from 'react';
import {
  Control,
  Controller,
  SubmitHandler,
  useFieldArray,
  useForm,
} from 'react-hook-form';
import { artApiRef, workstreamApiRef } from '../../api';

type FormValues = {
  links: EntityLink[];
};

const useStyles = makeStyles((theme: any) => {
  return createStyles({
    paper: {
      width: '300px',
    },
    iconButton: {
      borderRight: `1px solid ${theme.palette.rhdh.general.disabledBackground}`,
      borderRadius: '4px 0 0 4px',
      marginRight: '1rem',
      height: theme.spacing(7),
      '&:hover': {
        borderRight: `1px solid ${theme.palette.rhdh.general.tableColumnTitleColor}`,
      },
    },
    textArea: {
      paddingLeft: 0,
    },
  });
});

const IconPicker = (props: {
  icons: Record<string, IconComponent>;
  control: Control<FormValues, any>;
  index: number;
}) => {
  const classes = useStyles();
  const [anchorEl, setAnchorEl] = useState(null);
  const { control, icons, index } = props;

  const handleOpen = (event: any) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const NullComponent = () => null;

  return (
    <Controller
      control={control}
      name={`links.${index as 0}.icon`}
      render={({ field: { value, onChange } }) => {
        const PlaceholderIcon = value ? icons[value] : NullComponent;
        return (
          <>
            <IconButton className={classes.iconButton} onClick={handleOpen}>
              <PlaceholderIcon fontSize="medium" />
              {anchorEl ? (
                <ExpandLessRounded
                  style={{ marginLeft: '12px' }}
                  fontSize="small"
                />
              ) : (
                <ExpandMoreRounded
                  style={{ marginLeft: '12px' }}
                  fontSize="small"
                />
              )}
            </IconButton>

            <Popover
              open={Boolean(anchorEl)}
              anchorEl={anchorEl}
              onClose={handleClose}
              classes={{ paper: classes.paper }}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'left',
              }}
            >
              <Grid container spacing={0} style={{ padding: 0 }}>
                {Object.keys(icons)
                  .filter(iconKey => !iconKey.startsWith('kind:'))
                  .map(iconKey => {
                    const Icon = icons[iconKey];
                    return (
                      <Grid
                        item
                        style={{
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                        }}
                        xs={3}
                        key={iconKey}
                      >
                        <Tooltip
                          title={
                            <Typography variant="button">
                              {capitalize(iconKey)}
                            </Typography>
                          }
                        >
                          <IconButton
                            onClick={() => {
                              onChange(iconKey);
                              handleClose();
                            }}
                          >
                            <Icon />
                          </IconButton>
                        </Tooltip>
                      </Grid>
                    );
                  })}
              </Grid>
            </Popover>
          </>
        );
      }}
    />
  );
};

export const LinksEditModal = (props: {
  open: boolean;
  setModalOpen: Function;
  links: EntityLink[];
  currentEntity: WorkstreamEntity | ArtEntity;
  refresh: VoidFunction | undefined;
}) => {
  const LINK_TYPES = ['Document', 'Contact', 'Website', 'Email', 'Other'];
  const { links, open, setModalOpen, currentEntity, refresh } = props;
  const app = useApp();
  const workstreamApi = useApi(workstreamApiRef);
  const artApi = useApi(artApiRef);
  const alertApi = useApi(alertApiRef);
  const classes = useStyles();
  const icons = app.getSystemIcons();
  const form1 = useForm<FormValues>({
    values: {
      links: [
        ...links.map(link => ({
          type: link.type,
          url: link.url.replace('mailto:', ''),
          title: link.title,
          icon: link.icon,
        })),
        { icon: 'link', url: '', type: 'Other' },
      ],
    },
    mode: 'all',
  });

  const { control, reset, handleSubmit, getValues } = form1;
  const { fields, append, remove } = useFieldArray({
    name: 'links',
    control: control,
  });

  const handleClose = () => {
    setModalOpen(false);
    reset();
  };

  const handleUpdate: SubmitHandler<FormValues> = data => {
    if (currentEntity.kind === 'Workstream')
      workstreamApi
        .updateWorkstream(currentEntity.metadata.name, {
          name: currentEntity.metadata.name,
          ...data,
        })
        .then(res =>
          alertApi.post({ message: res.message, display: 'transient' }),
        );
    else if (currentEntity.kind === 'ART')
      artApi
        .updateArt(currentEntity.metadata.name, {
          name: currentEntity.metadata.name,
          ...data,
        })
        .then(res =>
          alertApi.post({ message: res.message, display: 'transient' }),
        );
    setTimeout(() => refresh?.(), 2000);
    handleClose();
  };

  return (
    <Dialog
      open={open}
      onClose={() => {
        handleClose();
      }}
      maxWidth="lg"
      fullWidth
    >
      <DialogTitle>Edit Links</DialogTitle>
      <DialogContent dividers>
        {fields.map((field, index) => {
          return (
            <Grid key={field.id} style={{ marginBottom: '4px' }} container>
              <Grid item xs={2}>
                <Controller
                  control={control}
                  name={`links.${index as 0}.type`}
                  render={({ field: { value, onChange, onBlur } }) => (
                    <Autocomplete
                      freeSolo
                      options={LINK_TYPES}
                      getOptionSelected={(op, sel) => op === sel}
                      onChange={(_e, val) => onChange(val)}
                      onInputChange={(_e, val) => onChange(val)}
                      disableClearable
                      value={value ?? ''}
                      selectOnFocus={false}
                      onBlur={onBlur}
                      renderInput={params => (
                        <TextField
                          {...params}
                          variant="outlined"
                          label="Type"
                          placeholder="Select type"
                        />
                      )}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={3}>
                <Controller
                  control={control}
                  name={`links.${index as 0}.title`}
                  rules={{ required: 'Please enter title' }}
                  render={({
                    field: { value, onChange },
                    fieldState: { error },
                  }) => (
                    <TextField
                      variant="outlined"
                      label="Title"
                      value={value ?? ''}
                      error={!!error}
                      helperText={error ? error.message : null}
                      required
                      onChange={onChange}
                      placeholder="Enter title"
                      fullWidth
                    />
                  )}
                />
              </Grid>
              <Grid
                item
                xs={6}
                style={{ display: 'flex', flexDirection: 'row' }}
              >
                <Controller
                  control={control}
                  name={`links.${index as 0}.url`}
                  rules={{
                    required: 'Please enter url',
                    validate: (val: string) => {
                      if (
                        getValues(
                          `links.${index}.type`,
                        )?.toLocaleLowerCase() === 'email' &&
                        !RegExp(/^\S+@\S+\.\S+$/).exec(val)
                      )
                        return 'Email should be in format: your-name@company.com';
                      if (
                        getValues(
                          `links.${index}.type`,
                        )?.toLocaleLowerCase() !== 'email' &&
                        !RegExp(/^(https|http):\/\/([a-zA-Z0-9-.]+).+$/).exec(
                          val,
                        )
                      )
                        return 'Link should be in format: https://my-company.com/**';
                      return true;
                    },
                  }}
                  render={({
                    field: { value, onChange },
                    fieldState: { error },
                  }) => (
                    <TextField
                      variant="outlined"
                      fullWidth
                      label="Url"
                      required
                      error={!!error}
                      helperText={error ? error.message : null}
                      onChange={e => onChange(e)}
                      InputProps={{
                        className: classes.textArea,
                        classes: { adornedStart: classes.textArea },
                        startAdornment: (
                          <IconPicker
                            control={control}
                            icons={icons}
                            index={index}
                          />
                        ),
                      }}
                      placeholder="Enter Url"
                      value={value ?? ''}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={1}>
                <IconButton
                  size="medium"
                  color="secondary"
                  onClick={() => remove(index)}
                >
                  <RemoveCircleOutlineOutlinedIcon />
                </IconButton>
              </Grid>
            </Grid>
          );
        })}
        <Button
          color="primary"
          onClick={() =>
            append({ icon: 'link', url: '', type: 'Other', title: '' })
          }
        >
          Add another link
        </Button>
      </DialogContent>
      <DialogActions>
        <Button
          focusRipple
          variant="contained"
          onClick={handleSubmit(handleUpdate)}
          color="primary"
        >
          Submit
        </Button>
      </DialogActions>
    </Dialog>
  );
};

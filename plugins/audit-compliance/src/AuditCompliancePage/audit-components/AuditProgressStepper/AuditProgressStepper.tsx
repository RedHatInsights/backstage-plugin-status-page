import {
  alertApiRef,
  discoveryApiRef,
  fetchApiRef,
  useApi,
} from '@backstage/core-plugin-api';
import { Tooltip, Typography } from '@material-ui/core';
import Step from '@material-ui/core/Step';
import StepContent from '@material-ui/core/StepContent';
import StepLabel from '@material-ui/core/StepLabel';
import Stepper from '@material-ui/core/Stepper';

import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import RadioButtonCheckedIcon from '@material-ui/icons/RadioButtonChecked';
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useStyles } from './AuditProgressStepper.styles';

export type AuditStep =
  | 'audit_started'
  | 'details_under_review'
  | 'final_sign_off_done'
  | 'summary_generated'
  | 'completed';

interface AuditProgressStepperProps {
  activeStep?: AuditStep;
  auditId?: number;
  showDescriptions?: boolean;
}

const steps: AuditStep[] = [
  'audit_started',
  'details_under_review',
  'final_sign_off_done',
  'summary_generated',
  'completed',
];

const getStepLabel = (step: AuditStep): string => {
  switch (step) {
    case 'audit_started':
      return 'Audit Started';
    case 'details_under_review':
      return 'Details Under Review';
    case 'final_sign_off_done':
      return 'Final Sign-off Done';
    case 'summary_generated':
      return 'Summary Generated';
    case 'completed':
      return 'Completed';
    default:
      return step;
  }
};

const getStepDescription = (step: AuditStep): string => {
  switch (step) {
    case 'audit_started':
      return 'Initial audit process has been initiated';
    case 'details_under_review':
      return 'Audit details are being reviewed by the team';
    case 'final_sign_off_done':
      return 'Final sign-off has been completed for all reviews';
    case 'summary_generated':
      return 'Audit summary has been generated and is ready for review';
    case 'completed':
      return 'Audit process has been completed successfully';
    default:
      return '';
  }
};

export const AuditProgressStepper: React.FC<AuditProgressStepperProps> = ({
  activeStep: propActiveStep,
  auditId,
  showDescriptions = false,
}) => {
  const classes = useStyles();
  const discoveryApi = useApi(discoveryApiRef);
  const fetchApi = useApi(fetchApiRef);
  const alertApi = useApi(alertApiRef);
  const { app_name, frequency, period } = useParams<{
    app_name?: string;
    frequency?: string;
    period?: string;
  }>();
  const [currentStep, setCurrentStep] = useState<AuditStep>(
    propActiveStep || 'audit_started',
  );

  useEffect(() => {
    const fetchAuditProgress = async () => {
      try {
        if (auditId) {
          const baseUrl = await discoveryApi.getBaseUrl('audit-compliance');
          const response = await fetchApi.fetch(`${baseUrl}/audits/${auditId}`);
          const audit = await response.json();
          if (audit?.progress) {
            setCurrentStep(audit.progress);
          }
          return;
        }

        if (app_name && frequency && period) {
          const baseUrl = await discoveryApi.getBaseUrl('audit-compliance');
          const response = await fetchApi.fetch(
            `${baseUrl}/audits/check-duplicate`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ app_name, frequency, period }),
            },
          );
          const { duplicate, audit } = await response.json();
          if (duplicate && audit?.progress) {
            setCurrentStep(audit.progress);
          }
        }
      } catch (error) {
        alertApi.post({
          message: 'Failed to fetch audit progress',
          severity: 'error',
        });
      }
    };

    if (!propActiveStep) {
      fetchAuditProgress();
    }
  }, [
    app_name,
    frequency,
    period,
    auditId,
    propActiveStep,
    discoveryApi,
    fetchApi,
    alertApi,
  ]);

  const activeStep = propActiveStep || currentStep;
  const activeStepIndex = steps.indexOf(activeStep);
  const isAuditCompleted = activeStep === 'completed';

  const CustomStepIcon = ({
    icon,
    active,
    completed,
  }: {
    icon: number;
    active: boolean;
    completed: boolean;
  }) => {
    const stepLabel = getStepLabel(steps[icon]);
    const isCompletedState = steps[icon] === 'completed';

    const iconComponent = (() => {
      if (isCompletedState) {
        if (isAuditCompleted) {
          return <CheckCircleIcon className={classes.completedStepIcon} />;
        }
        return <RadioButtonCheckedIcon className={classes.stepIcon} />;
      }

      if (completed) {
        return <CheckCircleIcon className={classes.completedStepIcon} />;
      }

      if (active) {
        return <RadioButtonCheckedIcon className={classes.activeStepIcon} />;
      }

      return <RadioButtonCheckedIcon className={classes.stepIcon} />;
    })();

    return (
      <Tooltip title={stepLabel} placement="top" arrow>
        <div>{iconComponent}</div>
      </Tooltip>
    );
  };

  return (
    <Stepper
      activeStep={activeStepIndex}
      className={classes.stepper}
      orientation="horizontal"
      alternativeLabel={!showDescriptions}
    >
      {steps.map((step, index) => (
        <Step key={step}>
          <StepLabel
            StepIconComponent={props => (
              <CustomStepIcon
                icon={index}
                active={props.active}
                completed={props.completed}
              />
            )}
          />
          {showDescriptions && (
            <StepContent>
              <Typography className={classes.stepDescription}>
                {getStepDescription(step)}
              </Typography>
            </StepContent>
          )}
        </Step>
      ))}
    </Stepper>
  );
};

export const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved':
        return '#3d7317';
      case 'investigating':
        return '#ffe072';
      case 'monitoring':
        return '#ffe072';
      case 'identified':
        return '#ffe072';
      case 'in_progress':
        return '#ffe072';
      case 'completed':
        return '#3d7317';
      case 'scheduled':
        return '#63bdbd';
      case 'verifying':
        return '#63bdbd';
      case 'postmortem':
        return '#63bdbd';
      case 'critical':
        return '#a60000';
      case 'major':
        return '#f5921b';
      case 'minor':
        return '#0066cc';
      default:
        return 'default';
    }
  };
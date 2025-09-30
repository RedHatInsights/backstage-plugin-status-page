export function humanizeToolName(toolName: string) {
  return toolName.split('_')?.slice(1)?.join('_')
}

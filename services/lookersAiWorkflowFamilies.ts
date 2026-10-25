export const workflowFamilies = ['visual-create','visual-edit','video','audio','writing','marketing','business','research','data','presentation','software','automation','learning','service'] as const;
export type WorkflowFamily = typeof workflowFamilies[number];

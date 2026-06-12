export type LearningNodeType = 'PROGRAM' | 'GRADE' | 'CLASS' | 'SUBJECT' | 'LESSION' | string;

export type LearningStructureNode = {
  id: string;
  tenantId: string;
  parentId: string | null;
  nodeType: LearningNodeType;
  code: string;
  title: string;
  sortOrder: number;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
};

export type LearningTreeNode = LearningStructureNode & {
  children: LearningTreeNode[];
};

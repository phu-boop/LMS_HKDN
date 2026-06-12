import { alpha, styled } from '@mui/material/styles';
import { Box, Card, Typography, Checkbox, Tooltip, IconButton } from '@mui/material';
import { TreeView, TreeItem, TreeItemProps, treeItemClasses } from '@mui/lab';
import { useEffect, useState } from 'react';
// redux
import { useDispatch, useSelector } from '../../../redux/store';
import { selectLearningTree, fetchLearningStructure } from '../../../redux/slices/learningStructure';
import { setSelectedNode, fetchNodesPermissions, setCheckedNodeIds, clearSelectedNode } from '../../../redux/slices/permission';
// hooks
import useAuth from '../../../hooks/useAuth';
// components
import Iconify from '../../../components/Iconify';

// ----------------------------------------------------------------------

const StyledTreeItem = styled((props: TreeItemProps & {
  onCheck?: (id: string, checked: boolean) => void;
  isChecked?: boolean;
  isConflict?: boolean;
}) => {
  const { onCheck, isChecked, isConflict, label, nodeId, ...other } = props;

  return (
    <TreeItem
      nodeId={nodeId}
      label={
        <Box sx={{ display: 'flex', alignItems: 'center', py: 0.5 }}>
          <Checkbox
            size="small"
            checked={isChecked}
            color={isConflict ? "warning" : "success"}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => onCheck?.(nodeId, e.target.checked)}
            sx={{ mr: 0.5, p: 0.5 }}
          />
          {label}
        </Box>
      }
      {...other}
    />
  );
})(({ theme }) => ({
  [`& .${treeItemClasses.iconContainer}`]: {
    '& .close': { opacity: 0.3 },
  },
  [`& .${treeItemClasses.group}`]: {
    marginLeft: 15,
    paddingLeft: 18,
    borderLeft: `1px dashed ${alpha('#10b981', 0.4)}`,
  },
  [`& .${treeItemClasses.content}`]: {
    borderRadius: theme.shape.borderRadius,
    padding: theme.spacing(0.5, 1),
    '&.Mui-selected': {
      backgroundColor: alpha('#10b981', 0.05),
      color: '#059669',
      fontWeight: theme.typography.fontWeightBold,
      '&:hover': { backgroundColor: alpha('#10b981', 0.1) },
    },
    '&:hover': { backgroundColor: theme.palette.action.hover },
  },
  [`& .${treeItemClasses.label}`]: { fontSize: 14 },
}));

const LabelTag = styled('span')(({ color }: { color: string }) => ({
  fontSize: 10,
  fontWeight: 'bold',
  padding: '2px 6px',
  borderRadius: 4,
  marginRight: 8,
  textTransform: 'uppercase',
  backgroundColor: alpha(color, 0.1),
  color: color,
  border: `1px solid ${alpha(color, 0.2)}`,
}));

// Types
import { LearningStructureNode } from '@/@types/learningStructure';

const TYPE_COLORS: Record<string, string> = {
  PROGRAM: '#9333ea',
  GRADE: '#2563eb',
  SUBJECT: '#d97706',
  LESSON: '#64748b',
};

export default function PermissionTree() {
  const dispatch = useDispatch();
  const { user } = useAuth();
  const { nodes } = useSelector((state) => state.learningStructure);
  const { selectedNodeId, checkedNodeIds } = useSelector((state) => state.permission);
  const treeData = useSelector(selectLearningTree);

  useEffect(() => {
    if (user?.tenantId) {
      dispatch(fetchLearningStructure(user.tenantId));
    }
  }, [dispatch, user?.tenantId]);

  const getAllDescendantIds = (parentId: string): string[] => {
    let descendantIds: string[] = [];
    const children = nodes.filter(n => n.parentId === parentId);
    children.forEach(child => {
      descendantIds.push(child.id);
      descendantIds = descendantIds.concat(getAllDescendantIds(child.id));
    });
    return descendantIds;
  };

  const handleCheck = (id: string, checked: boolean) => {
    const node = nodes.find((n) => n.id === id);
    const nextCheckedNodeIds = checked
      ? Array.from(new Set([...checkedNodeIds, id]))
      : checkedNodeIds.filter((nodeId) => nodeId !== id);

    if (nextCheckedNodeIds.length === 0) {
      dispatch(setCheckedNodeIds([]));
      dispatch(clearSelectedNode());
    } else {
      dispatch(setCheckedNodeIds(nextCheckedNodeIds));

      const shouldUpdateSelectedNode = checked || !nextCheckedNodeIds.includes(selectedNodeId || '');
      if (shouldUpdateSelectedNode) {
        const selected = checked
          ? node
          : nodes.find((n) => n.id === nextCheckedNodeIds[nextCheckedNodeIds.length - 1]);
        if (selected) {
          dispatch(setSelectedNode({ id: selected.id, title: selected.title }));
        }
      }
    }

    if (user?.tenantId && nextCheckedNodeIds.length > 0) {
      dispatch(fetchNodesPermissions(user.tenantId, nextCheckedNodeIds));
    }
  };

  const getConflictStatus = (nodeId: string, checkedIds: string[]): boolean => {
    if (!checkedIds.includes(nodeId)) return false;

    // Check if any ancestor is checked
    let current = nodes.find(n => n.id === nodeId);
    while (current && current.parentId) {
      const parentId = current.parentId;
      if (checkedIds.includes(parentId)) {
        return true;
      }
      current = nodes.find(n => n.id === parentId);
    }

    // Check if any descendant is checked
    const hasCheckedDescendant = (parentId: string): boolean => {
      const children = nodes.filter(n => n.parentId === parentId);
      for (const child of children) {
        if (checkedIds.includes(child.id)) return true;
        if (hasCheckedDescendant(child.id)) return true;
      }
      return false;
    };

    return hasCheckedDescendant(nodeId);
  };

  const [expanded, setExpanded] = useState<string[]>([]);

  useEffect(() => {
    if (treeData.length > 0) {
      const initialExpanded: string[] = [];
      const collectIds = (levelNodes: any[], depth: number) => {
        if (depth > 3) return;
        levelNodes.forEach((node) => {
          initialExpanded.push(node.id);
          if (node.children) {
            collectIds(node.children, depth + 1);
          }
        });
      };
      collectIds(treeData, 1);
      setExpanded(initialExpanded);
    }
  }, [treeData]);

  // When a node is selected externally (e.g. from URL query param), expand all its ancestors and auto-check it
  useEffect(() => {
    if (!selectedNodeId || nodes.length === 0) return;

    const getAncestorIds = (nodeId: string): string[] => {
      const node = nodes.find((n) => n.id === nodeId);
      if (!node || !node.parentId) return [];
      return [node.parentId, ...getAncestorIds(node.parentId)];
    };

    const ancestors = getAncestorIds(selectedNodeId);
    if (ancestors.length > 0) {
      setExpanded((prev) => Array.from(new Set([...prev, ...ancestors, selectedNodeId])));
    }

    // Auto-check if not checked (this usually happens on initial load with URL param)
    if (!checkedNodeIds.includes(selectedNodeId)) {
      handleCheck(selectedNodeId, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedNodeId, nodes]);

  const handleToggle = (event: React.SyntheticEvent, nodeIds: string[]) => {
    setExpanded(nodeIds);
  };

  const renderTree = (node: any) => {
    const isConflict = getConflictStatus(node.id, checkedNodeIds);
    return (
      <StyledTreeItem
        key={node.id}
        nodeId={node.id}
        isChecked={checkedNodeIds.includes(node.id)}
        isConflict={isConflict}
        onCheck={handleCheck}
        label={
          <Box
            sx={{ display: 'flex', alignItems: 'center', width: '100%', cursor: 'pointer' }}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              const checked = checkedNodeIds.includes(node.id);
              handleCheck(node.id, !checked);
            }}
          >
            <LabelTag color={TYPE_COLORS[node.nodeType.toUpperCase()] || '#64748b'}>
              {node.nodeType.toUpperCase()}
            </LabelTag>
            <Typography variant="body2" sx={{ fontWeight: selectedNodeId === node.id ? 'bold' : 'normal', flexGrow: 1 }}>
              {node.title}
            </Typography>
            {isConflict && (
              <Tooltip title="Cảnh báo: Cả thư mục cha và con đều đang được chọn (Trùng lặp kế thừa)">
                <IconButton size="small" sx={{ p: 0, color: 'warning.main', ml: 1 }}>
                  <Iconify icon="eva:alert-triangle-fill" width={16} height={16} />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        }
      >
        {Array.isArray(node.children) ? node.children.map((child: any) => renderTree(child)) : null}
      </StyledTreeItem>
    );
  };

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2, bgcolor: 'background.neutral', borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center' }}>
        <Typography variant="subtitle2">Cây thư mục</Typography>
        <Box sx={{ ml: 'auto' }}>
          {checkedNodeIds.length > 0 && (
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {`${checkedNodeIds.length} đã chọn`}
            </Typography>
          )}
        </Box>
      </Box>

      <Box sx={{ p: 2, flexGrow: 1, overflowY: 'auto' }}>
        <TreeView
          multiSelect
          defaultCollapseIcon={<Iconify icon="eva:chevron-down-fill" width={20} height={20} />}
          defaultExpandIcon={<Iconify icon="eva:chevron-right-fill" width={20} height={20} />}
          selected={checkedNodeIds}
          expanded={expanded}
          onNodeToggle={handleToggle}
        >
          {treeData.map((node) => renderTree(node))}
        </TreeView>
      </Box>
    </Card>
  );
}

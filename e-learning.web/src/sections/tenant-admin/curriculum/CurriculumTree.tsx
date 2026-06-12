// @mui
import { alpha, styled } from '@mui/material/styles';
import { Box, Stack, Button, Typography, CircularProgress } from '@mui/material';
import { TreeView, TreeItem, TreeItemProps, treeItemClasses } from '@mui/lab';
import { useEffect, useState, forwardRef, useImperativeHandle } from 'react';
// next
import { useRouter } from 'next/router';
// hooks
import useAuth from '@/hooks/useAuth';
// redux
import { useDispatch, useSelector } from '@/redux/store';
import { fetchLearningStructure, selectLearningTree, reorderCurriculumNodes, reorderNodesLocally, loadSuccess } from '@/redux/slices/learningStructure';
// routes
import { PATH_ADMIN } from '@/routes/paths';
// components
import Iconify from '@/components/Iconify';

// ----------------------------------------------------------------------

const TYPE_COLORS = {
  program: '#9333ea',
  grade: '#2563eb',
  subject: '#d97706',
  lesson: '#64748b',
  class: '#10b981',
};

const StyledTreeItem = styled((props: TreeItemProps & { 
  type: string; 
  color: string; 
  parentId: string | null;
  onAddChild?: (type: string) => void;
  onEdit?: VoidFunction;
  onDelete?: VoidFunction;
  onViewCMS?: VoidFunction;
  hasFiles?: number;
  onDragStartNode: (e: React.DragEvent, nodeId: string, parentId: string | null) => void;
  onDragOverNode: (e: React.DragEvent) => void;
  onDropNode: (e: React.DragEvent, nodeId: string, parentId: string | null) => void;
}) => {
  const { type, color, parentId, onAddChild, onEdit, onDelete, onViewCMS, label, nodeId, hasFiles, onDragStartNode, onDragOverNode, onDropNode, ...other } = props;

  return (
    <TreeItem
      nodeId={nodeId}
      label={
        <Box 
          className="node-row"
          draggable
          onDragStart={(e) => onDragStartNode(e, nodeId, parentId)}
          onDragOver={onDragOverNode}
          onDrop={(e) => onDropNode(e, nodeId, parentId)}
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            py: 1,
            px: 1,
            borderRadius: 1,
            minWidth: { xs: 'max-content', md: 'auto' }, // Prevent text wrapping on mobile
            transition: 'all 0.2s',
            cursor: 'grab',
            '&:active': { cursor: 'grabbing' },
            '&:hover': {
              bgcolor: 'background.neutral',
              '& .actions': { opacity: 1 },
              '& .drag-handle': { opacity: 1 },
            }
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Typography className="drag-handle" variant="body2" sx={{ color: 'text.disabled', opacity: 0, transition: 'opacity 0.2s', cursor: 'grab' }}>
              ⋮⋮
            </Typography>
            <Box sx={{ 
              px: 1, py: 0.2, borderRadius: 0.5, fontSize: 10, fontWeight: 'bold',
              bgcolor: alpha(color, 0.1), color: color, border: `1px solid ${alpha(color, 0.2)}`
            }}>
              {type}
            </Box>
            <Typography variant="subtitle2" sx={{ color: 'text.primary', whiteSpace: 'nowrap' }}>
              {label}
            </Typography>
            {hasFiles && (
              <Typography variant="caption" sx={{ color: 'text.disabled', ml: 1 }}>
                (Có {hasFiles} file học liệu)
              </Typography>
            )}
          </Stack>

          <Stack className="actions" direction="row" spacing={1} sx={{ opacity: 0, transition: 'opacity 0.2s' }}>
            {type !== 'LESSON' && (
              <Button 
                size="small" 
                variant="outlined" 
                color="success" 
                onClick={(e) => { e.stopPropagation(); onAddChild?.(type); }}
                sx={{ fontSize: 11, py: 0.2, px: 1, bgcolor: '#ecfdf5', color: '#059669', border: '1px solid #10b981' }}
              >
                + Thêm {type === 'PROGRAM' ? 'Khối' : type === 'GRADE' ? 'Môn' : 'Bài học'}
              </Button>
            )}
            {!['PROGRAM', 'GRADE', 'SUBJECT'].includes(type.toUpperCase()) && (
              <Button 
                size="small" 
                variant="outlined" 
                color="primary" 
                startIcon={<Iconify icon="eva:eye-fill" />}
                onClick={(e) => { e.stopPropagation(); onViewCMS?.(); }}
                sx={{ fontSize: 11, py: 0.2, px: 1, bgcolor: '#f0f9ff', color: '#0369a1', border: '1px solid #0ea5e9' }}
              >
                Xem
              </Button>
            )}
            <Button 
              size="small" 
              variant="outlined" 
              color="info" 
              onClick={(e) => { e.stopPropagation(); onEdit?.(); }}
              sx={{ fontSize: 11, py: 0.2, px: 1, bgcolor: '#eff6ff', color: '#2563eb', border: '1px solid #3b82f6' }}
            >
              Sửa
            </Button>
            <Button 
              size="small" 
              variant="outlined" 
              color="error" 
              onClick={(e) => { e.stopPropagation(); onDelete?.(); }}
              sx={{ fontSize: 11, py: 0.2, px: 1, bgcolor: '#fef2f2', color: '#ef4444', border: '1px solid #f87171' }}
            >
              Xóa
            </Button>
          </Stack>
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
    marginLeft: 12,
    paddingLeft: 12,
    borderLeft: `2px solid ${theme.palette.divider}`,
    [theme.breakpoints.up('sm')]: {
      marginLeft: 28,
      paddingLeft: 18,
    },
  },
  [`& .${treeItemClasses.content}`]: {
    padding: 0,
    backgroundColor: 'transparent !important',
    '&:hover': { backgroundColor: 'transparent !important' },
    '&.Mui-selected': { backgroundColor: 'transparent !important' },
  },
}));

type TreeProps = {
  onAddChild: (title: string, type: string, parentId: string | null) => void;
  onEdit: (
    title: string,
    type: string,
    value: string,
    nodeId: string,
    parentId: string | null,
    code: string,
    existingSortOrder?: number
  ) => void;
  onDelete: (nodeId: string) => void;
};

export type CurriculumTreeHandle = {
  expandAll: VoidFunction;
  collapseAll: VoidFunction;
};

const CurriculumTree = forwardRef<CurriculumTreeHandle, TreeProps>((props, ref) => {
  const { onAddChild, onEdit, onDelete } = props;
  const dispatch = useDispatch();
  const { push, query } = useRouter();
  const { user } = useAuth();
  const { isLoading, loaded, nodes } = useSelector((state) => state.learningStructure);
  const treeData = useSelector(selectLearningTree);

  const [expanded, setExpanded] = useState<string[]>([]);
  const [selected, setSelected] = useState<string>('');
  const [hasAutoExpanded, setHasAutoExpanded] = useState(false);
  const [draggedNode, setDraggedNode] = useState<{ id: string; parentId: string | null } | null>(null);

  const handleExpandAll = () => {
    const allIds: string[] = [];
    const collectIds = (nodes: any[]) => {
      nodes.forEach((node) => {
        allIds.push(node.id);
        if (node.children) collectIds(node.children);
      });
    };
    collectIds(treeData);
    setExpanded(allIds);
  };

  const handleCollapseAll = () => {
    setExpanded([]);
  };

  useImperativeHandle(ref, () => ({
    expandAll: handleExpandAll,
    collapseAll: handleCollapseAll,
  }));

  // Handle auto-expand/select from URL query
  useEffect(() => {
    if (loaded && query.nodeId && typeof query.nodeId === 'string') {
      const targetId = query.nodeId;
      setSelected(targetId);
      
      // Find all ancestors to expand them
      const ancestors: string[] = [];
      let current = nodes.find((n) => n.id === targetId);
      while (current && current.parentId) {
        ancestors.push(current.parentId);
        current = nodes.find((n) => n.id === current?.parentId);
      }
      
      setExpanded((prev) => Array.from(new Set([...prev, ...ancestors])));
    }
  }, [loaded, query.nodeId, nodes]);

  // Auto-expand all nodes on load (exactly once)
  useEffect(() => {
    if (loaded && treeData.length > 0 && !hasAutoExpanded && !query.nodeId) {
      const allIds: string[] = [];
      const collectIds = (nodes: any[]) => {
        nodes.forEach((node) => {
          allIds.push(node.id);
          if (node.children) collectIds(node.children);
        });
      };
      collectIds(treeData);
      setExpanded(allIds);
      setHasAutoExpanded(true);
    }
  }, [loaded, treeData, hasAutoExpanded, query.nodeId]);



  const handleToggle = (event: React.SyntheticEvent, nodeIds: string[]) => {
    setExpanded(nodeIds);
  };

  const handleSelect = (event: React.SyntheticEvent, nodeId: string) => {
    setSelected(nodeId);
  };

  const handleDragStart = (e: React.DragEvent, nodeId: string, parentId: string | null) => {
    setDraggedNode({ id: nodeId, parentId });
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', nodeId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetNodeId: string, targetParentId: string | null) => {
    e.preventDefault();
    if (!draggedNode) return;

    if (draggedNode.parentId !== targetParentId) {
      alert('Chỉ có thể sắp xếp các mục có cùng cấp!');
      setDraggedNode(null);
      return;
    }

    if (draggedNode.id === targetNodeId) {
      setDraggedNode(null);
      return;
    }

    // siblings under the same parent
    const siblings = [...nodes]
      .filter((n) => n.parentId === targetParentId)
      .sort((a, b) => a.sortOrder - b.sortOrder);

    const fromIndex = siblings.findIndex((n) => n.id === draggedNode.id);
    const toIndex = siblings.findIndex((n) => n.id === targetNodeId);

    if (fromIndex !== -1 && toIndex !== -1 && fromIndex !== toIndex) {
      const updatedSiblings = [...siblings];
      const [removed] = updatedSiblings.splice(fromIndex, 1);
      updatedSiblings.splice(toIndex, 0, removed);

      const orderedNodeIds = updatedSiblings.map((n) => n.id);

      // Save previous state for optimistic rollback
      const previousNodes = [...nodes];

      // Optimistic update
      dispatch(reorderNodesLocally({ parentId: targetParentId, orderedNodeIds }));

      try {
        if (user?.tenantId) {
          await dispatch(reorderCurriculumNodes(user.tenantId, targetParentId, orderedNodeIds));
        }
      } catch (err) {
        console.error('Optimistic reordering failed, rolling back.', err);
        // Rollback state
        dispatch(loadSuccess(previousNodes));
        alert('Không thể sắp xếp lại vị trí. Vui lòng thử lại!');
      }
    }

    setDraggedNode(null);
  };

  useEffect(() => {
    if (!loaded && user?.tenantId) {
      dispatch(fetchLearningStructure(user.tenantId));
    }
  }, [dispatch, loaded, user?.tenantId]);

  const renderTree = (nodes: any[]) =>
    nodes.map((node) => (
      <StyledTreeItem
        key={node.id}
        nodeId={node.id}
        type={node.nodeType.toUpperCase()}
        color={TYPE_COLORS[node.nodeType.toLowerCase() as keyof typeof TYPE_COLORS] || '#64748b'}
        label={node.title}
        parentId={node.parentId}
        onDragStartNode={handleDragStart}
        onDragOverNode={handleDragOver}
        onDropNode={handleDrop}
        onAddChild={(parentType) => {
          const p = parentType.toLowerCase();
          const childType = p === 'program' ? 'GRADE' : p === 'grade' ? 'SUBJECT' : 'LESSON';
          onAddChild(`Thêm ${childType} mới`, childType, node.id);
        }}
        onEdit={() => onEdit(`Sửa ${node.nodeType}`, node.nodeType, node.title, node.id, node.parentId, node.code, node.sortOrder)}
        onDelete={() => onDelete(node.id)}
        onViewCMS={() => push(`${PATH_ADMIN.tenantAdminCms}?nodeId=${node.id}`)}
      >
        {Array.isArray(node.children) ? renderTree(node.children) : null}
      </StyledTreeItem>
    ));

  if (isLoading && !loaded) {
    return (
      <Stack alignItems="center" justifyContent="center" sx={{ height: '100%' }}>
        <CircularProgress />
      </Stack>
    );
  }

  return (
    <Box sx={{ p: { xs: 1, sm: 3 }, height: '100%', overflowY: 'auto', overflowX: 'auto' }}>
      {treeData.length === 0 ? (
        <Stack alignItems="center" justifyContent="center" sx={{ height: '100%', opacity: 0.5 }}>
          <Typography variant="body2">Chưa có dữ liệu học liệu</Typography>
        </Stack>
      ) : (
        <TreeView
          defaultCollapseIcon={<Iconify icon="eva:chevron-down-fill" width={20} height={20} />}
          defaultExpandIcon={<Iconify icon="eva:chevron-right-fill" width={20} height={20} />}
          expanded={expanded}
          selected={selected}
          onNodeToggle={handleToggle}
          onNodeSelect={handleSelect}
        >
          {renderTree(treeData)}
        </TreeView>
      )}
    </Box>
  );
});

export default CurriculumTree;

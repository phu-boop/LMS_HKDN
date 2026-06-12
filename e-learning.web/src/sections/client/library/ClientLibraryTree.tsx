// @mui
import { alpha, styled } from '@mui/material/styles';
import { Box, Card, Typography, CircularProgress, Stack } from '@mui/material';
import { TreeView, TreeItem, TreeItemProps, treeItemClasses } from '@mui/lab';
import { useEffect, useState } from 'react';
// hooks
import useAuth from '@/hooks/useAuth';
// redux
import { useDispatch, useSelector } from '@/redux/store';
import { fetchClientCurriculum, selectLearningTree } from '@/redux/slices/learningStructure';
import { setActiveNode, fetchClientCmsContents } from '@/redux/slices/cmsContent';
// components
import Iconify from '@/components/Iconify';

// ----------------------------------------------------------------------

const StyledTreeItem = styled((props: TreeItemProps) => <TreeItem {...props} />)(({ theme }) => ({
  [`& .${treeItemClasses.iconContainer}`]: {
    '& .close': { opacity: 0.3 },
  },
  [`& .${treeItemClasses.group}`]: {
    marginLeft: 15,
    paddingLeft: 18,
    borderLeft: `1px dashed ${alpha(theme.palette.primary.main, 0.4)}`,
  },
  [`& .${treeItemClasses.content}`]: {
    borderRadius: theme.shape.borderRadius,
    padding: theme.spacing(0.5, 1),
    '&.Mui-selected': {
      backgroundColor: alpha(theme.palette.primary.main, 0.1),
      color: theme.palette.primary.main,
      fontWeight: theme.typography.fontWeightBold,
      '&:hover': {
        backgroundColor: alpha(theme.palette.primary.main, 0.2),
      },
    },
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
  },
  [`& .${treeItemClasses.label}`]: {
    fontSize: 14,
  },
}));

import { useRouter } from 'next/router';

export default function ClientLibraryTree() {
  const router = useRouter();
  const { nodeId: queryNodeId } = router.query;
  const dispatch = useDispatch();
  const { isLoading, loaded, nodes } = useSelector((state) => state.learningStructure);
  const treeData = useSelector(selectLearningTree);
  const [expanded, setExpanded] = useState<string[]>([]);
  const [selected, setSelected] = useState<string>('');

  useEffect(() => {
    if (!loaded) {
      dispatch(fetchClientCurriculum());
    }
  }, [dispatch, loaded]);

  // Auto expand first 3 levels when data is loaded
  useEffect(() => {
    if (loaded && treeData.length > 0 && expanded.length === 0) {
      const ids: string[] = [];
      const collectIds = (nodes: any[], level: number) => {
        if (level > 2) return;
        nodes.forEach((node) => {
          ids.push(node.id);
          if (node.children) collectIds(node.children, level + 1);
        });
      };
      collectIds(treeData, 1);
      setExpanded(ids);
    }
  }, [loaded, treeData, expanded.length]);

  // Auto select first node on load or queryNodeId
  useEffect(() => {
    if (loaded && treeData.length > 0 && !selected) {
      // Find node from query if it exists, otherwise use first LESSION/LESSON node
      const targetNodeId = queryNodeId as string;
      let nodeToSelect: any = null;
      
      if (targetNodeId) {
        const targetNode = nodes.find(n => n.id === targetNodeId);
        if (targetNode && ['LESSON', 'LESSION'].includes(targetNode.nodeType?.toUpperCase() || '')) {
          nodeToSelect = targetNode;
        }
      }
      
      if (!nodeToSelect) {
        // Find the first LESSION/LESSON node in the structure
        const firstLession = nodes.find(n => ['LESSON', 'LESSION'].includes(n.nodeType?.toUpperCase() || ''));
        if (firstLession) {
          nodeToSelect = firstLession;
        }
      }

      if (nodeToSelect) {
        setSelected(nodeToSelect.id);
        dispatch(setActiveNode({ id: nodeToSelect.id, title: nodeToSelect.title }));
        dispatch(fetchClientCmsContents(nodeToSelect.id));

        // Auto expand ancestors of the selected lesson node so the user can see it
        const ancestors: string[] = [];
        let current = nodes.find((n) => n.id === nodeToSelect.id);
        while (current && current.parentId) {
          ancestors.push(current.parentId);
          current = nodes.find((n) => n.id === current?.parentId);
        }
        setExpanded((prev) => Array.from(new Set([...prev, ...ancestors])));
      }
    }
  }, [loaded, treeData, selected, dispatch, queryNodeId, nodes]);

  const handleToggle = (event: React.SyntheticEvent, nodeIds: string[]) => {
    setExpanded(nodeIds);
  };

  const handleSelect = (event: React.SyntheticEvent, nodeId: string) => {
    const selectedNode = nodes.find(n => n.id === nodeId);
    if (!selectedNode) return;

    // Find the node in treeData (which has populated children) to check if it is a parent
    const findInTree = (items: any[]): any => {
      for (const item of items) {
        if (item.id === nodeId) return item;
        if (item.children) {
          const found = findInTree(item.children);
          if (found) return found;
        }
      }
      return null;
    };

    const treeNode = findInTree(treeData);
    const hasChildren = treeNode && Array.isArray(treeNode.children) && treeNode.children.length > 0;

    if (hasChildren) {
      // Parent node clicked -> toggle collapse/expand
      if (expanded.includes(nodeId)) {
        setExpanded(prev => prev.filter(id => id !== nodeId));
      } else {
        setExpanded(prev => [...prev, nodeId]);
      }
      return;
    }

    // Leaf node clicked -> select and load content
    setSelected(nodeId);
    dispatch(setActiveNode({ id: selectedNode.id, title: selectedNode.title }));
    dispatch(fetchClientCmsContents(selectedNode.id));
  };

  const renderTree = (nodes: any[]) =>
    nodes.map((node) => {
      const hasChildren = Array.isArray(node.children) && node.children.length > 0;
      return (
        <StyledTreeItem key={node.id} nodeId={node.id} label={node.title}>
          {hasChildren ? renderTree(node.children) : null}
        </StyledTreeItem>
      );
    });

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2, bgcolor: 'background.neutral', borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography variant="subtitle2">Cây học liệu</Typography>
      </Box>

      <Box sx={{ p: 2, flexGrow: 1, overflowY: 'auto', minHeight: 400 }}>
        {isLoading && !loaded ? (
          <Stack alignItems="center" sx={{ py: 3 }}>
            <CircularProgress size={24} />
          </Stack>
        ) : (
          <TreeView
            defaultCollapseIcon={<Iconify icon="eva:chevron-down-fill" width={20} height={20} />}
            defaultExpandIcon={<Iconify icon="eva:chevron-right-fill" width={20} height={20} />}
            expanded={expanded}
            selected={selected}
            onNodeToggle={handleToggle}
            onNodeSelect={(e, id) => handleSelect(e, id)}
            sx={{ flexGrow: 1, overflowY: 'auto' }}
          >
            {renderTree(treeData)}
          </TreeView>
        )}
      </Box>
    </Card>
  );
}

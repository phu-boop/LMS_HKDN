// @mui
import { alpha, styled } from '@mui/material/styles';
import { Box, Card, Typography, CircularProgress, Stack } from '@mui/material';
import { TreeView, TreeItem, TreeItemProps, treeItemClasses } from '@mui/lab';
import { useEffect, useState } from 'react';
// next
import { useRouter } from 'next/router';
// hooks
import useAuth from '@/hooks/useAuth';
// redux
import { useDispatch, useSelector } from '@/redux/store';
import { fetchLearningStructure, fetchChildrenNode, selectLearningTree } from '@/redux/slices/learningStructure';
import { setActiveNode, fetchCmsContents } from '@/redux/slices/cmsContent';
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
    borderLeft: `1px dashed ${alpha('#10b981', 0.4)}`,
  },
  [`& .${treeItemClasses.content}`]: {
    borderRadius: theme.shape.borderRadius,
    padding: theme.spacing(0.5, 1),
    // Styled tree selection styling: target Mui-selected directly
    '&.Mui-selected': {
      backgroundColor: `${alpha('#10b981', 0.15)} !important`,
      color: '#059669',
      fontWeight: theme.typography.fontWeightBold,
      '&:hover': {
        backgroundColor: alpha('#10b981', 0.25),
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

export default function ContentCmsFolderTree() {
  const dispatch = useDispatch();
  const { query } = useRouter();
  const { user } = useAuth();
  const { isLoading, loaded, nodes } = useSelector((state) => state.learningStructure);
  const treeData = useSelector(selectLearningTree);
  const [expanded, setExpanded] = useState<string[]>([]);
  const [selected, setSelected] = useState<string>('');

  useEffect(() => {
    if (!loaded && user?.tenantId) {
      dispatch(fetchLearningStructure(user.tenantId));
    }
  }, [dispatch, loaded, user?.tenantId]);

  // Handle auto-expand/select from URL query
  useEffect(() => {
    if (loaded && query.nodeId && typeof query.nodeId === 'string' && user?.tenantId) {
      const targetId = query.nodeId;
      setSelected(targetId);
      
      // Select it in Redux to trigger content list fetch
      const node = nodes.find(n => n.id === targetId);
      if (node) {
        dispatch(setActiveNode({ id: node.id, title: node.title }));
        dispatch(fetchCmsContents(user.tenantId, node.id));
      }

      // Find all ancestors to expand them
      const ancestors: string[] = [];
      let current = nodes.find((n) => n.id === targetId);
      while (current && current.parentId) {
        ancestors.push(current.parentId);
        current = nodes.find((n) => n.id === current?.parentId);
      }
      
      setExpanded((prev) => Array.from(new Set([...prev, ...ancestors])));
    }
  }, [loaded, query.nodeId, nodes, user?.tenantId, dispatch]);

  // Auto expand first 3 levels when data is loaded
  useEffect(() => {
    if (loaded && treeData.length > 0 && expanded.length === 0 && !query.nodeId) {
      const ids: string[] = [];
      const collectIds = (nodes: any[], level: number) => {
        if (level > 3) return;
        nodes.forEach((node) => {
          ids.push(node.id);
          if (node.children) collectIds(node.children, level + 1);
        });
      };
      collectIds(treeData, 1);
      setExpanded(ids);
    }
  }, [loaded, treeData, expanded.length, query.nodeId]);

  // Auto select first leaf node if nothing is selected yet
  useEffect(() => {
    if (loaded && treeData.length > 0 && !selected && !query.nodeId && user?.tenantId) {
      const findFirstLeaf = (items: any[]): any => {
        for (const item of items) {
          if (!item.children || item.children.length === 0) {
            return item;
          }
          const leaf = findFirstLeaf(item.children);
          if (leaf) return leaf;
        }
        return null;
      };
      
      const firstLeaf = findFirstLeaf(treeData) || treeData[0];
      if (firstLeaf) {
        setSelected(firstLeaf.id);
        dispatch(setActiveNode({ id: firstLeaf.id, title: firstLeaf.title }));
        dispatch(fetchCmsContents(user.tenantId, firstLeaf.id));
      }
    }
  }, [loaded, treeData, selected, query.nodeId, user?.tenantId, dispatch]);

  const handleToggle = (event: React.SyntheticEvent, nodeIds: string[]) => {
    setExpanded(nodeIds);
    const lastExpanded = nodeIds.find(id => !expanded.includes(id));
    if (lastExpanded && user?.tenantId) {
      dispatch(fetchChildrenNode(user.tenantId, lastExpanded));
    }
  };

  const handleSelect = (event: React.SyntheticEvent, nodeId: string) => {
    // Find the node in the flattened nodes list
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
        if (user?.tenantId) {
          dispatch(fetchChildrenNode(user.tenantId, nodeId));
        }
      }
      return;
    }

    // Leaf node clicked -> select and load content
    setSelected(nodeId);
    dispatch(setActiveNode({ id: selectedNode.id, title: selectedNode.title }));
    if (user?.tenantId) {
      dispatch(fetchCmsContents(user.tenantId, selectedNode.id));
    }
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
        <Typography variant="subtitle2">Duyệt theo Thư mục</Typography>
      </Box>

      <Box sx={{ p: 2, flexGrow: 1, overflowY: 'auto' }}>
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
            onNodeSelect={(e, id) => {
              handleSelect(e, id);
            }}
            sx={{ flexGrow: 1, overflowY: 'auto' }}
          >
            {renderTree(treeData)}
          </TreeView>
        )}
      </Box>
    </Card>
  );
}

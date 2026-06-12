import { createSlice, PayloadAction, createSelector } from '@reduxjs/toolkit';
import axios from '@/utils/axios';
import { API_ENDPOINTS } from '@/constants/apiEndpoints';
import type { LearningNodeType, LearningStructureNode, LearningTreeNode } from '@/@types/learningStructure';
import type { RootState } from '../store';
import { LEARNING_STRUCTURE_INITIAL } from '@/_mock/_learningStructure';
import { dispatch } from '../store';

type LearningStructureState = {
  isLoading: boolean;
  loaded: boolean;
  error: string | null;
  nodes: LearningStructureNode[];
};

const initialState: LearningStructureState = {
  isLoading: false,
  loaded: false,
  error: null,
  nodes: [],
};

function normalizeNode(item: any): LearningStructureNode | null {
  if (!item || typeof item !== 'object') return null;
  
  return {
    id: String(item.id || ''),
    tenantId: String(item.tenantId || ''),
    parentId: item.parentId ? String(item.parentId) : null,
    nodeType: String(item.nodeType || ''),
    code: String(item.code || ''),
    title: String(item.title || item.name || ''),
    sortOrder: Number(item.sortOrder) || 0,
    status: item.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
    createdAt: String(item.createdAt || ''),
    updatedAt: String(item.updatedAt || ''),
  };
}

function extractNodes(data: unknown): LearningStructureNode[] {
  const nodes: LearningStructureNode[] = [];
  
  function walk(items: any) {
    if (!items) return;
    const array = Array.isArray(items) ? items : Array.isArray(items.items) ? items.items : null;
    if (!array) return;

    array.forEach((item) => {
      const normalized = normalizeNode(item);
      if (normalized) {
        nodes.push(normalized);
        if (item.children && Array.isArray(item.children)) {
          walk(item.children);
        }
      }
    });
  }

  walk(data);
  return nodes;
}

const slice = createSlice({
  name: 'learningStructure',
  initialState,
  reducers: {
    startLoading(state) {
      state.isLoading = true;
      state.error = null;
    },
    hasError(state, action: PayloadAction<string>) {
      state.isLoading = false;
      state.loaded = true;
      state.error = action.payload;
    },
    loadSuccess(state, action: PayloadAction<LearningStructureNode[]>) {
      state.isLoading = false;
      state.loaded = true;
      state.error = null;
      state.nodes = action.payload;
    },
    upsertNodeSuccess(state, action: PayloadAction<LearningStructureNode>) {
      const idx = state.nodes.findIndex((x) => x.id === action.payload.id);
      if (idx >= 0) state.nodes[idx] = action.payload;
      else state.nodes = [...state.nodes, action.payload];
      state.error = null;
    },
    deleteNodeSuccess(state, action: PayloadAction<string>) {
      state.nodes = state.nodes.filter((x) => x.id !== action.payload);
      state.error = null;
    },
    reorderNodeSuccess(state, action: PayloadAction<{ id: string; sortOrder: number }>) {
      state.nodes = state.nodes.map((x) =>
        x.id === action.payload.id ? { ...x, sortOrder: action.payload.sortOrder } : x
      );
      state.error = null;
    },
    reorderNodesLocally(state, action: PayloadAction<{ parentId: string | null; orderedNodeIds: string[] }>) {
      const { parentId, orderedNodeIds } = action.payload;
      state.nodes = state.nodes.map((node) => {
        if (node.parentId === parentId) {
          const newIdx = orderedNodeIds.indexOf(node.id);
          if (newIdx !== -1) {
            return { ...node, sortOrder: newIdx };
          }
        }
        return node;
      });
      state.error = null;
    },
  },
});

export const { startLoading, hasError, loadSuccess, upsertNodeSuccess, deleteNodeSuccess, reorderNodeSuccess, reorderNodesLocally } =
  slice.actions;

export default slice.reducer;

export function fetchClientCurriculum() {
  return async () => {
    dispatch(startLoading());
    try {
      const res = await axios.get(API_ENDPOINTS.clientCurriculum);
      const nodes = extractNodes(res.data);
      dispatch(loadSuccess(nodes));
    } catch (e) {
      console.error('Fetch client curriculum error:', e);
      dispatch(hasError('Không tải được cây học liệu'));
    }
  };
}

export function fetchLearningStructure(tenantId?: string) {
  return async () => {
    dispatch(startLoading());
    try {
      if (tenantId) {
        // Tenant Admin Mode: Use Curriculum API (Root Level)
        const url = API_ENDPOINTS.tenantsCurriculum(tenantId);
        const res = await axios.get(url);
        const nodes = extractNodes(res.data);
        dispatch(loadSuccess(nodes));
      } else {
        // Global Admin Mode: Use Catalog Parallel Fetch
        const types = ['PROGRAM', 'GRADE', 'CLASS', 'SUBJECT', 'LESSION'];
        const requests = types.map(type => axios.get(API_ENDPOINTS.catalogByType(type)));
        const responses = await Promise.all(requests);
        
        const allNodes: LearningStructureNode[] = [];
        responses.forEach((res, index) => {
          const type = types[index];
          const rawItems = res.data?.items || res.data || [];
          if (Array.isArray(rawItems)) {
            rawItems.forEach(item => {
              const normalized = normalizeNode({ ...item, nodeType: type });
              if (normalized) allNodes.push(normalized);
            });
          }
        });
        dispatch(loadSuccess(allNodes));
      }
    } catch (e) {
      console.error('Fetch learning structure error:', e);
      dispatch(loadSuccess([]));
    }
  };
}

export function fetchChildrenNode(tenantId: string, nodeId: string) {
  return async () => {
    try {
      const res = await axios.get(API_ENDPOINTS.tenantsCurriculumChildren(tenantId, nodeId));
      const childNodes = extractNodes(res.data);
      childNodes.forEach(node => {
        dispatch(upsertNodeSuccess(node));
      });
    } catch (e) {
      console.error('Fetch children nodes error:', e);
    }
  };
}

export function upsertLearningNode(tenantId: string | null, node: LearningStructureNode, isEdit: boolean) {
  return async () => {
    dispatch(startLoading());
    try {
      let savedNode = { ...node };
      if (tenantId) {
        // Tenant Mode
        if (isEdit) {
          const res = await axios.put(API_ENDPOINTS.tenantsCurriculumNode(tenantId, node.id), node);
          if (res.data) savedNode = normalizeNode(res.data) || node;
        } else {
          const res = await axios.post(API_ENDPOINTS.tenantsCurriculum(tenantId), node);
          if (res.data) savedNode = normalizeNode(res.data) || node;
        }
      } else {
        // Global Catalog Mode
        const type = node.nodeType;
        if (isEdit) {
          const res = await axios.put(API_ENDPOINTS.catalogById(type, node.id), node);
          if (res.data) savedNode = normalizeNode(res.data) || node;
        } else {
          const res = await axios.post(API_ENDPOINTS.catalogByType(type), node);
          if (res.data) savedNode = normalizeNode(res.data) || node;
        }
      }
      dispatch(upsertNodeSuccess(savedNode));
      if (tenantId) {
        dispatch(fetchLearningStructure(tenantId));
      } else {
        dispatch(fetchLearningStructure());
      }
    } catch (error: any) {
      dispatch(hasError(error.message || 'Không thể lưu node'));
    }
  };
}

export function deleteLearningNode(tenantId: string | null, nodeId: string, nodeType?: string) {
  return async () => {
    dispatch(startLoading());
    try {
      if (tenantId) {
        await axios.delete(API_ENDPOINTS.tenantsCurriculumNode(tenantId, nodeId));
      } else if (nodeType) {
        await axios.delete(API_ENDPOINTS.catalogById(nodeType, nodeId));
      }
      dispatch(deleteNodeSuccess(nodeId));
      if (tenantId) {
        dispatch(fetchLearningStructure(tenantId));
      } else {
        dispatch(fetchLearningStructure());
      }
    } catch (error: any) {
      dispatch(hasError(error.message || 'Không thể xóa node'));
    }
  };
}

export function reorderLearningNode(tenantId: string, nodeId: string, sortOrder: number) {
  return async () => {
    try {
      await axios.patch(API_ENDPOINTS.tenantsCurriculumReorder(tenantId), {
        nodeId,
        sortOrder,
      });
      dispatch(reorderNodeSuccess({ id: nodeId, sortOrder }));
      dispatch(fetchLearningStructure(tenantId));
    } catch (error: any) {
      dispatch(hasError(error.message || 'Không thể sắp xếp lại'));
    }
  };
}

export function reorderCurriculumNodes(tenantId: string, parentId: string | null, orderedNodeIds: string[]) {
  return async () => {
    try {
      await axios.patch(API_ENDPOINTS.tenantsCurriculumReorder(tenantId), {
        parentId,
        orderedNodeIds,
      });
      dispatch(fetchLearningStructure(tenantId));
    } catch (error: any) {
      dispatch(hasError(error.message || 'Không thể sắp xếp lại cấu trúc học liệu'));
      throw error;
    }
  };
}

const selectNodes = (state: RootState) => state.learningStructure.nodes;

export const selectLearningTree = createSelector([selectNodes], (nodes) => {
  const sortedNodes = [...nodes].sort((a, b) => a.sortOrder - b.sortOrder);
  const nodeIds = new Set(nodes.map(n => n.id));
  const byParent = new Map<string | null, LearningStructureNode[]>();
  
  sortedNodes.forEach((node) => {
    // If parentId is not in our current nodes list, treat it as a root (parentId = null)
    const effectiveParentId = nodeIds.has(node.parentId as string) ? node.parentId : null;
    const list = byParent.get(effectiveParentId) || [];
    list.push(node);
    byParent.set(effectiveParentId, list);
  });

  const build = (parentId: string | null): LearningTreeNode[] =>
    (byParent.get(parentId) || [])
      .map((node) => ({ ...node, children: build(node.id) }));
      
  return build(null);
});

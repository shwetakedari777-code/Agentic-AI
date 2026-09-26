import { create } from 'zustand';
import api from '../services/api';

export const useWorkflowStore = create((set, get) => ({
  activeWorkflow: null,
  nodes: [],
  edges: [],
  selectedNode: null,
  isDirty: false,
  isLoading: false,
  isSaving: false,
  isExecuting: false,
  error: null,

  setWorkflow: (workflow) => {
    set({
      activeWorkflow: workflow,
      nodes: workflow?.nodes || [],
      edges: workflow?.edges || [],
      selectedNode: null,
      isDirty: false,
      error: null,
    });
  },

  setNodes: (nodes) => set({ nodes, isDirty: true }),
  setEdges: (edges) => set({ edges, isDirty: true }),

  onNodesChange: (changes) => {
    // In React Flow, changes is an array of node modifications
    const currentNodes = get().nodes;
    let updatedNodes = [...currentNodes];

    changes.forEach((change) => {
      if (change.type === 'position' && change.position) {
        updatedNodes = updatedNodes.map((n) =>
          n.id === change.id ? { ...n, position: change.position } : n
        );
      } else if (change.type === 'select') {
        updatedNodes = updatedNodes.map((n) =>
          n.id === change.id ? { ...n, selected: change.selected } : n
        );
        if (change.selected) {
          const selected = updatedNodes.find((n) => n.id === change.id);
          set({ selectedNode: selected });
        }
      } else if (change.type === 'remove') {
        updatedNodes = updatedNodes.filter((n) => n.id !== change.id);
        const currSelected = get().selectedNode;
        if (currSelected?.id === change.id) {
          set({ selectedNode: null });
        }
      }
    });

    set({ nodes: updatedNodes, isDirty: true });
  },

  onEdgesChange: (changes) => {
    const currentEdges = get().edges;
    let updatedEdges = [...currentEdges];

    changes.forEach((change) => {
      if (change.type === 'remove') {
        updatedEdges = updatedEdges.filter((e) => e.id !== change.id);
      } else if (change.type === 'select') {
        updatedEdges = updatedEdges.map((e) =>
          e.id === change.id ? { ...e, selected: change.selected } : e
        );
      }
    });

    set({ edges: updatedEdges, isDirty: true });
  },

  onConnect: (connection) => {
    const newEdge = {
      id: `e-${connection.source}-${connection.target}-${Date.now()}`,
      source: connection.source,
      target: connection.target,
      animated: true,
      style: { stroke: '#6366f1', strokeWidth: 2 },
    };

    set({
      edges: [...get().edges, newEdge],
      isDirty: true,
    });
  },

  selectNode: (node) => set({ selectedNode: node }),

  updateNodeConfig: (nodeId, { label, config = {}, provider, action }) => {
    const updatedNodes = get().nodes.map((node) => {
      if (node.id === nodeId) {
        return {
          ...node,
          data: {
            ...node.data,
            ...(label && { label }),
            ...(provider && { provider }),
            ...(action && { action }),
            config: {
              ...(node.data?.config || {}),
              ...config,
            },
          },
        };
      }
      return node;
    });

    const updatedSelected = updatedNodes.find((n) => n.id === nodeId);
    set({
      nodes: updatedNodes,
      selectedNode: updatedSelected,
      isDirty: true,
    });
  },

  addNodeFromPalette: ({ type = 'actionNode', provider = 'ai', action = 'run', label, config = {}, position }) => {
    const id = `node-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const newNode = {
      id,
      type,
      position: position || { x: 300 + Math.random() * 100, y: 150 + Math.random() * 100 },
      data: {
        label: label || `${provider.toUpperCase()} Action`,
        provider,
        action,
        config,
      },
    };

    set({
      nodes: [...get().nodes, newNode],
      selectedNode: newNode,
      isDirty: true,
    });
  },

  deleteNode: (nodeId) => {
    set({
      nodes: get().nodes.filter((n) => n.id !== nodeId),
      edges: get().edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
      selectedNode: get().selectedNode?.id === nodeId ? null : get().selectedNode,
      isDirty: true,
    });
  },

  saveWorkflow: async () => {
    const workflow = get().activeWorkflow;
    if (!workflow || !workflow._id) return;

    set({ isSaving: true, error: null });
    try {
      const payload = {
        name: workflow.name,
        description: workflow.description,
        status: workflow.status,
        triggerConfig: workflow.triggerConfig,
        nodes: get().nodes,
        edges: get().edges,
        tags: workflow.tags,
      };

      const res = await api.put(`/workflows/${workflow._id}`, payload);
      set({
        activeWorkflow: res.data.data,
        nodes: res.data.data.nodes,
        edges: res.data.data.edges,
        isDirty: false,
        isSaving: false,
      });
      return { success: true, workflow: res.data.data };
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Failed to save workflow';
      set({ isSaving: false, error: msg });
      return { success: false, error: msg };
    }
  },

  executeWorkflow: async (inputs = {}) => {
    const workflow = get().activeWorkflow;
    if (!workflow || !workflow._id) return;

    set({ isExecuting: true, error: null });
    try {
      // Auto save before execute if dirty
      if (get().isDirty) {
        await get().saveWorkflow();
      }

      const res = await api.post(`/workflows/${workflow._id}/execute`, { inputs });
      set({ isExecuting: false });
      return { success: true, executionId: res.data.data.executionId };
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Execution trigger failed';
      set({ isExecuting: false, error: msg });
      return { success: false, error: msg };
    }
  },
}));

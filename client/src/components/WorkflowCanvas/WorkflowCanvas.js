import React, { useMemo, useCallback } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import TriggerNode from './TriggerNode';
import ActionNode from './ActionNode';
import { useWorkflowStore } from '../../store/workflowStore';

export default function WorkflowCanvas({ readOnly = false }) {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    selectNode,
    addNodeFromPalette,
  } = useWorkflowStore();

  const nodeTypes = useMemo(
    () => ({
      triggerNode: TriggerNode,
      actionNode: ActionNode,
    }),
    []
  );

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      if (readOnly) return;

      const rawData = event.dataTransfer.getData('application/reactflow-node');
      if (!rawData) return;

      try {
        const item = JSON.parse(rawData);
        // Approximate position inside canvas
        const bounds = event.currentTarget.getBoundingClientRect();
        const position = {
          x: event.clientX - bounds.left - 100,
          y: event.clientY - bounds.top - 40,
        };

        addNodeFromPalette({
          type: item.type,
          provider: item.provider,
          action: item.action,
          label: item.label,
          config: item.config || {},
          position,
        });
      } catch (err) {
        console.error('Failed to parse dropped node:', err);
      }
    },
    [readOnly, addNodeFromPalette]
  );

  const onNodeClick = useCallback(
    (_, node) => {
      selectNode(node);
    },
    [selectNode]
  );

  const onPaneClick = useCallback(() => {
    selectNode(null);
  }, [selectNode]);

  return (
    <div
      className="w-full h-full relative bg-[#060a14] select-none"
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={readOnly ? undefined : onNodesChange}
        onEdgesChange={readOnly ? undefined : onEdgesChange}
        onConnect={readOnly ? undefined : onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        fitView
        nodesDraggable={!readOnly}
        nodesConnectable={!readOnly}
        elementsSelectable={true}
        snapToGrid={true}
        snapGrid={[15, 15]}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          color="#1e293b"
          gap={24}
          size={1.5}
          variant={BackgroundVariant.Dots}
        />
        <Controls position="bottom-left" showInteractive={!readOnly} />
        <MiniMap
          nodeColor={(n) => (n.type === 'triggerNode' ? '#6366f1' : '#3b82f6')}
          maskColor="rgba(6, 10, 20, 0.8)"
          position="bottom-right"
          className="rounded-lg shadow-xl border border-slate-800"
        />
      </ReactFlow>
    </div>
  );
}

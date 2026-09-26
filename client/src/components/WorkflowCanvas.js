import { useCallback } from 'react';
import ReactFlow, { Background, Controls, MiniMap, addEdge, useEdgesState, useNodesState } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

function nodeTitle(node) {
  return node.data?.label || node.id;
}

export default function WorkflowCanvas({ initialNodes = [], initialEdges = [], onChange }) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const onConnect = useCallback((connection) => setEdges((current) => {
    const next = addEdge({ ...connection, animated: true }, current);
    onChange?.(nodes, next);
    return next;
  }), [nodes, onChange, setEdges]);
  const updateNodes = useCallback((changes) => {
    onNodesChange(changes);
  }, [onNodesChange]);
  const finishNodeChange = useCallback(() => onChange?.(nodes, edges), [nodes, edges, onChange]);

  return <div className="flow-canvas"><ReactFlow nodes={nodes.map((node) => ({ ...node, data: { ...node.data, label: nodeTitle(node) } }))} edges={edges} onNodesChange={updateNodes} onNodeDragStop={finishNodeChange} onEdgesChange={(changes) => { onEdgesChange(changes); onChange?.(nodes, edges); }} onConnect={onConnect} fitView deleteKeyCode="Backspace" proOptions={{ hideAttribution: true }}><Background color="#dbe2e8" gap={22} size={1} /><MiniMap pannable zoomable nodeColor={(node) => node.type === 'triggerNode' ? '#c54c32' : '#208e78'} /><Controls /></ReactFlow></div>;
}
class PlannerAgent {
  /**
   * Plans the topological execution order of workflow nodes
   * Pure agent: No HTTP or DB dependencies
   */
  async plan({ nodes = [], edges = [], inputs = {} }) {
    const startTime = Date.now();

    if (!nodes || nodes.length === 0) {
      throw new Error('PlannerAgent: Cannot plan execution for empty workflow graph');
    }

    // Build in-degree map and adjacency list for topological sort (Kahn's Algorithm)
    const inDegree = new Map();
    const adjList = new Map();

    nodes.forEach(node => {
      inDegree.set(node.id, 0);
      adjList.set(node.id, []);
    });

    edges.forEach(edge => {
      if (adjList.has(edge.source) && inDegree.has(edge.target)) {
        adjList.get(edge.source).push(edge.target);
        inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
      }
    });

    // Queue nodes with in-degree 0 (triggers or start nodes)
    const queue = [];
    nodes.forEach(node => {
      if (inDegree.get(node.id) === 0) {
        queue.push(node.id);
      }
    });

    const executionOrderIds = [];
    while (queue.length > 0) {
      const currId = queue.shift();
      executionOrderIds.push(currId);

      const neighbors = adjList.get(currId) || [];
      for (const neighbor of neighbors) {
        inDegree.set(neighbor, inDegree.get(neighbor) - 1);
        if (inDegree.get(neighbor) === 0) {
          queue.push(neighbor);
        }
      }
    }

    // Check for cycles
    let hasCycle = false;
    if (executionOrderIds.length < nodes.length) {
      hasCycle = true;
      // Append remaining nodes safely
      nodes.forEach(n => {
        if (!executionOrderIds.includes(n.id)) {
          executionOrderIds.push(n.id);
        }
      });
    }

    // Map node objects in order
    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    const plannedNodes = executionOrderIds.map(id => nodeMap.get(id)).filter(Boolean);

    // Compute confidence score
    let confidenceScore = 0.98;
    if (hasCycle) confidenceScore -= 0.3;
    if (nodes.length > 10) confidenceScore -= 0.05;
    if (edges.length === 0 && nodes.length > 1) confidenceScore -= 0.2;

    const planningDuration = Date.now() - startTime;

    return {
      success: true,
      executionOrder: plannedNodes,
      totalSteps: plannedNodes.length,
      hasCycle,
      confidenceScore: Math.max(0.1, Math.min(1.0, confidenceScore)),
      planningDurationMs: planningDuration,
      summary: `Planned ${plannedNodes.length} step(s) with ${Math.round(confidenceScore * 100)}% confidence`,
    };
  }
}

module.exports = new PlannerAgent();

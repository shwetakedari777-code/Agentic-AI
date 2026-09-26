const Execution = require('../models/Execution');
const ExecutionLog = require('../models/ExecutionLog');
const Notification = require('../models/Notification');
const { emitExecutionEvent, emitNotification } = require('../config/socket');

const plannerAgent = require('./plannerAgent');
const executionAgent = require('./executionAgent');
const validationAgent = require('./validationAgent');
const recoveryAgent = require('./recoveryAgent');
const monitoringAgent = require('./monitoringAgent');

class Orchestrator {
  /**
   * Checks LangGraph orchestration substrate availability
   */
  checkLangGraph() {
    try {
      require.resolve('@langchain/langgraph');
      return 'available';
    } catch {
      return 'not-installed';
    }
  }

  /**
   * Helper to persist an ExecutionLog and broadcast via Socket.IO
   */
  async recordAgentStep({ executionId, workflowId, nodeId = null, agent, level = 'info', message, metadata = {} }) {
    try {
      const eventPayload = monitoringAgent.createTimelineEvent({
        executionId,
        workflowId,
        nodeId,
        agent,
        level,
        message,
        metadata,
      });

      // Save to database
      const logDoc = await ExecutionLog.create({
        executionId,
        workflowId,
        nodeId,
        agent,
        level,
        message,
        metadata,
        timestamp: new Date(),
      });

      // Stream via Socket.IO
      emitExecutionEvent(executionId, 'execution:log', logDoc.toObject ? logDoc.toObject() : logDoc);
      return logDoc;
    } catch (err) {
      console.error('[Orchestrator] Error logging agent step:', err.message);
    }
  }

  /**
   * Executes a workflow through the multi-agent chain
   */
  async run({ executionId, workflow, inputs = {}, userId }) {
    const startTime = Date.now();
    const langGraphStatus = this.checkLangGraph();

    let execution = await Execution.findById(executionId);
    if (!execution) {
      throw new Error(`Execution ${executionId} not found`);
    }

    execution.status = 'RUNNING';
    execution.startTime = new Date();
    await execution.save();

    emitExecutionEvent(executionId, 'execution:status', {
      executionId,
      status: 'RUNNING',
      langGraph: langGraphStatus,
    });

    // 1. Initial Orchestrator Step
    await this.recordAgentStep({
      executionId,
      workflowId: workflow._id,
      agent: 'monitoring',
      level: 'info',
      message: `Execution initiated with multi-agent orchestration engine (langGraph: ${langGraphStatus})`,
      metadata: { langGraph: langGraphStatus, triggerType: execution.triggerType },
    });

    const executionState = {
      inputs,
      outputs: {},
      errors: [],
    };

    let totalRetries = 0;

    try {
      // 2. Planner Agent Step
      await this.recordAgentStep({
        executionId,
        workflowId: workflow._id,
        agent: 'planner',
        level: 'info',
        message: 'Planner Agent analyzing workflow nodes, dependencies, and topological sequence...',
      });

      const planResult = await plannerAgent.plan({
        nodes: workflow.nodes,
        edges: workflow.edges,
        inputs,
      });

      await this.recordAgentStep({
        executionId,
        workflowId: workflow._id,
        agent: 'planner',
        level: 'success',
        message: `Plan generated: ${planResult.summary}`,
        metadata: {
          confidenceScore: planResult.confidenceScore,
          stepCount: planResult.totalSteps,
          executionOrder: planResult.executionOrder.map(n => n.id),
        },
      });

      // 3. Sequential Node Execution Loop
      for (let i = 0; i < planResult.executionOrder.length; i++) {
        const node = planResult.executionOrder[i];

        // Check if execution was paused or cancelled by operator
        const currentExecutionState = await Execution.findById(executionId);
        if (currentExecutionState.status === 'PAUSED') {
          await this.recordAgentStep({
            executionId,
            workflowId: workflow._id,
            nodeId: node.id,
            agent: 'monitoring',
            level: 'warning',
            message: `Execution paused by operator before step "${node.data?.label || node.id}"`,
          });
          return currentExecutionState;
        }

        if (currentExecutionState.status === 'CANCELLED') {
          await this.recordAgentStep({
            executionId,
            workflowId: workflow._id,
            nodeId: node.id,
            agent: 'monitoring',
            level: 'warning',
            message: `Execution cancelled by operator. Aborting remaining steps.`,
          });
          return currentExecutionState;
        }

        execution.currentNode = node.id;
        await execution.save();

        let stepSuccess = false;
        let attemptCount = 0;
        const maxRetries = 2;

        while (!stepSuccess && attemptCount <= maxRetries) {
          try {
            // Execution Agent Step
            await this.recordAgentStep({
              executionId,
              workflowId: workflow._id,
              nodeId: node.id,
              agent: 'execution',
              level: 'info',
              message: `Execution Agent running node "${node.data?.label || node.id}" (${node.data?.provider || 'system'}.${node.data?.action || 'run'})`,
              metadata: { attempt: attemptCount + 1 },
            });

            const execResult = await executionAgent.executeNode({
              node,
              executionState,
              userId,
            });

            // Validation Agent Step
            await this.recordAgentStep({
              executionId,
              workflowId: workflow._id,
              nodeId: node.id,
              agent: 'validation',
              level: 'info',
              message: `Validation Agent inspecting schema contracts for "${node.data?.label || node.id}"`,
            });

            const valResult = await validationAgent.validateNodeOutput({
              node,
              executionResult: execResult,
            });

            await this.recordAgentStep({
              executionId,
              workflowId: workflow._id,
              nodeId: node.id,
              agent: 'validation',
              level: 'success',
              message: `Validation verified: [${valResult.verifiedFields.join(', ')}]`,
              metadata: { verifiedFields: valResult.verifiedFields },
            });

            // Store outputs in executionState
            executionState.outputs[node.id] = execResult.output;
            stepSuccess = true;

            await this.recordAgentStep({
              executionId,
              workflowId: workflow._id,
              nodeId: node.id,
              agent: 'execution',
              level: 'success',
              message: `Node "${node.data?.label || node.id}" completed successfully (${execResult.durationMs}ms)`,
              metadata: { output: execResult.output, durationMs: execResult.durationMs },
            });
          } catch (stepErr) {
            console.error(`[Orchestrator] Error on node ${node.id}:`, stepErr.message);

            // Recovery Agent Step
            await this.recordAgentStep({
              executionId,
              workflowId: workflow._id,
              nodeId: node.id,
              agent: 'recovery',
              level: 'warning',
              message: `Failure on node "${node.data?.label || node.id}": ${stepErr.message}. Invoking Recovery Agent...`,
            });

            const recoveryPlan = await recoveryAgent.recover({
              error: stepErr,
              node,
              attemptCount,
              maxRetries,
            });

            if (recoveryPlan.strategy === 'retry_with_backoff') {
              totalRetries++;
              attemptCount++;
              execution.status = 'RETRYING';
              execution.retryCount = totalRetries;
              await execution.save();

              emitExecutionEvent(executionId, 'execution:status', {
                executionId,
                status: 'RETRYING',
                retryCount: totalRetries,
              });

              await this.recordAgentStep({
                executionId,
                workflowId: workflow._id,
                nodeId: node.id,
                agent: 'recovery',
                level: 'warning',
                message: `Classified as ${recoveryPlan.classification}. Applying backoff delay of ${recoveryPlan.backoffMs}ms before retry ${attemptCount}/${maxRetries}...`,
                metadata: recoveryPlan,
              });

              await new Promise(r => setTimeout(r, Math.min(recoveryPlan.backoffMs, 5000)));
            } else {
              // Strategy: ESCALATE
              await this.recordAgentStep({
                executionId,
                workflowId: workflow._id,
                nodeId: node.id,
                agent: 'recovery',
                level: 'error',
                message: `Classified as ${recoveryPlan.classification}. Recovery Agent escalated failure: ${recoveryPlan.suggestedAction}`,
                metadata: recoveryPlan,
              });

              throw stepErr; // Break execution loop
            }
          }
        }
      }

      // 4. Monitoring Agent Summary & Completion
      const durationMs = Date.now() - startTime;
      execution.status = 'COMPLETED';
      execution.endTime = new Date();
      execution.duration = durationMs;
      execution.outputs = executionState.outputs;
      execution.currentNode = null;
      execution.retryCount = totalRetries;
      await execution.save();

      const summary = monitoringAgent.summarizeExecution({
        executionId,
        status: 'COMPLETED',
        durationMs,
        stepCount: planResult.totalSteps,
        retryCount: totalRetries,
      });

      await this.recordAgentStep({
        executionId,
        workflowId: workflow._id,
        agent: 'monitoring',
        level: 'success',
        message: summary.summary,
        metadata: summary,
      });

      emitExecutionEvent(executionId, 'execution:status', {
        executionId,
        status: 'COMPLETED',
        duration: durationMs,
        outputs: executionState.outputs,
      });

      // Create Success Notification
      const notif = await Notification.create({
        owner: userId,
        workflowId: workflow._id,
        executionId,
        type: 'success',
        title: `Workflow "${workflow.name}" completed successfully`,
        message: `Finished in ${durationMs}ms with ${planResult.totalSteps} steps executed.`,
      });
      emitNotification(userId, notif.toObject ? notif.toObject() : notif);

      return execution;
    } catch (fatalErr) {
      const durationMs = Date.now() - startTime;
      execution.status = 'FAILED';
      execution.endTime = new Date();
      execution.duration = durationMs;
      execution.error = {
        message: fatalErr.message,
        code: fatalErr.code || 'EXECUTION_FAILED',
        nodeId: execution.currentNode,
      };
      await execution.save();

      await this.recordAgentStep({
        executionId,
        workflowId: workflow._id,
        nodeId: execution.currentNode,
        agent: 'monitoring',
        level: 'error',
        message: `Execution terminated with failure: ${fatalErr.message}`,
        metadata: { error: fatalErr.message, code: fatalErr.code },
      });

      emitExecutionEvent(executionId, 'execution:status', {
        executionId,
        status: 'FAILED',
        error: execution.error,
        duration: durationMs,
      });

      // Create Escalation / Failure Notification
      const notif = await Notification.create({
        owner: userId,
        workflowId: workflow._id,
        executionId,
        type: fatalErr.code === 'AUTH_EXPIRED' ? 'escalation' : 'failure',
        title: `Workflow "${workflow.name}" execution failed`,
        message: `Error: ${fatalErr.message}. Node: ${execution.currentNode || 'N/A'}`,
      });
      emitNotification(userId, notif.toObject ? notif.toObject() : notif);

      return execution;
    }
  }
}

module.exports = new Orchestrator();

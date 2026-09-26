const axios = require('axios');
const env = require('../config/env');

class AIService {
  /**
   * Generates a workflow graph from a natural language prompt
   */
  async generateWorkflow(prompt) {
    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      throw new Error('A valid natural language prompt is required to generate a workflow');
    }

    const cleanPrompt = prompt.trim();

    // 1. Try OpenRouter if configured
    if (env.OPENROUTER_API_KEY) {
      try {
        console.log('[AIService] Attempting workflow generation via OpenRouter API...');
        return await this.generateViaOpenRouter(cleanPrompt);
      } catch (err) {
        console.warn('[AIService] OpenRouter failed, attempting fallback:', err.message);
      }
    }

    // 2. Try Google Gemini SDK if configured
    if (env.GEMINI_API_KEY) {
      try {
        console.log('[AIService] Attempting workflow generation via Google Gemini SDK...');
        return await this.generateViaGemini(cleanPrompt);
      } catch (err) {
        console.warn('[AIService] Gemini failed, attempting deterministic fallback:', err.message);
      }
    }

    // 3. Fallback to deterministic rule-based builder
    console.log('[AIService] Generating workflow via Deterministic Rule-Based Engine...');
    return this.generateDeterministicWorkflow(cleanPrompt);
  }

  async generateViaOpenRouter(prompt) {
    const systemPrompt = `You are an expert workflow architect for Agentflow_AI.
Convert the user's natural language request into a valid executable automation workflow.
Respond ONLY with a valid JSON object without markdown fences, matching this structure:
{
  "name": "Concise Workflow Title",
  "description": "Clear description of what this workflow automates",
  "generator": "openrouter",
  "triggerConfig": { "type": "manual|schedule|webhook" },
  "nodes": [
    {
      "id": "node-1",
      "type": "triggerNode",
      "position": { "x": 100, "y": 200 },
      "data": { "label": "Start Trigger", "type": "trigger", "action": "manual_trigger", "config": {} }
    },
    {
      "id": "node-2",
      "type": "actionNode",
      "position": { "x": 400, "y": 200 },
      "data": { "label": "Action Name", "provider": "gmail|slack|discord|google-sheets|ai", "action": "send_email|post_message|append_row|ai_prompt", "config": {} }
    }
  ],
  "edges": [
    { "id": "e1-2", "source": "node-1", "target": "node-2", "animated": true }
  ],
  "tags": ["automated", "category"]
}`;

    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
        temperature: 0.2,
      },
      {
        headers: {
          Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      }
    );

    const raw = response.data.choices[0].message.content.trim();
    const cleanJson = raw.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
    const parsed = JSON.parse(cleanJson);
    parsed.generator = 'openrouter';
    return this.normalizeWorkflowGraph(parsed, prompt);
  }

  async generateViaGemini(prompt) {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const systemPrompt = `You are a workflow designer for Agentflow_AI.
Return ONLY raw JSON with no markdown wrapping.
JSON schema:
{
  "name": "string",
  "description": "string",
  "generator": "gemini",
  "triggerConfig": { "type": "manual|schedule|webhook" },
  "nodes": [
    { "id": "node-1", "type": "triggerNode", "position": { "x": 100, "y": 200 }, "data": { "label": "Trigger", "action": "manual_trigger", "config": {} } },
    { "id": "node-2", "type": "actionNode", "position": { "x": 420, "y": 200 }, "data": { "label": "Step", "provider": "gmail|slack|discord|google-sheets|ai", "action": "send_email|post_message|append_row", "config": {} } }
  ],
  "edges": [
    { "id": "e1-2", "source": "node-1", "target": "node-2", "animated": true }
  ],
  "tags": ["tag1", "tag2"]
}`;

    const result = await model.generateContent(`${systemPrompt}\nUser prompt: ${prompt}`);
    const text = result.response.text();
    const cleanJson = text.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
    const parsed = JSON.parse(cleanJson);
    parsed.generator = 'gemini';
    return this.normalizeWorkflowGraph(parsed, prompt);
  }

  /**
   * Deterministic Rule-Based Builder for 100% offline, guaranteed instant generation
   */
  generateDeterministicWorkflow(prompt) {
    const lower = prompt.toLowerCase();
    let name = 'Automated Operations Workflow';
    let description = `Automated flow created from: "${prompt}"`;
    let tags = ['automation'];
    const nodes = [];
    const edges = [];

    // Base Trigger Node
    nodes.push({
      id: 'node-trigger',
      type: 'triggerNode',
      position: { x: 100, y: 220 },
      data: {
        label: 'Webhook / Event Trigger',
        provider: 'trigger',
        action: 'event_trigger',
        config: { triggerOn: 'immediate', source: 'incoming_webhook' },
      },
    });

    let currentX = 400;
    let prevNodeId = 'node-trigger';

    // Check for AI / Analysis intention
    const needsAI = lower.includes('summarize') || lower.includes('classify') || lower.includes('analyze') || lower.includes('parse') || lower.includes('ai') || lower.includes('sentiment');
    if (needsAI) {
      const aiNodeId = 'node-ai-agent';
      nodes.push({
        id: aiNodeId,
        type: 'actionNode',
        position: { x: currentX, y: 220 },
        data: {
          label: 'AI Reasoning & Data Extraction',
          provider: 'ai',
          action: 'ai_prompt',
          config: {
            task: lower.includes('sentiment') ? 'sentiment_analysis' : 'data_summarization',
            promptTemplate: 'Analyze input payload and extract structured operational entities',
          },
        },
      });
      edges.push({
        id: `e-${prevNodeId}-${aiNodeId}`,
        source: prevNodeId,
        target: aiNodeId,
        animated: true,
      });
      prevNodeId = aiNodeId;
      currentX += 300;
      tags.push('ai-powered');
    }

    // Check for Google Sheets
    const needsSheets = lower.includes('sheet') || lower.includes('row') || lower.includes('lead') || lower.includes('excel') || lower.includes('record');
    if (needsSheets) {
      const sheetNodeId = 'node-sheets';
      nodes.push({
        id: sheetNodeId,
        type: 'actionNode',
        position: { x: currentX, y: 220 },
        data: {
          label: 'Append Record to Google Sheets',
          provider: 'google-sheets',
          action: 'append_row',
          config: {
            spreadsheetId: 'Operational_Records_2026',
            range: 'Sheet1!A:Z',
            values: ['{{trigger.id}}', '{{trigger.name}}', '{{trigger.email}}', 'Processed'],
          },
        },
      });
      edges.push({
        id: `e-${prevNodeId}-${sheetNodeId}`,
        source: prevNodeId,
        target: sheetNodeId,
        animated: true,
      });
      prevNodeId = sheetNodeId;
      currentX += 300;
      tags.push('google-sheets');
    }

    // Check for Slack or Discord notification
    const needsSlack = lower.includes('slack') || lower.includes('channel') || (!lower.includes('discord') && !lower.includes('email') && !needsSheets);
    const needsDiscord = lower.includes('discord');

    if (needsSlack) {
      const slackNodeId = 'node-slack';
      nodes.push({
        id: slackNodeId,
        type: 'actionNode',
        position: { x: currentX, y: 220 },
        data: {
          label: 'Post Alert to Slack Channel',
          provider: 'slack',
          action: 'post_message',
          config: {
            channel: '#ops-alerts',
            message: `🚀 Operational Event: Automation triggered successfully. Status: OK.`,
          },
        },
      });
      edges.push({
        id: `e-${prevNodeId}-${slackNodeId}`,
        source: prevNodeId,
        target: slackNodeId,
        animated: true,
      });
      prevNodeId = slackNodeId;
      currentX += 300;
      tags.push('slack');
    }

    if (needsDiscord) {
      const discordNodeId = 'node-discord';
      nodes.push({
        id: discordNodeId,
        type: 'actionNode',
        position: { x: currentX, y: 220 },
        data: {
          label: 'Broadcast to Discord Channel',
          provider: 'discord',
          action: 'post_message',
          config: {
            channelId: 'ops-feed',
            message: `🔔 Discord Notification: New pipeline event received.`,
          },
        },
      });
      edges.push({
        id: `e-${prevNodeId}-${discordNodeId}`,
        source: prevNodeId,
        target: discordNodeId,
        animated: true,
      });
      prevNodeId = discordNodeId;
      currentX += 300;
      tags.push('discord');
    }

    // Check for Gmail / Email
    const needsEmail = lower.includes('email') || lower.includes('gmail') || lower.includes('mail') || lower.includes('send to') || lower.includes('invoice');
    if (needsEmail) {
      const emailNodeId = 'node-gmail';
      // Match possible email address in prompt
      const emailMatch = prompt.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/i);
      const targetEmail = emailMatch ? emailMatch[1] : 'operator@agentflow.ai';

      nodes.push({
        id: emailNodeId,
        type: 'actionNode',
        position: { x: currentX, y: 220 },
        data: {
          label: 'Dispatch Automated Gmail',
          provider: 'gmail',
          action: 'send_email',
          config: {
            to: targetEmail,
            subject: 'Automated Operations Notification',
            body: 'Hello,\n\nYour automated task has executed successfully across all integrated agent steps.',
          },
        },
      });
      edges.push({
        id: `e-${prevNodeId}-${emailNodeId}`,
        source: prevNodeId,
        target: emailNodeId,
        animated: true,
      });
      tags.push('gmail');
    }

    // Set intelligent title
    if (lower.includes('invoice')) {
      name = 'Invoice Processing & Routing Flow';
      tags.push('finance');
    } else if (lower.includes('lead')) {
      name = 'Lead Ingestion & Welcome Sequence';
      tags.push('growth');
    } else if (lower.includes('customer') || lower.includes('support')) {
      name = 'Customer Support Ticket Dispatcher';
      tags.push('support');
    } else if (lower.includes('incident') || lower.includes('alert')) {
      name = 'Critical Incident Multi-Channel Escalation';
      tags.push('monitoring');
    } else {
      name = prompt.length < 50 ? prompt.charAt(0).toUpperCase() + prompt.slice(1) : 'Multi-Agent Operations Flow';
    }

    return {
      name,
      description,
      generator: 'deterministic-engine',
      triggerConfig: { type: 'manual' },
      nodes,
      edges,
      tags: Array.from(new Set(tags)),
    };
  }

  normalizeWorkflowGraph(parsed, originalPrompt) {
    if (!parsed || !Array.isArray(parsed.nodes) || parsed.nodes.length === 0) {
      return this.generateDeterministicWorkflow(originalPrompt);
    }

    // Ensure all nodes have valid positions and IDs
    parsed.nodes = parsed.nodes.map((node, index) => ({
      id: node.id || `node-${index + 1}`,
      type: node.type || (index === 0 ? 'triggerNode' : 'actionNode'),
      position: node.position || { x: 100 + index * 300, y: 220 },
      data: {
        label: node.data?.label || `Step ${index + 1}`,
        provider: node.data?.provider || 'ai',
        action: node.data?.action || 'run',
        config: node.data?.config || {},
      },
    }));

    if (!Array.isArray(parsed.edges)) {
      parsed.edges = [];
      for (let i = 0; i < parsed.nodes.length - 1; i++) {
        parsed.edges.push({
          id: `e-${parsed.nodes[i].id}-${parsed.nodes[i + 1].id}`,
          source: parsed.nodes[i].id,
          target: parsed.nodes[i + 1].id,
          animated: true,
        });
      }
    }

    return {
      name: parsed.name || 'AI Generated Automation Workflow',
      description: parsed.description || `Generated from prompt: "${originalPrompt}"`,
      generator: parsed.generator || 'ai-engine',
      triggerConfig: parsed.triggerConfig || { type: 'manual' },
      nodes: parsed.nodes,
      edges: parsed.edges,
      tags: Array.isArray(parsed.tags) ? parsed.tags : ['automated', 'ai-generated'],
    };
  }
}

module.exports = new AIService();

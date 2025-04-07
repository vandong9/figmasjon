// Define interfaces for the data
interface NodeData {
  type: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  otherProperties?: Record<string, any>; // Optional additional properties
  children?: NodeData[]; // Optional children array for nested nodes
}

interface SelectionData {
  pageName: string;
  pageId: string;
  selectedNodes: NodeData[];
}

// Message type for UI communication
type UIMessage = { type: 'export'; data: string };

// Recursively process a node and its descendants
function processNode(node: SceneNode): NodeData {
  const nodeData: NodeData = {
    type: node.type,
    name: node.name,
    x: node.x,
    y: node.y,
    width: node.width,
    height: node.height,
    otherProperties: Object.keys(node),
  };

  // If the node has children, process them recursively
  if ('children' in node && node.children.length > 0) {
    nodeData.children = node.children.map((child: SceneNode) => processNode(child));
  }

  return nodeData;
}

// Main plugin logic
function exportSelectedWithDescendantsToJSON() {
  const currentPage: PageNode = figma.currentPage;
  const selection: readonly SceneNode[] = figma.currentPage.selection;

  // Check if anything is selected
  if (selection.length === 0) {
    figma.ui.postMessage({
      type: 'export',
      data: JSON.stringify({ error: 'No elements selected' }, null, 2),
    } as UIMessage);
    return;
  }

  // Gather data for selected nodes and their descendants
  const selectionData: SelectionData = {
    pageName: currentPage.name,
    pageId: currentPage.id,
    selectedNodes: selection.map((node: SceneNode) => processNode(node)),
  };

  // Convert to JSON string
  const jsonData: string = JSON.stringify(selectionData, null, 2);

  // Send JSON to UI for display and download
  figma.ui.postMessage({ type: 'export', data: jsonData } as UIMessage);
}

// Set up UI
figma.showUI(__html__, { width: 300, height: 400 });

// Handle UI messages
figma.ui.onmessage = (msg: any) => {
  if (msg.type === 'close') {
    figma.closePlugin();
  }
};

// Run the export
exportSelectedWithDescendantsToJSON();
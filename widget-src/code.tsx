// Define interfaces for the data
interface NodeData {
  type: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  id: string;
  visible: boolean;
  children?: NodeData[]; // Optional children array for nested nodes
}

// Specific node type interfaces
interface FrameNodeData extends NodeData {
  layoutMode?: string;
  primaryAxisSizingMode?: string;
  counterAxisSizingMode?: string;
  paddingLeft?: number;
  paddingRight?: number;
  paddingTop?: number;
  paddingBottom?: number;
}

interface TextNodeData extends NodeData {
  characters: string;
  fontSize?: number;
  fontName?: FontName;
  textAlignHorizontal?: string;
  textAlignVertical?: string;
  fills?: Paint[];
}

interface RectangleNodeData extends NodeData {
  cornerRadius?: number;
  fills?: Paint[];
  strokes?: Paint[];
  strokeWeight?: number;
}

interface ComponentNodeData extends NodeData {
  componentId: string;
  instanceName: string;
}

interface GroupNodeData extends NodeData {
  // Group-specific properties can be added here
}

interface VectorNodeData extends NodeData {
  vectorNetwork?: VectorNetwork;
  vectorPaths?: VectorPath[];
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
  let nodeData: NodeData = {
    type: node.type,
    name: node.name,
    x: node.x,
    y: node.y,
    width: node.width,
    height: node.height,
    id: node.id,
    visible: node.visible
  };

  // Add type-specific properties based on node type
  switch (node.type) {
    case 'FRAME':
    case 'INSTANCE':
    case 'COMPONENT':
      const frameNode = node as FrameNode | InstanceNode | ComponentNode;
      const frameData = nodeData as FrameNodeData;
      if ('layoutMode' in frameNode) {
        frameData.layoutMode = frameNode.layoutMode;
        frameData.primaryAxisSizingMode = frameNode.primaryAxisSizingMode;
        frameData.counterAxisSizingMode = frameNode.counterAxisSizingMode;
        frameData.paddingLeft = frameNode.paddingLeft;
        frameData.paddingRight = frameNode.paddingRight;
        frameData.paddingTop = frameNode.paddingTop;
        frameData.paddingBottom = frameNode.paddingBottom;
      }
      nodeData = frameData;
      break;
      
    case 'TEXT':
      const textNode = node as TextNode;
      const textData = nodeData as TextNodeData;
      textData.characters = textNode.characters;
      textData.fontSize = textNode.fontSize === figma.mixed ? undefined : textNode.fontSize;
      textData.fontName = textNode.fontName === figma.mixed ? undefined : textNode.fontName;
      textData.textAlignHorizontal = textNode.textAlignHorizontal;
      textData.textAlignVertical = textNode.textAlignVertical;
      textData.fills = textNode.fills === figma.mixed ? undefined : textNode.fills as Paint[];
      nodeData = textData;
      break;
      
    case 'RECTANGLE':
      const rectNode = node as RectangleNode;
      const rectData = nodeData as RectangleNodeData;
      rectData.cornerRadius = rectNode.cornerRadius === figma.mixed ? undefined : rectNode.cornerRadius;
      rectData.fills = rectNode.fills === figma.mixed ? undefined : rectNode.fills as Paint[];
      rectData.strokes = rectNode.strokes as Paint[];
      rectData.strokeWeight = rectNode.strokeWeight === figma.mixed ? undefined : rectNode.strokeWeight;
      nodeData = rectData;
      break;

    case 'COMPONENT_SET':
      const componentSetData = nodeData as ComponentNodeData;
      componentSetData.componentId = node.id;
      componentSetData.instanceName = node.name;
      nodeData = componentSetData;
      break;
      
    case 'COMPONENT':
      const componentNode = node as ComponentNode;
      const componentData = nodeData as ComponentNodeData;
      componentData.componentId = componentNode.id;
      componentData.instanceName = componentNode.name;
      nodeData = componentData;
      break;
      
    case 'VECTOR':
      const vectorNode = node as VectorNode;
      const vectorData = nodeData as VectorNodeData;
      // Add vector-specific properties if needed
      nodeData = vectorData;
      break;
  }

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
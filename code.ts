// This file holds the main code for the plugin. It has access to the *document*.
// You can access browser APIs such as the network by creating a UI which contains
// a full browser environment (see documentation).

// Runs this code if the plugin is run in Figma
if (figma.editorType === 'figma') {
  // This plugin will open a window to prompt the user to enter a number, and
  // it will then create that many rectangles on the screen.

  // This shows the HTML page in "ui.html".
  figma.showUI(__html__);

  // Calls to "parent.postMessage" from within the HTML page will trigger this
  // callback. The callback will be passed the "pluginMessage" property of the
  // posted message.
  figma.ui.onmessage = msg => {
    if (msg.type === 'calculate'){
      const varToCalculate = msg.variables;
      console.log('calculate')
      for (let v in msg.variables){
        const searchString = '{' + v + '}';
        const searchValue = msg.variables[v];

        console.log('search string : ', searchString, searchValue)
        handleSearchReplaceRequest(searchString, searchValue);
      }
    }

    // Make sure to close the plugin when you're done. Otherwise the plugin will
    // keep running, which shows the cancel button at the bottom of the screen.
    figma.closePlugin();
  };

// If the plugins isn't run in Figma, run this code
} else {
  // This plugin will open a window to prompt the user to enter a number, and
  // it will then create that many shapes and connectors on the screen.

  // This shows the HTML page in "ui.html".
  figma.showUI(__html__);

  // Calls to "parent.postMessage" from within the HTML page will trigger this
  // callback. The callback will be passed the "pluginMessage" property of the
  // posted message.
  figma.ui.onmessage = msg => {
    // One way of distinguishing between different types of messages sent from
    // your HTML page is to use an object with a "type" property like this.
    if (msg.type === 'create-shapes') {
      const numberOfShapes = msg.count;
      const nodes: SceneNode[] = [];
      for (let i = 0; i < numberOfShapes; i++) {
        const shape = figma.createShapeWithText();
        // You can set shapeType to one of: 'SQUARE' | 'ELLIPSE' | 'ROUNDED_RECTANGLE' | 'DIAMOND' | 'TRIANGLE_UP' | 'TRIANGLE_DOWN' | 'PARALLELOGRAM_RIGHT' | 'PARALLELOGRAM_LEFT'
        shape.shapeType = 'ROUNDED_RECTANGLE'
        shape.x = i * (shape.width + 200);
        shape.fills = [{type: 'SOLID', color: {r: 1, g: 0.5, b: 0}}];
        figma.currentPage.appendChild(shape);
        nodes.push(shape);
      };

      for (let i = 0; i < (numberOfShapes - 1); i++) {
        const connector = figma.createConnector();
        connector.strokeWeight = 8

        connector.connectorStart = {
          endpointNodeId: nodes[i].id,
          magnet: 'AUTO',
        };

        connector.connectorEnd = {
          endpointNodeId: nodes[i+1].id,
          magnet: 'AUTO',
        };
      };

      figma.currentPage.selection = nodes;
      figma.viewport.scrollAndZoomIntoView(nodes);
    }

    if (msg.type === 'calculate') {
      const varToCalculate = msg.variables;
      console.log('calculate')
      for (let v in msg.variables){
        const searchString = '{' + v + '}';
        const searchValue = msg.variables[v];

        console.log('search string : ', searchString, searchValue)
        handleSearchReplaceRequest(searchString, searchValue);
      }

      // figma.currentPage.selection = nodes;
      // figma.viewport.scrollAndZoomIntoView(nodes);
    }

    // Make sure to close the plugin when you're done. Otherwise the plugin will
    // keep running, which shows the cancel button at the bottom of the screen.
    figma.closePlugin();
  };
};

// Function to search for a specific string in text layers
async function searchAndReplaceString(node : any, searchString : string, replaceString : string) {
  if (node.type === 'TEXT') {
    await figma.loadFontAsync(node.fontName);
    console.log('after async')
    if (node.characters.includes(searchString)) {
      console.log('search and replace strings :', searchString, replaceString, ' in : ', node.characters)
      const updatedCharacters = node.characters.split(searchString).join(replaceString);
      node.characters = updatedCharacters;
    }
  } else if ('children' in node) {
    for (const childNode of node.children) {
      searchAndReplaceString(childNode, searchString, replaceString);
    }
  }
}

// Function to handle the search and replace request
async function handleSearchReplaceRequest(searchString : string , replaceString : string) {
  const selectedArtboard = figma.currentPage.selection[0];

  if (selectedArtboard.type === 'FRAME') {
    const textLayers = selectedArtboard.findAll(node => node.type === 'TEXT');

    textLayers.forEach(async layer => {
      await searchAndReplaceString(layer, searchString, replaceString);
    });

    if (textLayers.length > 0){
      figma.notify('Text replaced successfully.');
    } else {
      figma.notify('No occurence of specified variable found.')
    }

  } else {
    figma.notify('Please select an artboard.');
  }
}
